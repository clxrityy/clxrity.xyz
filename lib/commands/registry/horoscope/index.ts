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
    // ...

    // Build menu UI (to be implemented)
    // ...

    return buildHoroscopeMenu({
        zodiac,
        cooldowns: { daily: false, weekly: false, monthly: false } // Placeholder cooldowns
    })
}
