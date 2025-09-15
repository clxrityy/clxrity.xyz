import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';
import { latencyColor } from '../discord/embed';
import { hasAdminPermission, hasRole } from '../discord/permissions';
import { embedArgsSchema } from '../discord/embedBuilder';
// Heavy helpers (config DB, components, help builders, embed builder) will be lazy-loaded in execute paths

// Inline, lightweight schema for hbd to avoid top-level dynamic imports
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
const hbdSchema = z.object({
    force: boolish.optional().describe('Force re-run even if already sent (admin only)')
});

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
            const { buildEmbed } = await import('../discord/embedBuilder');
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
        execute: async ({ args }) => {
            const { buildHelpDetailEmbed, buildHelpPageResponse } = await import('./helpEmbed');
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
            const { getGuildConfig } = await import('../db/config');
            const cfg = await getGuildConfig(guildId);
            if (hasAdminPermission(perms)) return true;
            if (hasRole(roles, cfg?.adminRoleId)) return true;
            return false;
        },
        execute: async ({ ctx }) => {
            const guildId = ctx.discord?.guildId;
            if (!guildId) return { content: 'This can only be used in a server.', ephemeral: true };
            const [{ getGuildConfig }, { buildConfigMenuResponse }] = await Promise.all([
                import('../db/config'),
                import('../discord/components')
            ]);
            const cfg = (await getGuildConfig(guildId)) || { adminRoleId: null, birthdayRoleId: null, birthdayChannel: null, birthdayMessage: null, changeable: false };
            const base = buildConfigMenuResponse(cfg);
            return { content: base.content, embeds: base.embeds, components: base.components, ephemeral: true };
        }
    },
    // General: birthday manager (delegated module)
    {
        name: 'birthday',
        category: 'General',
        description: 'Manage or view birthdays',
        schema: z.object({}),
        execute: async ({ ctx }) => {
            const { executeBirthdayRoot } = await import('@/lib/commands/registry/birthday');
            return executeBirthdayRoot({ ctx });
        }
    },
    // General: manual birthday announcement (/hbd) delegated
    {
        name: 'hbd',
        category: 'General',
        description: 'Announce today\'s birthdays now (once per UTC day, optional admin force)',
        schema: hbdSchema,
        execute: async ({ ctx, args }) => {
            const { executeHbd } = await import('@/lib/commands/registry/hbd');
            return executeHbd({ ctx, args });
        }
    }
];

export const registry = createRegistry(commands);
