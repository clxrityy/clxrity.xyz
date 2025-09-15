import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';
import { latencyColor } from '../discord/embed';
import { getGuildConfig } from '../db/config';
import { buildConfigMenuResponse } from '../discord/components';
import { hasAdminPermission, hasRole } from '../discord/permissions';
import { embedArgsSchema, buildEmbed } from '../discord/embedBuilder';
import { buildHelpDetailEmbed, buildHelpPageResponse } from './helpEmbed';

function buildPostStatus(posted: { ok: boolean; status: number; simulated?: boolean }): string {
    if (!posted.ok) return `Failed (${posted.status})`;
    return String(posted.status) + (posted.simulated ? ' (simulated)' : '');
}

const commands: RegisteredCommand[] = [
    // Utility: ping
    {
        name: 'ping',
        category: 'Utility',
        description: 'Respond with pong and latency',
        schema: z.object({}),
        execute: ({ ctx }) => {
            const tsSec = ctx.discord?.signatureTimestamp ? Number(ctx.discord.signatureTimestamp) : undefined;
            const nowMs = Date.now();
            const delta = tsSec ? Math.max(0, nowMs - tsSec * 1000) : 0;
            const color = latencyColor(delta || 0);
            return { embeds: [{ title: 'Pong!', description: tsSec ? `\`${delta}\` ms` : 'Latency unavailable', color, timestamp: new Date().toISOString() }] };
        }
    },
    // Utility: embed
    {
        name: 'embed',
        category: 'Utility',
        description: 'Create a custom embed (admin only)',
        schema: embedArgsSchema,
        authorize: ({ ctx }) => hasAdminPermission(ctx.discord?.permissions),
        execute: async ({ args }) => {
            const embed = buildEmbed(args);
            if (!Object.keys(embed).length) return { content: 'No fields provided', ephemeral: true };
            return { embeds: [embed] };
        }
    },
    // General: help
    {
        name: 'help',
        category: 'General',
        description: 'List commands or get help for one',
        schema: z.object({ command: z.string().optional().describe('Specific command name') }),
        execute: ({ args }) => {
            if (args.command) {
                const cmd = commands.find(c => c.name === args.command);
                if (!cmd) return { content: `Command not found: ${args.command}`, ephemeral: true };
                return { embeds: [buildHelpDetailEmbed(cmd)], ephemeral: true };
            }
            return buildHelpPageResponse(commands, 1);
        }
    },
    // Admin: config
    {
        name: 'config',
        category: 'Admin',
        description: 'Open interactive menu to configure guild settings',
        schema: z.object({}),
        authorize: async ({ ctx }) => {
            const guildId = ctx.discord?.guildId;
            if (!guildId) return false;
            const perms = ctx.discord?.permissions;
            const roles = ctx.discord?.memberRoleIds || [];
            const cfg = await getGuildConfig(guildId);
            if (hasAdminPermission(perms)) return true;
            if (hasRole(roles, cfg?.adminRoleId)) return true;
            return false;
        },
        execute: async ({ ctx }) => {
            const guildId = ctx.discord?.guildId;
            if (!guildId) return { content: 'This can only be used in a server.', ephemeral: true };
            const cfg = (await getGuildConfig(guildId)) || { adminRoleId: null, birthdayRoleId: null, birthdayChannel: null, birthdayMessage: null, changeable: false };
            const base = buildConfigMenuResponse(cfg);
            return { content: base.content, embeds: base.embeds, components: base.components, ephemeral: true };
        }
    },
    // General: birthday manager
    {
        name: 'birthday',
        category: 'General',
        description: 'Manage or view birthdays',
        schema: z.object({}),
        execute: async ({ ctx }) => {
            const guildId = ctx.discord?.guildId;
            const userId = ctx.discord?.userId;
            if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };
            const [{ getBirthday, canChangeBirthday }, { getGuildConfig }] = await Promise.all([
                import('../db/birthdays'),
                import('../db/config')
            ]);
            const cfg = await getGuildConfig(guildId);
            const existing = await getBirthday(guildId, userId);
            const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
            const { buildBirthdayRootEmbed, buildBirthdayRootComponents } = await import('../discord/birthdayComponents');
            const embed = buildBirthdayRootEmbed({ hasBirthday: !!existing, changeable, existing });
            const components = buildBirthdayRootComponents({ hasBirthday: !!existing, changeable });
            return { embeds: [embed], components, ephemeral: true };
        }
    },
    // General: manual birthday announcement (/hbd)
    {
        name: 'hbd',
        category: 'General',
        description: 'Announce today\'s birthdays now (once per UTC day, optional admin force)',
        schema: (() => {
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
            return z.object({
                force: boolish.optional().describe('Force re-run even if already sent (admin only)')
            });
        })(),
        execute: async ({ ctx, args }) => {
            const guildId = ctx.discord?.guildId;
            if (!guildId) return { content: 'Must be used in a server.', ephemeral: true };
            const today = new Date();
            const [{ buildSingleGuildAnnouncement, formatBirthdayMessage, postDiscordMessage }, { hasGuildRun, markGuildRunIfAbsent, ensureRunMarkerTable }] = await Promise.all([
                import('../discord/announce'),
                import('../db/runMarkers')
            ]);
            await ensureRunMarkerTable();
            const force = !!args.force;
            const alreadyRan = await hasGuildRun(guildId, today);
            if (alreadyRan && !force) {
                return { content: 'Birthday announcements already sent for today. (UTC reset at 00:00) Use force if needed (admins only).', ephemeral: true };
            }
            if (force && alreadyRan) {
                // Admin check
                const perms = ctx.discord?.permissions;
                const roles = ctx.discord?.memberRoleIds || [];
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
            const content = formatBirthdayMessage(ann.template, { mentions, count: ann.userIds.length, date: dateStr, month, day }) + (ann.roleId ? `\n<@&${ann.roleId}>` : '');
            const posted = await postDiscordMessage(ann.channelId, content);
            const marked = await markGuildRunIfAbsent(guildId, today); // will be false if rerun
            const postStatus = buildPostStatus(posted);
            let roleSummary = 'N/A';
            let roleErrors: string[] = [];
            if (ann.roleId) {
                try {
                    const [{ listGuildBirthdays }, { addRole, removeRole }] = await Promise.all([
                        import('../db/birthdays'),
                        import('../discord/roles')
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
    }
];

export const registry = createRegistry(commands);
