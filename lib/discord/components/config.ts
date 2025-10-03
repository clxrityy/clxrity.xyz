// Helpers for building Discord component-based UIs
import type { CommandReply } from '@/lib/commands/util/types';

export type GuildConfigRow = {
    adminRoleId?: string | null;
    birthdayRoleId?: string | null;
    birthdayChannel?: string | null;
    birthdayMessage?: string | null;
    changeable: boolean;
};

export function buildConfigMenuResponse(cfg: GuildConfigRow): Extract<CommandReply, object> {
    const adminDefault = cfg.adminRoleId ? [{ id: cfg.adminRoleId, type: 'role' }] : [];
    const bdayRoleDefault = cfg.birthdayRoleId ? [{ id: cfg.birthdayRoleId, type: 'role' }] : [];
    const channelDefault = cfg.birthdayChannel ? [{ id: cfg.birthdayChannel, type: 'channel' }] : [];
    // Build the base reply (without components yet)
    const reply = {
        content: 'Configure guild settings using the controls below.',
        embeds: [
            {
                title: 'Configuration',
                fields: [
                    { name: 'Admin Role', value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : 'none', inline: true },
                    { name: 'Birthday Role', value: cfg.birthdayRoleId ? `<@&${cfg.birthdayRoleId}>` : 'none', inline: true },
                    { name: 'Birthday Channel', value: cfg.birthdayChannel ? `<#${cfg.birthdayChannel}>` : 'none', inline: true },
                    { name: 'Changeable', value: String(cfg.changeable), inline: true },
                    { name: 'Message', value: cfg.birthdayMessage || 'default (e.g., "🎉 Happy Birthday {user}! Enjoy your day! {@}")', inline: false },
                    { name: 'Placeholders', value: '`{user}` → user mention(s), `{@}` → birthday role, `{count}` `{date}` `{month}` `{day}` supported', inline: false },
                ],
            },
        ],
    };

    // Build the action rows (max 5 rows allowed by Discord)
    const rows = [
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: 'config:admin_role',
                    placeholder: 'Select admin role (optional)',
                    min_values: 0,
                    max_values: 1,
                    default_values: adminDefault,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: 'config:birthday_role',
                    placeholder: 'Select birthday role (optional)',
                    min_values: 0,
                    max_values: 1,
                    default_values: bdayRoleDefault,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 8,
                    custom_id: 'config:birthday_channel',
                    placeholder: 'Select birthday channel (optional)',
                    min_values: 0,
                    max_values: 1,
                    default_values: channelDefault,
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: cfg.changeable ? 3 : 2,
                    label: cfg.changeable ? 'Changeable: ON' : 'Changeable: OFF',
                    custom_id: 'config:changeable_toggle',
                },
            ],
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: 'Edit Message',
                    custom_id: 'config:message_edit',
                },
                {
                    type: 2,
                    style: 4,
                    label: 'Reset Message',
                    custom_id: 'config:message_reset',
                },
                {
                    type: 2,
                    style: 3,
                    label: 'Confirm',
                    custom_id: 'config:confirm',
                },
            ],
        },
    ];

    if (rows.length > 5) {
        try { console.warn('[components] clamping action rows to 5', { got: rows.length }); } catch { }
    }

    return { ...reply, components: rows.slice(0, 5) } as Extract<CommandReply, object>;
}
