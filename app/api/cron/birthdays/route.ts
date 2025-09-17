export const runtime = 'nodejs';

import { buildAnnouncements, formatBirthdayMessage, postDiscordMessage } from '@/lib/discord/announce';
import { listGuildsWithBirthdayRole } from '@/lib/db/config';
import { listGuildBirthdays, listTodayBirthdays } from '@/lib/db/birthday/birthdaysEdge';
import { addRole, removeRole } from '@/lib/discord/roles';
import { ensureRunMarkerTable, markGuildRunIfAbsent, hasGuildRun } from '@/lib/db/runMarkers';

function authOk(req: Request) {
    // Accept either our custom secret header OR Vercel's scheduled function header
    const cronHeader = req.headers.get('x-cron-secret');
    const expected = process.env.CRON_SECRET;
    if (expected && cronHeader && cronHeader === expected) return true;
    // Vercel adds x-vercel-cron for scheduled runs
    if (req.headers.has('x-vercel-cron')) return true;
    return false;
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
        const month = today.getUTCMonth() + 1;
        const day = today.getUTCDate();
        const dateStr = `${month}/${day}`;
        const results: any[] = [];
        const skipped: string[] = [];
        const processed: string[] = [];
        const roleOps: Record<string, { added: number; removed: number; errors: number; simulated?: boolean }> = {};
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
        // Utility helpers for controlled concurrency and retries
        const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
        async function withRetry<T extends { ok: boolean; status: number; retryAfterMs?: number }>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 250): Promise<T> {
            let last: T | null = null;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const res = await fn();
                if (res.ok) return res;
                last = res;
                const retriable = res.status === 429 || res.status >= 500 || res.status === 0;
                if (!retriable) return res;
                const retryAfter = res.retryAfterMs ?? 0;
                const backoff = baseDelayMs * Math.pow(2, attempt);
                const jitter = Math.floor(Math.random() * 100);
                await sleep(Math.max(retryAfter, backoff) + jitter);
            }
            // If all attempts failed, return the last failure response
            return last as T;
        }
        async function mapWithConcurrency<I, O>(items: I[], limit: number, worker: (item: I, index: number) => Promise<O>): Promise<O[]> {
            const results: O[] = new Array(items.length) as any;
            let next = 0;
            async function run() {
                while (true) {
                    const i = next++;
                    if (i >= items.length) break;
                    results[i] = await worker(items[i], i);
                }
            }
            const runners = Array.from({ length: Math.min(limit, items.length) }, run);
            await Promise.all(runners);
            return results;
        }

        // After posting announcements, sync roles for all guilds with a configured role:
        const roleGuilds = await listGuildsWithBirthdayRole();
        for (const cfg of roleGuilds) {
            if (!cfg.birthdayRoleId) continue;
            // Determine today's users for this guild directly from DB (UTC-aware)
            const todaysRows = await listTodayBirthdays(cfg.guildId, today);
            const todays = todaysRows.map(b => b.userId);
            // Fetch all users that have a birthday set (potential prior role holders)
            const all = await listGuildBirthdays(cfg.guildId);
            const todaySet = new Set(todays);
            const toAdd = todays; // ensure all today users have role
            const toRemove = all.map(b => b.userId).filter(uid => !todaySet.has(uid));
            let simulated = false;
            const concurrency = 3;
            const addResults = await mapWithConcurrency(toAdd, concurrency, async (uid) => {
                const r = await withRetry(() => addRole(cfg.guildId, uid, cfg.birthdayRoleId!));
                if (r.simulated) {
                    simulated = true;
                }
                return r;
            });
            const removeResults = await mapWithConcurrency(toRemove, concurrency, async (uid) => {
                const r = await withRetry(() => removeRole(cfg.guildId, uid, cfg.birthdayRoleId!));
                if (r.simulated) {
                    simulated = true;
                }
                return r;
            });
            const added = addResults.filter(r => r.ok).length;
            const removed = removeResults.filter(r => r.ok).length;
            const errors = addResults.filter(r => !r.ok).length + removeResults.filter(r => !r.ok).length;
            roleOps[cfg.guildId] = { added, removed, errors, simulated: simulated || undefined };
        }

        return Response.json({ ok: true, ran: true, announcements: results.length, results, skipped, processed, roleOps, force, ms: Date.now() - start });
    } catch (err: any) {
        console.error('Birthday cron failure', err);
        return Response.json({ ok: false, error: err?.message || String(err), ms: Date.now() - start }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Allow POST to force-run as well (same logic)
    return GET(req);
}