import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';
import { latencyColor } from '../discord/embed';
import { getGuildConfig } from '../db/config';
import { buildConfigMenuResponse } from '../discord/components';
import { hasAdminPermission, hasRole } from '../discord/permissions';
import { embedArgsSchema, buildEmbed } from '../discord/embedBuilder';
import { buildHelpDetailEmbed, buildHelpPageResponse } from './helpEmbed';

// Central place to register commands; import and push to this array.
const commands: RegisteredCommand[] = [
    /** 
    *  Utility commands
    */
    // Simple ping command to test bot responsiveness (/ping)
    {
        name: 'ping',
        category: 'Utility',
        description: 'Respond with pong and latency',
        schema: z.object({}),
        execute: ({ ctx }) => {
            // Estimate latency using signature timestamp if present
            const tsSec = ctx.discord?.signatureTimestamp ? Number(ctx.discord.signatureTimestamp) : undefined;
            const nowMs = Date.now();
            const delta = tsSec ? Math.max(0, nowMs - tsSec * 1000) : 0;
            const color = latencyColor(delta || 0);
            return {
                embeds: [
                    {
                        title: 'Pong!',
                        description: tsSec ? `\`${delta}\` ms` : 'Latency unavailable',
                        color,
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
    },
    // Create a custom embed with various options (admin only) (/embed)
    {
        name: 'embed',
        category: 'Utility',
        description: 'Create a custom embed (admin only)',
        schema: embedArgsSchema,
        authorize: ({ ctx }) => {
            const perms = ctx.discord?.permissions;
            return hasAdminPermission(perms);
        },
        execute: async ({ args }) => {
            const embed = buildEmbed(args);
            if (!Object.keys(embed).length) return { content: 'No fields provided', ephemeral: true };
            return { embeds: [embed] };
        }
    },
    // Show a user's avatar, either self or specified user (/avatar)
    {
        name: 'avatar',
        category: 'Utility',
        description: 'Show a user\'s avatar',
        schema: z.object({ user: z.string().describe('User ID').optional() }),
        execute: async ({ ctx, args }) => {
            const userId = (args).user || ctx.discord?.userId;
            if (!userId) return { content: 'No user provided', ephemeral: true };
            // Try resolved users for avatar hash when provided by Discord
            const resolved = ctx.discord?.resolvedUsers?.[userId];
            const avatarHash = resolved?.avatar as string | undefined;
            const url = avatarHash
                ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=1024`
                : `https://cdn.discordapp.com/embed/avatars/0.png`;
            return {
                embeds: [
                    {
                        title: 'Avatar',
                        image: { url },
                    },
                ],
            };
        },
    },
    /** 
     * General commands
     */

    // Show help listing or details for one command (/help)
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
    // Open interactive config menu (admin only) (/config)
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
            const cfg = (await getGuildConfig(guildId)) || {
                adminRoleId: null,
                birthdayRoleId: null,
                birthdayChannel: null,
                birthdayMessage: null,
                changeable: false,
            };
            const base = buildConfigMenuResponse(cfg);
            return { content: base.content, embeds: base.embeds, components: base.components, ephemeral: true };
        },
    },
    // Interactive birthday manager (/birthday)
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
];

export const registry = createRegistry(commands);
