export const runtime = 'edge';

import nacl from 'tweetnacl';
import { buildPingEmbed } from '@/lib/commands/pingUtil';
function hexToUint8Array(hex: string) {
    if (!/^([0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid hex');
    const len = hex.length / 2;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
}

async function verifyDiscordRequest(req: Request) {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!signature || !timestamp || !publicKey) return false;

    const body = await req.text();
    const message = new TextEncoder().encode(timestamp + body);
    const sig = hexToUint8Array(signature);
    const key = hexToUint8Array(publicKey);
    const ok = nacl.sign.detached.verify(message, sig, key);
    return ok ? body : false;
}

async function forwardToExec(req: Request, body: any) {
    const secret = process.env.INTERNAL_INTERACTIONS_SECRET || '';
    // Derive origin robustly: prefer forwarded proto/host, fall back to req.url
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
    const url = new URL('/api/interactions/exec', origin);
    const fwdHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-internal-interactions': secret,
    };
    const sigTs = req.headers.get('x-signature-timestamp');
    if (sigTs) fwdHeaders['x-signature-timestamp'] = sigTs;
    const xff = req.headers.get('x-forwarded-for');
    if (xff) fwdHeaders['x-forwarded-for'] = xff;
    try {
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: fwdHeaders,
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({ type: 4, data: { content: 'Internal error', flags: 64 } }));
        return Response.json(json, { status: res.status });
    } catch (e: any) {
        // Return ephemeral error to Discord to avoid timeouts
        const msg = e?.message ? `Forward error: ${e.message}` : 'Forward error';
        return Response.json({ type: 4, data: { content: msg, flags: 64 } }, { status: 502 });
    }
}

export async function POST(req: Request) {
    const t0 = Date.now();
    const bodyText = await verifyDiscordRequest(req);
    if (!bodyText) return new Response('Bad request signature', { status: 401 });
    let body: any;
    try {
        body = JSON.parse(bodyText);
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }
    // Discord ping (handshake)
    if (body?.type === 1) return Response.json({ type: 1 });
    // Fast path for /ping using shared embed builder (avoids Node cold starts while preserving latency display)
    if (body?.type === 2 && body?.data?.name === 'ping') {
        const sigTs = req.headers.get('x-signature-timestamp');
        const embed = buildPingEmbed({ signatureTimestamp: sigTs, nowMs: Date.now() });
        return Response.json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
    // Forward everything else.
    const res = await forwardToExec(req, body);
    try {
        // Basic timing log (Edge console shows in Vercel logs)
        console.log('[interactions-edge] forwarded', {
            name: body?.data?.name,
            type: body?.type,
            ms: Date.now() - t0
        });
    } catch { /* ignore logging errors */ }
    return res;
}
