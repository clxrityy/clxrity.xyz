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

async function forwardToExec(req: Request, body: any, opts?: { background?: boolean }) {
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
    if (opts?.background) fwdHeaders['x-background-dispatch'] = '1';
    if (opts?.background) {
        // Fire-and-forget: we don't await response; log errors but still return to Discord quickly.
        try {
            fetch(url.toString(), {
                method: 'POST',
                headers: fwdHeaders,
                body: JSON.stringify(body),
            }).catch(err => console.error('[bg:forward:error]', err?.message || err));
        } catch (err: any) {
            console.error('[bg:forward:sync-error]', err?.message || err);
        }
        return null;
    } else {
        try {
            const res = await fetch(url.toString(), {
                method: 'POST',
                headers: fwdHeaders,
                body: JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({ type: 4, data: { content: 'Internal error', flags: 64 } }));
            return Response.json(json, { status: res.status });
        } catch (e: any) {
            const msg = e?.message ? `Forward error: ${e.message}` : 'Forward error';
            return Response.json({ type: 4, data: { content: msg, flags: 64 } }, { status: 502 });
        }
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
    // For all other interactions:
    // Slash command type 2 or component/types that we want to handle via Node.
    // Strategy: Always send a defer (type 5) from Edge (fast) then background forward to Node.
    if (body?.type === 2 || body?.type === 3 || body?.type === 5) {
        // Do not defer pings handled above.
        const interactionName = body?.data?.name;
        const isEphemeralDefer = interactionName === 'config' || interactionName === 'embed' || interactionName === 'birthday';
        // Special-case: opening a modal must be synchronous (component click -> modal response)
        const customId = body?.data?.custom_id;
        if (body?.type === 3 && customId === 'config:message_edit') {
            const res = await forwardToExec(req, body, { background: false });
            return res || Response.json({ type: 4, data: { content: 'Error', flags: 64 } }, { status: 500 });
        }
        await forwardToExec(req, body, { background: true });
        const elapsed = Date.now() - t0;
        try { recordLatency(elapsed, interactionName); } catch { }
        return Response.json({ type: 5, data: { flags: isEphemeralDefer ? 64 : undefined } });
    }
    // Fallback for unexpected types: forward synchronously.
    const res = await forwardToExec(req, body);
    const elapsed = Date.now() - t0;
    try { recordLatency(elapsed, body?.data?.name); } catch { }
    return res || Response.json({ type: 4, data: { content: 'Unhandled', flags: 64 } }, { status: 400 });
}

// --- Lightweight in-memory latency tracking (per Edge isolate instance) ---
// Not durable across cold starts; good enough for ad-hoc p95 visibility in logs.
const _latSamples: number[] = [];
let _latLogCounter = 0;
function recordLatency(ms: number, name?: string) {
    _latSamples.push(ms);
    if (_latSamples.length > 500) _latSamples.splice(0, _latSamples.length - 500); // keep last 500
    if (++_latLogCounter % 25 === 0) {
        const p95 = percentile(_latSamples, 0.95);
        console.log('[metrics] edge_latency', { count: _latSamples.length, p95, last: ms, cmd: name });
    }
}
function percentile(arr: number[], p: number) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[idx];
}
