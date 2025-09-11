export const runtime = 'edge';

import nacl from 'tweetnacl';
import { dispatch, type CommandContext, replyToInteractionData } from '@/lib/commands/types';
import { registry } from '@/lib/commands/registry';
import { getGuildConfig, upsertGuildConfig } from '@/lib/db/config';
import { buildConfigMenuResponse } from '@/lib/discord/components';
import { hasAdminPermission, hasRole } from '@/lib/discord/permissions';

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

function buildCtx(req: Request, body: any): CommandContext {
    const resolvedUsers = body?.data?.resolved?.users || undefined;
    const memberPerms = body?.member?.permissions || undefined;
    return {
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
            permissions: memberPerms,
            resolvedUsers,
        },
    };
}

async function handleCommand(req: Request, body: any) {
    const name: string | undefined = body?.data?.name;
    const options: Array<{ name: string; value: unknown }> = body?.data?.options ?? [];
    const args = Object.fromEntries(options.map((o: any) => [o.name, o.value]));
    const ctx = buildCtx(req, body);
    try {
        if (!name) throw new Error('Missing command name');
        const result: unknown = await dispatch(registry, ctx, name, args);
        const data = replyToInteractionData((result as any) ?? '✅ Command executed.');
        return Response.json({ type: 4, data });
    } catch (err: any) {
        const msg = err?.message || 'Command failed';
        return Response.json({ type: 4, data: { content: `❌ ${msg}`, flags: 64 } });
    }
}

async function handleComponent(body: any) {
    const customId: string | undefined = body?.data?.custom_id;
    const guildId: string | undefined = body?.guild_id;
    if (!customId || !guildId) return new Response('Bad interaction', { status: 400 });

    if (customId.startsWith('config:')) {
        const key = customId.split(':')[1];
        const cfg = await getGuildConfig(guildId);
        const roles: string[] = Array.isArray(body?.member?.roles) ? body.member.roles : [];
        const perms: string | undefined = body?.member?.permissions;
        if (!(hasAdminPermission(perms) || hasRole(roles, cfg?.adminRoleId))) {
            return Response.json({ type: 4, data: { content: 'Unauthorized', flags: 64 } });
        }

        let patch: any = {};
        if (key === 'admin_role') {
            const values: string[] = body?.data?.values || [];
            patch.adminRoleId = values[0] || null;
        } else if (key === 'birthday_role') {
            const values: string[] = body?.data?.values || [];
            patch.birthdayRoleId = values[0] || null;
        } else if (key === 'birthday_channel') {
            const values: string[] = body?.data?.values || [];
            patch.birthdayChannel = values[0] || null;
        } else if (key === 'changeable_toggle') {
            patch.changeable = !cfg?.changeable;
        }

        const updated = await upsertGuildConfig({ guildId, ...patch });
        const reply = buildConfigMenuResponse(updated);
        return Response.json({ type: 7, data: replyToInteractionData(reply) });
    }

    return new Response('Unhandled component', { status: 400 });
}

export async function POST(req: Request) {
    const bodyText = await verifyDiscordRequest(req);
    if (!bodyText) return new Response('Bad request signature', { status: 401 });
    const body = JSON.parse(bodyText);
    if (body?.type === 1) return Response.json({ type: 1 });
    if (body?.type === 2) return handleCommand(req, body);
    if (body?.type === 3 || body?.type === 5) return handleComponent(body);
    return new Response('Unhandled interaction type', { status: 400 });
}
