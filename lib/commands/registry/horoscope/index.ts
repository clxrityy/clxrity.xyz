import { z } from 'zod';
import { getZodiacSign } from '@/lib/astrology/zodiac';
import { buildHoroscopeMenu } from '@/lib/discord/horoscopeComponents';
import { errorEmbedFromError } from '@/lib/discord/embed';
import { CommandReply } from '../../types';
import { boolish } from '../../util/boolish';

export const horoscopeSchema = z.object({
    public: boolish.optional().describe('Respond publicly')
});

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
    for (const { key } of periods) {
        const cd = cooldownsRaw.find(c => c.period === key);
        if (cd && cd.expiresAt > now) {
            cooldowns[key] = true;
        }
    }

    // Fetch horoscope data for each period (if not on cooldown, else null)
    const horoscopes: Record<PeriodKey, any> = {
        daily: null,
        weekly: null,
        monthly: null,
    };
    for (const { key } of periods) {
        if (!cooldowns[key]) {
            try {
                const { fetchHoroscope } = await import('@/lib/astrology/horoscope');
                horoscopes[key] = await fetchHoroscope(zodiac.key, key);
            } catch (e) {
                horoscopes[key] = null;
                console.error('Error fetching horoscope:', e);
            }
        }
    }

    return buildHoroscopeMenu({
        zodiac,
        cooldowns,
        horoscopes,
        ephemeral: ctx.ephemeral
    });
}
