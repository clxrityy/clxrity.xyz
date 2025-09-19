// Handler for horoscope button interactions: applies cooldown and returns horoscope
import { fetchHoroscope, HoroscopeResponse } from '@/lib/astrology/horoscope';
import { parseCooldownPeriod } from '@/lib/commands/parseCooldownPeriod';
import { prisma } from '@/lib/prisma';
import { buildHoroscopeMenu } from './horoscopeComponents';

export async function handleHoroscopeButton({ userId, guildId, period, zodiacKey, ephemeral = true }: {
    userId: string;
    guildId: string;
    period: 'daily' | 'weekly' | 'monthly';
    zodiacKey: string;
    ephemeral?: boolean;
}) {
    // Cooldown durations
    const periodDurations = { daily: '1d', weekly: '7d', monthly: '1mo' } as const;
    const now = new Date();
    // Check cooldown
    const existing = await prisma.commandCooldown.findUnique({
        where: { userId_command_period: { userId, command: 'horoscope', period } },
    });
    if (existing && existing.expiresAt > now) {
        // Still on cooldown
        return { content: `You are still on cooldown for ${period}.`, ephemeral: true };
    }
    // Fetch horoscope
    const horoscope = await fetchHoroscope(getZodiacSignByKey(zodiacKey), period);
    // Set cooldown
    const ms = parseCooldownPeriod(periodDurations[period]);
    await prisma.commandCooldown.upsert({
        where: { userId_command_period: { userId, command: 'horoscope', period } },
        update: { lastUsed: now, expiresAt: new Date(now.getTime() + (ms || 0)) },
        create: {
            userId,
            command: 'horoscope',
            period,
            lastUsed: now,
            expiresAt: new Date(now.getTime() + (ms || 0)),
        },
    });
    // Get zodiac info
    const zodiac = getZodiacSignByKey(zodiacKey);
    // Return updated menu with new cooldowns
    const cooldowns = { daily: false, weekly: false, monthly: false };
    cooldowns[period] = true;
    const horoscopes: {
        daily: HoroscopeResponse<'daily'> | null;
        weekly: HoroscopeResponse<'weekly'> | null;
        monthly: HoroscopeResponse<'monthly'> | null;
    } = { daily: null, weekly: null, monthly: null };
    horoscopes[period] = horoscope as any;
    return buildHoroscopeMenu({ zodiac, cooldowns, horoscopes, ephemeral });
}

function getZodiacSignByKey(key: string) {
    const { ZODIAC } = require('@/lib/astrology/zodiac');
    return ZODIAC.find((z: any) => z.key === key);
}
