import { z } from 'zod';
import { getZodiacSign } from '@/lib/astrology/zodiac';
import { buildHoroscopeMenu } from '@/lib/discord/horoscopeComponents';
import { errorEmbedFromError } from '@/lib/discord/embed';
import { CommandReply } from '../../types';

export const horoscopeSchema = z.object({});

export async function executeHoroscope({ ctx }: { ctx: any }): Promise<Extract<CommandReply, object>> {
    const userId = ctx.discord?.userId;
    const guildId = ctx.discord?.guildId;
    if (!userId || !guildId) {
        return {
            embeds: [
                errorEmbedFromError({
                    title: 'Invalid context',
                    fields: [{
                        name: "‎",
                        value: "This command must be used in a server.",
                    }],
                }),
            ],
            ephemeral: true,
        }
    }

    // Get birthday and zodiac
    const [{ getBirthday }] = await Promise.all([
        import('@/lib/db/birthday/birthdaysEdge'),
    ]);
    const bday = await getBirthday(guildId, userId);
    if (!bday) {
        return {
            embeds: [
                errorEmbedFromError({
                    title: 'Birthday not found',
                    fields: [{
                        name: "‎",
                        value: "You haven't set your birthday yet. Use `/birthday` to set it!",
                    }],
                }),
            ],
            ephemeral: true,
        }
    }
    const zodiac = getZodiacSign(bday.month, bday.day);
    if (!zodiac) {
        return { content: 'Could not determine your zodiac sign.', ephemeral: true };
    }

    // Cooldown check (to be implemented)
    // Cooldown check (CommandCooldown model, with period parsing)
    const [{ prisma }] = await Promise.all([
        import('@/lib/prisma'),
    ]);
    const periods = [
        { key: 'daily', duration: '1d' },
        { key: 'weekly', duration: '7d' },
        { key: 'monthly', duration: '1mo' },
    ] as const;
    const now = new Date();
    type PeriodKey = typeof periods[number]['key'];
    type CommandCooldown = {
        period: string;
        expiresAt: Date;
    };
    const cooldownsRaw: CommandCooldown[] = await prisma.commandCooldown.findMany({
        where: {
            userId,
            command: 'horoscope',
            period: { in: periods.map(p => p.key) },
        },
        select: { period: true, expiresAt: true },
    });
    // Map: period -> isActive, using parsed durations
    const cooldowns: Record<PeriodKey, boolean> = {
        daily: false,
        weekly: false,
        monthly: false,
    };
    for (const { key, duration } of periods) {
        const cd = cooldownsRaw.find(c => c.period === key);
        if (cd) {
            // If expiresAt is in the future, still on cooldown
            if (cd.expiresAt > now) {
                cooldowns[key] = true;
            }
        } else {
            // No cooldown exists, create one starting now
            const [{ parseCooldownPeriod }] = await Promise.all([
                import('@/lib/commands/parseCooldownPeriod'),
            ]);
            const ms = parseCooldownPeriod(duration);
            if (ms) {
                await prisma.commandCooldown.create({
                    data: {
                        userId,
                        command: 'horoscope',
                        period: key,
                        lastUsed: now,
                        expiresAt: new Date(now.getTime() + ms),
                    },
                });
                cooldowns[key] = true;
            }
        }
    }

    // Build menu UI (to be implemented)
    // ...

    return buildHoroscopeMenu({
        zodiac,
        cooldowns: { daily: false, weekly: false, monthly: false }, // Placeholder cooldowns
        ephemeral: ctx.ephemeral
    });
}
