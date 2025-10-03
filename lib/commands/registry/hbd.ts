import type { CommandContext, CommandReply } from '@/lib/commands/util/types';
import { z } from 'zod';
import { hasAdminPermission, hasRole } from '@/lib/discord/permissions';

const boolish = z.preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const s = v.toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
    }
    if (typeof v === 'number') return v !== 0;
    return v;
}, z.boolean());

export const hbdSchema = z.object({
    force: boolish.optional().describe('Force re-run even if already sent (admin only)')
});

function buildPostStatus(posted: { ok: boolean; status: number; simulated?: boolean }): string {
    if (!posted.ok) return `Failed (${posted.status})`;
    return String(posted.status) + (posted.simulated ? ' (simulated)' : '');
}

export async function executeHbd({ ctx, args }: { ctx: CommandContext; args: z.infer<typeof hbdSchema> }): Promise<CommandReply> {
    const guildId = ctx.discord?.guildId;
    if (!guildId) return { content: 'Must be used in a server.', ephemeral: true };
    const today = new Date();

    const [{ buildSingleGuildAnnouncement, formatBirthdayMessage, postDiscordMessage }, { hasGuildRun, markGuildRunIfAbsent, ensureRunMarkerTable }] = await Promise.all([
        import('@/lib/discord/announce'),
        import('@/lib/db/queries/runMarkers')
    ]);
    await ensureRunMarkerTable();

    const force = !!(args as any).force;
    const alreadyRan = await hasGuildRun(guildId, today);
    if (alreadyRan && !force) {
        return { content: 'Birthday announcements already sent for today. (UTC reset at 00:00) Use force if needed (admins only).', ephemeral: true };
    }
    if (force && alreadyRan) {
        const perms = ctx.discord?.permissions;
        const roles = ctx.discord?.memberRoleIds || [];
        const { getGuildConfig } = await import('@/lib/db/queries/config');
        const cfg = await getGuildConfig(guildId);
        const isAdmin = hasAdminPermission(perms) || (cfg?.adminRoleId && hasRole(roles, cfg.adminRoleId));
        if (!isAdmin) return { content: 'You are not allowed to force a re-run.', ephemeral: true };
    }

    const ann = await buildSingleGuildAnnouncement(guildId, today);
    if (!ann) return { content: 'No birthdays to announce today or channel not configured.', ephemeral: true };

    const month = today.getUTCMonth() + 1;
    const day = today.getUTCDate();
    const dateStr = `${month}/${day}`;
    const mentions = ann.userIds.map(id => `<@${id}>`).join(', ');
    const content = formatBirthdayMessage(ann.template, { mentions, count: ann.userIds.length, date: dateStr, month, day, roleMention: ann.roleId ? `<@&${ann.roleId}>` : '' });
    const posted = await postDiscordMessage(ann.channelId, content);
    const marked = await markGuildRunIfAbsent(guildId, today);
    const postStatus = buildPostStatus(posted);

    let roleSummary = 'N/A';
    let roleErrors: string[] = [];
    if (ann.roleId) {
        try {
            const [{ listGuildBirthdays }, { addRole, removeRole }] = await Promise.all([
                import('@/lib/db/queries/birthday/birthdaysEdge'),
                import('@/lib/discord/roles')
            ]);
            const all = await listGuildBirthdays(guildId);
            const todaySet = new Set(ann.userIds);
            const toAdd = ann.userIds;
            const toRemove = all.map(b => b.userId).filter(uid => !todaySet.has(uid));
            const addResults: any[] = [];
            const removeResults: any[] = [];
            for (const uid of toAdd) addResults.push(await addRole(guildId, uid, ann.roleId));
            for (const uid of toRemove) removeResults.push(await removeRole(guildId, uid, ann.roleId));
            const addedCount = addResults.filter(r => r.ok).length;
            const removedCount = removeResults.filter(r => r.ok).length;
            const simulated = addResults.some(r => r.simulated) || removeResults.some(r => r.simulated);
            roleErrors = [...addResults, ...removeResults].filter(r => !r.ok).map(r => `${r.userId}:${r.status}`);
            roleSummary = `${addedCount} added, ${removedCount} removed${simulated ? ' (simulated)' : ''}`;
        } catch (e: any) {
            roleSummary = 'Error during sync';
            roleErrors.push(e?.message || String(e));
        }
    }

    return {
        embeds: [{
            title: 'Birthday Announcement Sent',
            description: `${ann.userIds.length} birthday${ann.userIds.length === 1 ? '' : 's'} announced.${force && alreadyRan ? ' (Forced re-run)' : ''}`,
            fields: [
                { name: 'Channel', value: `<#${ann.channelId}>`, inline: true },
                { name: 'Users', value: mentions || '—', inline: false },
                { name: 'Marked Today', value: marked ? 'Yes' : 'Already marked', inline: true },
                { name: 'Post Status', value: postStatus, inline: true },
                { name: 'Role Sync', value: roleSummary, inline: true },
                { name: 'Forced', value: force ? 'Yes' : 'No', inline: true },
                { name: 'Previously Ran', value: alreadyRan ? 'Yes' : 'No', inline: true },
                ...(roleErrors.length ? [{ name: 'Role Errors', value: roleErrors.slice(0, 5).join(', ').slice(0, 256), inline: false }] : [])
            ],
            timestamp: new Date().toISOString()
        }],
        ephemeral: true
    };
}
