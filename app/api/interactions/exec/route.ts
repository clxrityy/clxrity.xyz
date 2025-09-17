export const runtime = 'nodejs';

import { dispatch, type CommandContext, replyToInteractionData } from '@/lib/commands/types';
import { writeGuildLog } from '@/lib/db/logs';
import { getGuildConfig, upsertGuildConfig } from '@/lib/db/config';
import { errorEmbedFromError } from '@/lib/discord/embed';
import { hasAdminPermission, hasRole } from '@/lib/discord/permissions';

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

async function handleCommand(req: Request, body: any, opts?: { background?: boolean }) {
    const name: string | undefined = body?.data?.name;
    const options: Array<{ name: string; value: unknown }> = body?.data?.options ?? [];
    const args = Object.fromEntries(options.map((o: any) => [o.name, o.value]));
    const ctx = buildCtx(req, body);
    if (!name) throw new Error('Missing command name');
    const { registry } = await import('@/lib/commands/registry');
    const def: any = registry.get(name);
    let shouldDefer = false;
    const deferDisabled = process.env.DISABLE_DEFER?.toLowerCase?.() === 'true';
    if (!deferDisabled && def?.defer) {
        try {
            shouldDefer = typeof def.defer === 'function' ? await def.defer({ ctx, args }) : !!def.defer;
        } catch (e) {
            console.error('[defer:decision:error]', (e as any)?.message || e);
        }
    }
    if (deferDisabled && shouldDefer) {
        console.log('[defer] override disabled by env for command', name);
        shouldDefer = false;
    }
    if (!shouldDefer) {
        const t0 = Date.now();
        const result: unknown = await dispatch(registry, ctx, name, args);
        const data = replyToInteractionData((result as any) ?? '✅ Command executed.');
        const ms = Date.now() - t0;
        try { console.log('[command] immediate', { name, ms, deferred: false }); } catch { }
        // Log success (non-sensitive summary; sensitive details go in encrypted fields if needed)
        try {
            await writeGuildLog({
                guildId: ctx.discord?.guildId || 'dm',
                level: 'INFO',
                category: 'COMMAND',
                summary: `/${name} executed`,
                command: name,
                action: 'immediate',
                userId: ctx.discord?.userId || null,
                success: true,
                latencyMs: ms,
            });
        } catch { }
        return { type: 4, data };
    }
    // Defer: either run inline (background mode) or schedule microtask (foreground)
    const ackTime = Date.now();
    if (opts?.background) {
        try {
            const t1 = Date.now();
            const result: any = await dispatch(registry, ctx, name, args);
            const data = replyToInteractionData(result ?? '✅ Done');
            await sendFollowupWithRetry(body, data);
            try { console.log('[command] followup', { name, msExec: Date.now() - t1, msTotal: Date.now() - ackTime }); } catch { }
            try {
                await writeGuildLog({
                    guildId: ctx.discord?.guildId || 'dm',
                    level: 'INFO',
                    category: 'COMMAND',
                    summary: `/${name} follow-up sent`,
                    command: name,
                    action: 'followup',
                    userId: ctx.discord?.userId || null,
                    success: true,
                    latencyMs: Date.now() - t1,
                });
            } catch { }
        } catch (err: any) {
            const { errorEmbedFromError } = await import('@/lib/discord/embed');
            const embed = errorEmbedFromError(err, { title: 'Command Error', includeStack: false });
            await sendFollowupWithRetry(body, { embeds: [embed] }).catch(() => { });
            console.error('[command:error]', name, err?.message || err);
            try {
                await writeGuildLog({
                    guildId: ctx.discord?.guildId || 'dm',
                    level: 'ERROR',
                    category: 'COMMAND',
                    summary: `/${name} failed`,
                    command: name,
                    action: 'followup',
                    userId: ctx.discord?.userId || null,
                    success: false,
                    latencyMs: Date.now() - ackTime,
                    details: { message: err?.message || String(err), name: err?.name || 'Error' },
                });
            } catch { }
        }
        try { console.log('[command] deferred ack (bg)', { name, ephemeral: !!def?.deferEphemeral }); } catch { }
        return { type: 5, data: { flags: def?.deferEphemeral ? 64 : undefined } };
    } else {
        queueMicrotask(async () => {
            try {
                const t1 = Date.now();
                const result: any = await dispatch(registry, ctx, name, args);
                const data = replyToInteractionData(result ?? '✅ Done');
                await sendFollowupWithRetry(body, data);
                try { console.log('[command] followup', { name, msExec: Date.now() - t1, msTotal: Date.now() - ackTime }); } catch { }
                try {
                    await writeGuildLog({
                        guildId: ctx.discord?.guildId || 'dm',
                        level: 'INFO',
                        category: 'COMMAND',
                        summary: `/${name} follow-up sent`,
                        command: name,
                        action: 'followup',
                        userId: ctx.discord?.userId || null,
                        success: true,
                        latencyMs: Date.now() - t1,
                    });
                } catch { }
            } catch (err: any) {
                const { errorEmbedFromError } = await import('@/lib/discord/embed');
                const embed = errorEmbedFromError(err, { title: 'Command Error', includeStack: false });
                await sendFollowupWithRetry(body, { embeds: [embed] });
                console.error('[command:error]', name, err?.message || err);
                try {
                    await writeGuildLog({
                        guildId: ctx.discord?.guildId || 'dm',
                        level: 'ERROR',
                        category: 'COMMAND',
                        summary: `/${name} failed`,
                        command: name,
                        action: 'followup',
                        userId: ctx.discord?.userId || null,
                        success: false,
                        latencyMs: Date.now() - ackTime,
                        // Store sanitized error details encrypted
                        details: { message: err?.message || String(err), name: err?.name || 'Error' },
                    });
                } catch { }
            }
        });
        try { console.log('[command] deferred ack', { name, ephemeral: !!def?.deferEphemeral }); } catch { }
        return { type: 5, data: { flags: def?.deferEphemeral ? 64 : undefined } };
    }
}

async function sendFollowup(body: any, data: any) {
    try {
        const appId = body?.application_id;
        const token = body?.token;
        if (!appId || !token) return;
        const url = `https://discord.com/api/v10/webhooks/${appId}/${token}`;
        // Add a safety timeout so we never hang the runtime on slow network
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 15000);
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
        }).finally(() => clearTimeout(t));
    } catch (e) {
        console.error('[followup:error]', (e as any)?.message || e);
    }
}

async function sendFollowupWithRetry(body: any, data: any, attempts = 0): Promise<void> {
    try {
        await sendFollowup(body, data);
    } catch (e) {
        if (attempts >= 2) throw e;
        const backoff = 150 * Math.pow(2, attempts); // 150ms, 300ms
        await new Promise(r => setTimeout(r, backoff));
        return sendFollowupWithRetry(body, data, attempts + 1);
    }
}

async function handleHelpPageInteraction(customId: string) {
    const parts = customId.split(':');
    const pageStr = parts[2];
    if (pageStr === 'noop') {
        return { type: 6 }; // ACK with no update
    }
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const [{ registry }, { buildHelpPageResponse }] = await Promise.all([
        import('@/lib/commands/registry'),
        import('@/lib/commands/helpEmbed')
    ]);
    const commands = registry.list();
    const reply = buildHelpPageResponse(commands, page);
    return { type: 7, data: replyToInteractionData(reply) };
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

async function handleConfigInteraction(customId: string, body: any, guildId: string) {
    const key = customId.split(':')[1];
    const cfg = await getGuildConfig(guildId);
    const roles: string[] = Array.isArray(body?.member?.roles) ? body.member.roles : [];
    const perms: string | undefined = body?.member?.permissions;

    if (!(hasAdminPermission(perms) || hasRole(roles, cfg?.adminRoleId))) {
        const embed = errorEmbedFromError(new Error('Unauthorized'), { title: 'Access Denied' });
        return { type: 4, data: { embeds: [embed], flags: 64 } };
    }

    const patch = buildConfigPatch(key, body, cfg);
    const updated = await upsertGuildConfig({ guildId, ...patch });
    const { buildConfigMenuResponse } = await import('@/lib/discord/components');
    const reply = buildConfigMenuResponse(updated);
    return { type: 7, data: replyToInteractionData(reply) };
}

async function handleBirthdaySetAction(userId: string, guildId: string, cfg: any) {
    const { getBirthday, canChangeBirthday } = await import('@/lib/db/birthday/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const changeAllowed = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    if (existing && !changeAllowed) {
        return { type: 4, data: { content: 'You cannot change your birthday.', flags: 64 } };
    }
    const { buildSetFlowEmbeds, buildMonthSelect } = await import('@/lib/discord/birthdayComponents');
    const embeds = buildSetFlowEmbeds();
    return { type: 4, data: replyToInteractionData({ embeds, components: [buildMonthSelect()], ephemeral: true }) };
}

async function handleBirthdayViewAction(userId: string, guildId: string) {
    const { getBirthday } = await import('@/lib/db/birthday/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const { buildViewEmbed } = await import('@/lib/discord/birthdayComponents');
    return { type: 4, data: replyToInteractionData({ embeds: [buildViewEmbed(existing ? { month: existing.month, day: existing.day } : null, userId)], ephemeral: true }) };
}

async function handleBirthdayCountdownAction(userId: string, guildId: string) {
    const { getBirthday } = await import('@/lib/db/birthday/birthdaysEdge');
    const { daysUntil } = await import('@/lib/db/birthday/birthdayUtils');
    const existing = await getBirthday(guildId, userId);
    if (!existing) return { type: 4, data: { content: 'No birthday set.', flags: 64 } };
    const until = daysUntil(existing.month, existing.day);
    let msg: string;
    if (until === 0) msg = 'Happy Birthday! 🎉'; else msg = `${until} day${until === 1 ? '' : 's'} until your birthday.`;
    return { type: 4, data: { content: msg, flags: 64 } };
}

async function handleBirthdayTodayAction(guildId: string) {
    const { listTodayBirthdays } = await import('@/lib/db/birthday/birthdaysEdge');
    const todays = await listTodayBirthdays(guildId, new Date());
    if (!todays.length) return { type: 4, data: { content: 'No birthdays today.', flags: 64 } };
    const list = todays.map(b => `<@${b.userId}>`).join(', ');
    return { type: 4, data: { content: `🎂 Today: ${list}`, flags: 64 } };
}

async function handleBirthdayCancelAction(userId: string, guildId: string) {
    const { getBirthday, canChangeBirthday } = await import('@/lib/db/birthday/birthdaysEdge');
    const existing = await getBirthday(guildId, userId);
    const cfg = await getGuildConfig(guildId);
    const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    const { buildBirthdayRootEmbed, buildBirthdayRootComponents } = await import('@/lib/discord/birthdayComponents');
    const embed = buildBirthdayRootEmbed({ hasBirthday: !!existing, changeable, existing: existing ? { month: existing.month, day: existing.day } : null });
    const components = buildBirthdayRootComponents({ hasBirthday: !!existing, changeable });
    return { type: 7, data: replyToInteractionData({ embeds: [embed], components }) };
}

async function handleBirthdayMonthAction(body: any) {
    const values: string[] = body?.data?.values || [];
    const raw = values[0];
    if (!raw) return { type: 4, data: { content: 'No month selected.', flags: 64 } };
    const month = parseInt(raw, 10);
    if (!Number.isInteger(month) || month < 1 || month > 12) return { type: 4, data: { content: 'Invalid month selection.', flags: 64 } };
    const { buildSetFlowEmbeds, buildDaySelectRows, buildMonthSelect } = await import('@/lib/discord/birthdayComponents');
    const embeds = buildSetFlowEmbeds(month);
    const dayRows = buildDaySelectRows(month);
    return { type: 4, data: replyToInteractionData({ embeds, components: [buildMonthSelect(month), ...dayRows], ephemeral: true }) };
}

async function handleBirthdayDayAction(body: any) {
    const values: string[] = body?.data?.values || [];
    const dayRaw = values[0];
    if (!dayRaw) return { type: 4, data: { content: 'No day selected.', flags: 64 } };
    const day = parseInt(dayRaw, 10);
    const prevMonth = body?.message?.components?.[0]?.components?.[0]?.options?.find?.((o: any) => o.default)?.value;
    const month = prevMonth ? parseInt(prevMonth, 10) : undefined;
    if (!month) return { type: 4, data: { content: 'Month missing, restart flow.', flags: 64 } };
    if (!Number.isInteger(day) || day < 1 || day > 31) return { type: 4, data: { content: 'Invalid day.', flags: 64 } };
    const { isValidMonthDay } = await import('@/lib/db/birthday/birthdayUtils');
    const { buildSetFlowEmbeds, buildDaySelectRows, buildMonthSelect, buildConfirmRow } = await import('@/lib/discord/birthdayComponents');
    const embeds = buildSetFlowEmbeds(month, day);
    const rows: any[] = [buildMonthSelect(month), ...buildDaySelectRows(month, day)];
    if (isValidMonthDay(month, day)) rows.push(buildConfirmRow(month, day));
    return { type: 4, data: replyToInteractionData({ embeds, components: rows, ephemeral: true }) };
}

async function handleBirthdayConfirmAction(customId: string, userId: string, guildId: string, cfg: any) {
    const parts = customId.split(':');
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);
    const { isValidMonthDay } = await import('@/lib/db/birthday/birthdayUtils');
    const { canChangeBirthday, setBirthday } = await import('@/lib/db/birthday/birthdaysEdge');
    if (!isValidMonthDay(month, day)) return { type: 4, data: { content: 'Invalid date.', flags: 64 } };
    const allowed = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    if (!allowed) return { type: 4, data: { content: 'You cannot change your birthday.', flags: 64 } };
    await setBirthday(guildId, userId, month, day);
    return { type: 4, data: { content: `Birthday saved: ${month}/${day}`, flags: 64 } };
}

async function handleComponent(body: any) {
    const customId: string | undefined = body?.data?.custom_id;
    const guildId: string | undefined = body?.guild_id;
    if (!customId || !guildId) return { type: 4, data: { content: 'Bad interaction', flags: 64 } };
    if (customId.startsWith('help:page:')) return handleHelpPageInteraction(customId);
    if (customId.startsWith('config:')) {
        const res = await handleConfigInteraction(customId, body, guildId);
        try { await writeGuildLog({ guildId, level: 'INFO', category: 'INTERACTION', summary: `config interaction ${customId}`, action: 'update', success: true }); } catch { }
        return res;
    }
    if (customId.startsWith('bday')) {
        try {
            const res = await handleBirthdayInteraction(customId, body, guildId);
            try { await writeGuildLog({ guildId, level: 'INFO', category: 'INTERACTION', summary: `bday interaction ${customId}`, action: 'update', success: true }); } catch { }
            return res;
        } catch (err: any) {
            try { await writeGuildLog({ guildId, level: 'ERROR', category: 'INTERACTION', summary: `bday interaction error`, action: 'update', success: false, details: { customId, message: err?.message || String(err) } }); } catch { }
            throw err;
        }
    }
    return { type: 4, data: { content: 'Unhandled component', flags: 64 } };
}

async function handleBirthdayInteraction(customId: string, body: any, guildId: string) {
    const userId: string | undefined = body?.member?.user?.id || body?.user?.id;
    if (!userId) return { type: 4, data: { content: 'No user', flags: 64 } };
    const cfg = await getGuildConfig(guildId);
    if (customId === 'bday:set') return handleBirthdaySetAction(userId, guildId, cfg);
    if (customId === 'bday:view') return handleBirthdayViewAction(userId, guildId);
    if (customId === 'bday:countdown') return handleBirthdayCountdownAction(userId, guildId);
    if (customId === 'bday:today') return handleBirthdayTodayAction(guildId);
    if (customId === 'bday:cancel') return handleBirthdayCancelAction(userId, guildId);
    if (customId === 'bday:month') return handleBirthdayMonthAction(body);
    if (customId === 'bday:day' || customId === 'bday:day1' || customId === 'bday:day2') return handleBirthdayDayAction(body);
    if (customId.startsWith('bday:confirm:')) return handleBirthdayConfirmAction(customId, userId, guildId, cfg);
    return { type: 4, data: { content: 'Unhandled birthday action', flags: 64 } };
}

function unauthorized() {
    const embed = errorEmbedFromError(new Error('Unauthorized'), { title: 'Access Denied' });
    return { type: 4, data: { embeds: [embed], flags: 64 } };
}

export async function POST(req: Request) {
    const secret = process.env.INTERNAL_INTERACTIONS_SECRET || '';
    const header = req.headers.get('x-internal-interactions') || '';
    if (!secret || header !== secret) return Response.json(unauthorized());
    const background = req.headers.get('x-background-dispatch') === '1';

    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ type: 4, data: { content: 'Invalid body', flags: 64 } }, { status: 400 });
    try {
        if (body?.type === 1) return Response.json({ type: 1 });
        if (background) {
            // Already deferred at Edge; only execute & follow-up.
            if (body?.type === 2) {
                // Execute command in background mode so deferred commands run inline
                // and send their follow-up before we return.
                const result = await handleCommand(req, body, { background: true });
                if (result && typeof result === 'object' && (result as any).type === 4) {
                    try {
                        await sendFollowupWithRetry(body, (result as any).data ?? { content: 'Done' });
                    } catch { /* swallow */ }
                }
                return new Response(null, { status: 204 });
            }
            if (body?.type === 3 || body?.type === 5) {
                const result = await handleComponent(body);
                // Send follow-up manually since original ACK was already sent.
                await sendFollowupWithRetry(body, result.data ?? { content: 'Done' });
                return new Response(null, { status: 204 });
            }
        } else {
            if (body?.type === 2) return Response.json(await handleCommand(req, body));
            if (body?.type === 3 || body?.type === 5) return Response.json(await handleComponent(body));
        }
        return Response.json({ type: 4, data: { content: 'Unhandled interaction type', flags: 64 } }, { status: 400 });
    } catch (err: any) {
        const embed = errorEmbedFromError(err, { title: 'Command Error', includeStack: false });
        if (background) {
            await sendFollowupWithRetry(body, { embeds: [embed], flags: 64 }).catch(() => { });
            return new Response(null, { status: 204 });
        }
        return Response.json({ type: 4, data: { embeds: [embed], flags: 64 } });
    }
}
