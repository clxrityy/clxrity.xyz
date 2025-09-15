export const runtime = 'nodejs';

import { buildAnnouncements, formatBirthdayMessage, postDiscordMessage } from '@/lib/discord/announce';
import { ensureRunMarkerTable, markGuildRunIfAbsent, hasGuildRun } from '@/lib/db/runMarkers';

function authOk(req: Request) {
    const header = req.headers.get('x-cron-secret');
    const expected = process.env.CRON_SECRET;
    return expected && header && header === expected;
}

export async function GET(req: Request) {
    if (!authOk(req)) return new Response('Unauthorized', { status: 401 });
    const start = Date.now();
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    try {
        const today = new Date();
        await ensureRunMarkerTable();
        const announcements = await buildAnnouncements(today);
        if (!announcements.length) {
            return Response.json({ ok: true, ran: true, announcements: 0, skipped: [], processed: [], force, ms: Date.now() - start });
        }
        const month = today.getUTCMonth() + 1;
        const day = today.getUTCDate();
        const dateStr = `${month}/${day}`;
        const results: any[] = [];
        const skipped: string[] = [];
        const processed: string[] = [];
        for (const ann of announcements) {
            let shouldPost = true;
            if (!force) {
                const already = await hasGuildRun(ann.guildId, today);
                if (already) {
                    skipped.push(ann.guildId);
                    shouldPost = false;
                }
            }
            if (!shouldPost) continue;
            const mentions = ann.userIds.map(id => `<@${id}>`).join(', ');
            const content = formatBirthdayMessage(ann.template, {
                mentions,
                count: ann.userIds.length,
                date: dateStr,
                month,
                day
            }) + (ann.roleId ? `\n<@&${ann.roleId}>` : '');
            const posted = await postDiscordMessage(ann.channelId, content);
            const marked = await markGuildRunIfAbsent(ann.guildId, today);
            processed.push(ann.guildId);
            results.push({ guildId: ann.guildId, channelId: ann.channelId, count: ann.userIds.length, status: posted.status, marked });
        }
        return Response.json({ ok: true, ran: true, announcements: results.length, results, skipped, processed, force, ms: Date.now() - start });
    } catch (err: any) {
        console.error('Birthday cron failure', err);
        return Response.json({ ok: false, error: err?.message || String(err), ms: Date.now() - start }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Allow POST to force-run as well (same logic)
    return GET(req);
}