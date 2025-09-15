export const runtime = 'edge';

import nacl from 'tweetnacl';
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
    const url = new URL('/api/interactions/exec', req.url);
    const fwdHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-internal-interactions': secret,
    };
    const sigTs = req.headers.get('x-signature-timestamp');
    if (sigTs) fwdHeaders['x-signature-timestamp'] = sigTs;
    const xff = req.headers.get('x-forwarded-for');
    if (xff) fwdHeaders['x-forwarded-for'] = xff;
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: fwdHeaders,
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ type: 4, data: { content: 'Internal error', flags: 64 } }));
    return Response.json(json, { status: res.status });
}

export async function POST(req: Request) {
    const bodyText = await verifyDiscordRequest(req);
    if (!bodyText) return new Response('Bad request signature', { status: 401 });
    const body = JSON.parse(bodyText);
    if (body?.type === 1) return Response.json({ type: 1 });
    return forwardToExec(req, body);
}
