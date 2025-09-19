// Helpers for building Discord component-based UIs
import type { CommandReply } from '@/lib/commands/types';

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

    return {
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
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 6, // Role select (Admin Role)
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
                        type: 6, // Role select (Birthday Role)
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
                        type: 8, // Channel select (Birthday Channel)
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
                        type: 2, // Button toggle for changeable
                        style: cfg.changeable ? 3 /* success */ : 2 /* secondary */,
                        label: cfg.changeable ? 'Changeable: ON' : 'Changeable: OFF',
                        custom_id: 'config:changeable_toggle',
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2, // Button to edit message (opens modal)
                        style: 1, // primary
                        label: 'Edit Message',
                        custom_id: 'config:message_edit',
                    },
                    {
                        type: 2, // Button to reset message
                        style: 4, // danger
                        label: 'Reset Message',
                        custom_id: 'config:message_reset',
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        type: 2, // Confirm button
                        style: 3, // success
                        label: 'Confirm',
                        custom_id: 'config:confirm',
                    },
                ],
            },
        ],
    };
}
