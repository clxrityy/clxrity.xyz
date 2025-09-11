import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';
import { latencyColor } from '../discord/embed';
import { getGuildConfig } from '../db/config';
import { buildConfigMenuResponse } from '../discord/components';
import { hasAdminPermission, hasRole } from '../discord/permissions';

// Central place to register commands; import and push to this array.
const commands: RegisteredCommand[] = [
    {
        name: 'ping',
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
    {
        name: 'avatar',
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
    {
        name: 'config',
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
];

export const registry = createRegistry(commands);
