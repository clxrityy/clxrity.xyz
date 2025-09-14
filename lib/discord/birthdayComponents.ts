import type { Component, Embed } from '@/lib/commands/types';
import { daysUntil } from '@/lib/db/birthdays';

export function buildBirthdayRootEmbed(opts: { hasBirthday: boolean; changeable: boolean; existing?: { month: number; day: number } | null }): Embed {
    let desc: string;
    const existingPart = opts.existing ? `: **${opts.existing.month}/${opts.existing.day}**` : '';
    if (!opts.hasBirthday) {
        desc = 'You have not set a birthday yet.';
    } else if (opts.changeable) {
        desc = `You have a birthday set${existingPart}. You may update it.`;
    } else {
        desc = `Your birthday is set${existingPart}. Changes are disabled.`;
    }
    return { title: 'Birthday Manager', description: desc };
}

export function buildBirthdayRootComponents(opts: { hasBirthday: boolean; changeable: boolean }): Component[] {
    return [
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: 'Set Birthday', custom_id: 'bday:set', disabled: opts.hasBirthday && !opts.changeable },
                { type: 2, style: 2, label: 'View', custom_id: 'bday:view' },
                { type: 2, style: 2, label: 'Countdown', custom_id: 'bday:countdown' },
                { type: 2, style: 2, label: 'Today', custom_id: 'bday:today' }
            ]
        }
    ];
}

export function buildMonthSelect(selected?: number): Component {
    return {
        type: 1,
        components: [
            {
                type: 3,
                custom_id: 'bday:month',
                placeholder: 'Select month',
                min_values: 1,
                max_values: 1,
                options: Array.from({ length: 12 }, (_, i) => ({
                    label: `Month ${i + 1}`,
                    value: String(i + 1),
                    default: selected === i + 1
                }))
            }
        ]
    } as Component;
}

export function buildDaySelect(month: number, selected?: number): Component {
    const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const max = monthLengths[month - 1] || 31;
    return {
        type: 1,
        components: [
            {
                type: 3,
                custom_id: 'bday:day',
                placeholder: 'Select day',
                min_values: 1,
                max_values: 1,
                options: Array.from({ length: max }, (_, i) => ({
                    label: String(i + 1),
                    value: String(i + 1),
                    default: selected === i + 1
                }))
            }
        ]
    } as Component;
}

export function buildConfirmRow(month: number, day: number): Component {
    return {
        type: 1,
        components: [
            { type: 2, style: 3, label: `Confirm ${month}/${day}`, custom_id: `bday:confirm:${month}:${day}` },
            { type: 2, style: 2, label: 'Cancel', custom_id: 'bday:cancel' }
        ]
    } as Component;
}

export function buildSetFlowEmbeds(month?: number, day?: number): Embed[] {
    const lines: string[] = [];
    if (month) lines.push(`Month: **${month}**`);
    if (day) lines.push(`Day: **${day}**`);
    return [{ title: 'Set Birthday', description: lines.length ? lines.join('\n') : 'Select month and day.' }];
}

export function buildViewEmbed(existing: { month: number; day: number } | null, userId: string): Embed {
    if (!existing) return { title: 'Birthday', description: `<@${userId}> has not set a birthday.` };
    const until = daysUntil(existing.month, existing.day);
    const display = `${existing.month}/${existing.day}`;
    let suffix: string;
    if (until === 0) suffix = 'today!';
    else suffix = `${until} day${until === 1 ? '' : 's'} away`;
    return { title: 'Birthday', description: `<@${userId}> birthday: **${display}** (${suffix})` };
}
