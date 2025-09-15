export const runtime = 'edge';

import nacl from 'tweetnacl';
import { dispatch, type CommandContext, replyToInteractionData } from '@/lib/commands/types';
import { getGuildConfig, upsertGuildConfig } from '@/lib/db/config';
import { errorEmbedFromError } from '@/lib/discord/embed';
import { hasAdminPermission, hasRole } from '@/lib/discord/permissions';
// Birthday UI builders will be loaded on demand per-handler to keep Edge bundle small
// Help/config helpers are also lazy-loaded where used

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
        // Lazy-load the command registry to keep the Edge bundle small
        const { registry } = await import('@/lib/commands/registry');
        const result: unknown = await dispatch(registry, ctx, name, args);
        const data = replyToInteractionData((result as any) ?? '✅ Command executed.');
        return Response.json({ type: 4, data });
    } catch (err: any) {
        const embed = errorEmbedFromError(err, { title: 'Command Error', includeStack: false });
        return Response.json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
}

async function handleComponent(body: any) {
    const customId: string | undefined = body?.data?.custom_id;
    const guildId: string | undefined = body?.guild_id;
    if (!customId || !guildId) return new Response('Bad interaction', { status: 400 });

    if (customId.startsWith('help:page:')) {
        return handleHelpPageInteraction(customId);
    }

    if (customId.startsWith('config:')) {
        return handleConfigInteraction(customId, body, guildId);
    }

    // Birthday flow handlers
    if (customId.startsWith('bday')) {
        return handleBirthdayInteraction(customId, body, guildId);
    }

    return new Response('Unhandled component', { status: 400 });
}

async function handleHelpPageInteraction(customId: string) {
    const parts = customId.split(':');
    const pageStr = parts[2];
    if (pageStr === 'noop') {
        // No update required
        return new Response('No-op', { status: 200 });
    }
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const [{ registry }, { buildHelpPageResponse }] = await Promise.all([
        import('@/lib/commands/registry'),
        import('@/lib/commands/helpEmbed')
    ]);
    const commands = registry.list();
    const reply = buildHelpPageResponse(commands, page);
    return Response.json({ type: 7, data: replyToInteractionData(reply) });
}

async function handleConfigInteraction(customId: string, body: any, guildId: string) {
    const key = customId.split(':')[1];
    const cfg = await getGuildConfig(guildId);
    const roles: string[] = Array.isArray(body?.member?.roles) ? body.member.roles : [];
    const perms: string | undefined = body?.member?.permissions;

    if (!(hasAdminPermission(perms) || hasRole(roles, cfg?.adminRoleId))) {
        const embed = errorEmbedFromError(new Error('Unauthorized'), { title: 'Access Denied' });
        return Response.json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }

    const patch = buildConfigPatch(key, body, cfg);
    const updated = await upsertGuildConfig({ guildId, ...patch });
    const { buildConfigMenuResponse } = await import('@/lib/discord/components');
    const reply = buildConfigMenuResponse(updated);
    return Response.json({ type: 7, data: replyToInteractionData(reply) });
}

function buildConfigPatch(key: string, body: any, cfg: any) {
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
    return patch;
}

async function handleBirthdayInteraction(customId: string, body: any, guildId: string) {
    const userId: string | undefined = body?.member?.user?.id || body?.user?.id;
    if (!userId) return new Response('No user', { status: 400 });
    const cfg = await getGuildConfig(guildId); // SQL config via Neon

    // Handle specific birthday interactions
    if (customId === 'bday:set') {
        const res = await handleBirthdaySetAction(userId, guildId, cfg);
        return res;
    }
    if (customId === 'bday:view') {
        const res = await handleBirthdayViewAction(userId, guildId);
        return res;
    }
    if (customId === 'bday:countdown') {
        const res = await handleBirthdayCountdownAction(userId, guildId);
        return res;
    }
    if (customId === 'bday:today') {
        const res = await handleBirthdayTodayAction(guildId);
        return res;
    }
    if (customId === 'bday:cancel') {
        const res = await handleBirthdayCancelAction(userId, guildId);
        return res;
    }
    if (customId === 'bday:month') {
        // month/day actions are ephemeral and don't need DB unless month selected depends on existing state; no DB operations
        return handleBirthdayMonthAction(body);
    }
    if (customId === 'bday:day' || customId === 'bday:day1' || customId === 'bday:day2') {
        return handleBirthdayDayAction(body);
    }
    if (customId.startsWith('bday:confirm:')) {
        const res = await handleBirthdayConfirmAction(customId, userId, guildId, cfg);
        return res;
    }

    return new Response('Unhandled birthday action', { status: 400 });
}

async function handleBirthdaySetAction(userId: string, guildId: string, cfg: any) {
    const { getBirthday, canChangeBirthday } = await import('@/lib/db/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const changeAllowed = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    if (existing && !changeAllowed) {
        return Response.json({ type: 4, data: { content: 'You cannot change your birthday.', flags: 64 } });
    }
    const { buildSetFlowEmbeds, buildMonthSelect } = await import('@/lib/discord/birthdayComponents');
    const embeds = buildSetFlowEmbeds();
    return Response.json({ type: 4, data: replyToInteractionData({ embeds, components: [buildMonthSelect()], ephemeral: true }) });
}

async function handleBirthdayViewAction(userId: string, guildId: string) {
    const { getBirthday } = await import('@/lib/db/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const { buildViewEmbed } = await import('@/lib/discord/birthdayComponents');
    return Response.json({
        type: 4,
        data: replyToInteractionData({
            embeds: [buildViewEmbed(existing ? { month: existing.month, day: existing.day } : null, userId)],
            ephemeral: true
        })
    });
}

async function handleBirthdayCountdownAction(userId: string, guildId: string) {
    const { getBirthday, daysUntil } = await import('@/lib/db/birthdays');
    const existing = await getBirthday(guildId, userId);
    if (!existing) return Response.json({ type: 4, data: { content: 'No birthday set.', flags: 64 } });
    const until = daysUntil(existing.month, existing.day);
    let msg: string;
    if (until === 0) msg = 'Happy Birthday! 🎉';
    else msg = `${until} day${until === 1 ? '' : 's'} until your birthday.`;
    return Response.json({ type: 4, data: { content: msg, flags: 64 } });
}

async function handleBirthdayTodayAction(guildId: string) {
    const { listTodayBirthdays } = await import('@/lib/db/birthdaysEdge');
    const todays = await listTodayBirthdays(guildId, new Date());
    if (!todays.length) return Response.json({ type: 4, data: { content: 'No birthdays today.', flags: 64 } });
    const list = todays.map(b => `<@${b.userId}>`).join(', ');
    return Response.json({ type: 4, data: { content: `🎂 Today: ${list}`, flags: 64 } });
}

async function handleBirthdayCancelAction(userId: string, guildId: string) {
    const { getBirthday, canChangeBirthday } = await import('@/lib/db/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const cfg = await getGuildConfig(guildId);
    const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    const { buildBirthdayRootEmbed, buildBirthdayRootComponents } = await import('@/lib/discord/birthdayComponents');
    const embed = buildBirthdayRootEmbed({
        hasBirthday: !!existing,
        changeable,
        existing: existing ? { month: existing.month, day: existing.day } : null
    });
    const components = buildBirthdayRootComponents({ hasBirthday: !!existing, changeable });
    return Response.json({ type: 7, data: replyToInteractionData({ embeds: [embed], components }) });
}

async function handleBirthdayMonthAction(body: any) {
    try {
        const values: string[] = body?.data?.values || [];
        const raw = values[0];
        if (!raw) return Response.json({ type: 4, data: { content: 'No month selected.', flags: 64 } });
        const month = parseInt(raw, 10);
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return Response.json({ type: 4, data: { content: 'Invalid month selection.', flags: 64 } });
        }
        const { buildSetFlowEmbeds, buildDaySelectRows, buildMonthSelect } = await import('@/lib/discord/birthdayComponents');
        const embeds = buildSetFlowEmbeds(month);
        const dayRows = buildDaySelectRows(month);
        return Response.json({
            type: 4,
            data: replyToInteractionData({ embeds, components: [buildMonthSelect(month), ...dayRows], ephemeral: true })
        });
    } catch (e: any) {
        const msg = e?.message ? `Month handler error: ${e.message}` : 'Month handler error.';
        return Response.json({ type: 4, data: { content: msg, flags: 64 } });
    }
}

async function handleBirthdayDayAction(body: any) {
    try {
        const values: string[] = body?.data?.values || [];
        const dayRaw = values[0];
        if (!dayRaw) return Response.json({ type: 4, data: { content: 'No day selected.', flags: 64 } });
        const day = parseInt(dayRaw, 10);
        // Reconstruct month by locating the month select row (first row) and its selected option
        const prevMonth = body?.message?.components?.[0]?.components?.[0]?.options?.find?.((o: any) => o.default)?.value;
        const month = prevMonth ? parseInt(prevMonth, 10) : undefined;
        if (!month) return Response.json({ type: 4, data: { content: 'Month missing, restart flow.', flags: 64 } });
        if (!Number.isInteger(day) || day < 1 || day > 31) {
            return Response.json({ type: 4, data: { content: 'Invalid day.', flags: 64 } });
        }
        const { isValidMonthDay } = await import('@/lib/db/birthdaysEdge');
        const { buildSetFlowEmbeds, buildDaySelectRows, buildMonthSelect, buildConfirmRow } = await import('@/lib/discord/birthdayComponents');
        const embeds = buildSetFlowEmbeds(month, day);
        const rows: any[] = [buildMonthSelect(month), ...buildDaySelectRows(month, day)];
        if (isValidMonthDay(month, day)) rows.push(buildConfirmRow(month, day));
        return Response.json({ type: 4, data: replyToInteractionData({ embeds, components: rows, ephemeral: true }) });
    } catch (e: any) {
        const msg = e?.message ? `Day handler error: ${e.message}` : 'Day handler error.';
        return Response.json({ type: 4, data: { content: msg, flags: 64 } });
    }
}

async function handleBirthdayConfirmAction(customId: string, userId: string, guildId: string, cfg: any) {
    const parts = customId.split(':');
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);

    const { isValidMonthDay, canChangeBirthday, setBirthday } = await import('@/lib/db/birthdaysEdge');
    if (!isValidMonthDay(month, day)) {
        return Response.json({ type: 4, data: { content: 'Invalid date.', flags: 64 } });
    }

    // enforce change rules
    const allowed = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    if (!allowed) {
        return Response.json({ type: 4, data: { content: 'You cannot change your birthday.', flags: 64 } });
    }

    await setBirthday(guildId, userId, month, day);
    return Response.json({ type: 4, data: { content: `Birthday saved: ${month}/${day}`, flags: 64 } });
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
