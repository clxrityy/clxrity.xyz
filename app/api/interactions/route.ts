export const runtime = 'edge';

import nacl from 'tweetnacl';
import { dispatch, type CommandContext, replyToInteractionData } from '@/lib/commands/types';
import { registry } from '@/lib/commands/registry';

// registry is imported from shared module

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

export async function POST(req: Request) {
    // Verify Discord signature
    const bodyText = await verifyDiscordRequest(req);
    if (!bodyText) return new Response('Bad request signature', { status: 401 });

    const body = JSON.parse(bodyText);

    // PING
    if (body?.type === 1) {
        return Response.json({ type: 1 });
    }

    // APPLICATION_COMMAND
    if (body?.type === 2) {
        const name: string | undefined = body?.data?.name;
        const options: Array<{ name: string; value: unknown }> = body?.data?.options ?? [];
        const args = Object.fromEntries(options.map((o: any) => [o.name, o.value]));

        const ctx: CommandContext = {
            req,
            headers: req.headers,
            ip: req.headers.get('x-forwarded-for'),
            now: () => new Date(),
            discord: {
                applicationId: body?.application_id,
                guildId: body?.guild_id ?? null,
                channelId: body?.channel_id ?? null,
                userId: body?.member?.user?.id ?? body?.user?.id ?? null,
                memberRoleIds: Array.isArray(body?.member?.roles) ? body.member.roles : [],
                signatureTimestamp: req.headers.get('x-signature-timestamp') || undefined,
            },
        };

        try {
            if (!name) throw new Error('Missing command name');
            const result: unknown = await dispatch(registry, ctx, name, args);
            const data = replyToInteractionData((result as any) ?? '✅ Command executed.');
            return Response.json({ type: 4, data });
        } catch (err: any) {
            const msg = err?.message || 'Command failed';
            return Response.json({
                type: 4,
                data: { content: `❌ ${msg}`, flags: 64 },
            });
        }
    }

    // Unsupported
    return new Response('Unhandled interaction type', { status: 400 });
}
