import { listGuildsWithBirthdayChannel, getGuildConfig } from '@/lib/db/config';

export type BirthdayAnnouncement = {
    guildId: string;
    channelId: string;
    userIds: string[];
    roleId: string | null;
    template: string | null;
};

// Post a message to a Discord channel. If DISCORD_BOT_TOKEN is missing, we log and simulate success.
export async function postDiscordMessage(channelId: string, content: string): Promise<{ ok: boolean; status: number; simulated?: boolean; error?: string }> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.log('[announce][simulate:no-token] channel', channelId, 'content:', content);
        return { ok: true, status: 299, simulated: true };
    }
    try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { ok: false, status: res.status, error: text.slice(0, 300) };
        }
        return { ok: true, status: res.status };
    } catch (err: any) {
        return { ok: false, status: 0, error: err?.message || String(err) };
    }
}

export function formatBirthdayMessage(rawTemplate: string | null | undefined, data: { mentions: string; count: number; date: string; month: number; day: number; roleMention?: string }): string {
    const base = rawTemplate && rawTemplate.trim().length > 0 ? rawTemplate : '🎉 Happy Birthday {user}! Enjoy your day! {@}';
    // Backward compatibility: {mentions} behaves same as {user}
    let out = base
        .replace(/\{mentions\}/g, data.mentions)
        .replace(/\{user\}/g, data.mentions)
        .replace(/\{@\}/g, data.roleMention ?? '')
        .replace(/\{count\}/g, String(data.count))
        .replace(/\{date\}/g, data.date)
        .replace(/\{month\}/g, String(data.month))
        .replace(/\{day\}/g, String(data.day));
    return out;
}

export async function buildAnnouncements(today = new Date()): Promise<BirthdayAnnouncement[]> {
    const [configs, { listTodaysBirthdaysAllGuilds }] = await Promise.all([
        listGuildsWithBirthdayChannel(),
        import('@/lib/db/birthday/birthdaysEdge')
    ]);
    const todays = await listTodaysBirthdaysAllGuilds(today);
    if (!todays.length) return [];
    const byGuild = new Map<string, { channelId: string; roleId: string | null; template: string | null; userIds: string[] }>();
    for (const cfg of configs) {
        if (!cfg.birthdayChannel) continue;
        byGuild.set(cfg.guildId, {
            channelId: cfg.birthdayChannel,
            roleId: cfg.birthdayRoleId,
            template: cfg.birthdayMessage,
            userIds: []
        });
    }
    for (const row of todays) {
        const bucket = byGuild.get(row.guildId);
        if (bucket) bucket.userIds.push(row.userId);
    }
    const results: BirthdayAnnouncement[] = [];
    for (const [guildId, info] of byGuild) {
        if (!info.userIds.length) continue;
        results.push({ guildId, channelId: info.channelId, userIds: info.userIds, roleId: info.roleId, template: info.template });
    }
    return results;
}

// Build a single guild announcement (without posting) if birthdays & channel configured; returns null if none.
export async function buildSingleGuildAnnouncement(guildId: string, today = new Date()): Promise<BirthdayAnnouncement | null> {
    const cfg = await getGuildConfig(guildId);
    if (!cfg?.birthdayChannel) return null;
    // Dynamic import to avoid pulling heavy modules into Edge bundles unnecessarily
    const { listTodayBirthdays } = await import('@/lib/db/birthday/birthdaysEdge');
    const todays = await listTodayBirthdays(guildId, today);
    if (!todays.length) return null;
    return {
        guildId,
        channelId: cfg.birthdayChannel,
        userIds: todays.map(b => b.userId),
        roleId: cfg.birthdayRoleId,
        template: cfg.birthdayMessage
    };
}
