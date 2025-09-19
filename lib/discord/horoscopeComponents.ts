// Discord component builder for /horoscope command menu
import type { CommandReply } from '@/lib/commands/types';

export function buildHoroscopeMenu({ zodiac, cooldowns, horoscopes, ephemeral }: {
    zodiac: { name: string; emoji: string; thumbnail: string };
    cooldowns: { daily: boolean; weekly: boolean; monthly: boolean };
    horoscopes: { daily: any; weekly: any; monthly: any };
    ephemeral?: boolean;
}): Extract<CommandReply, object> {
    // Show the first available horoscope (not on cooldown), else just the menu
    let description = 'Choose a period to view your horoscope.';
    if (horoscopes.daily?.data?.horoscope_data) {
        description = horoscopes.daily.data.horoscope_data;
    } else if (horoscopes.weekly?.data?.horoscope_data) {
        description = horoscopes.weekly.data.horoscope_data;
    } else if (horoscopes.monthly?.data?.horoscope_data) {
        description = horoscopes.monthly.data.horoscope_data;
    }
    return {
        content: `Horoscope for ${zodiac.emoji} ${zodiac.name}`,
        embeds: [
            {
                title: `${zodiac.emoji} ${zodiac.name}`,
                description,
                thumbnail: { url: zodiac.thumbnail },
            },
        ],
        components: [
            {
                type: 1, // Action row
                components: [
                    {
                        type: 2, // Button
                        style: 1, // Primary
                        label: 'Daily',
                        custom_id: 'horoscope:daily',
                        disabled: cooldowns.daily,
                    },
                    {
                        type: 2,
                        style: 2, // Secondary
                        label: 'Weekly',
                        custom_id: 'horoscope:weekly',
                        disabled: cooldowns.weekly,
                    },
                    {
                        type: 2,
                        style: 2, // Secondary
                        label: 'Monthly',
                        custom_id: 'horoscope:monthly',
                        disabled: cooldowns.monthly,
                    },
                ],
            },
        ],
        ephemeral: (ephemeral !== undefined) ? !ephemeral : true
    };
}
