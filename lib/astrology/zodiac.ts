export type ZodiacSignKey =
    | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
    | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type ZodiacSign = {
    key: ZodiacSignKey;
    name: string;
    emoji: string;
    color: number; // integer color for Discord embeds
    thumbnail: string; // image URL
    start: { month: number; day: number };
    end: { month: number; day: number };
};

// Twemoji PNGs for zodiac symbols (72x72). Discord handles external URLs for thumbnails.
const T = (hex: string) => `https://twemoji.maxcdn.com/v/latest/72x72/${hex}.png`;

export const ZODIAC: ZodiacSign[] = [
    { key: 'aries', name: 'Aries', emoji: '♈', color: 0xE74C3C, thumbnail: T('2648'), start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { key: 'taurus', name: 'Taurus', emoji: '♉', color: 0x27AE60, thumbnail: T('2649'), start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { key: 'gemini', name: 'Gemini', emoji: '♊', color: 0xF1C40F, thumbnail: T('264a'), start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { key: 'cancer', name: 'Cancer', emoji: '♋', color: 0x3498DB, thumbnail: T('264b'), start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { key: 'leo', name: 'Leo', emoji: '♌', color: 0xE67E22, thumbnail: T('264c'), start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { key: 'virgo', name: 'Virgo', emoji: '♍', color: 0x2ECC71, thumbnail: T('264d'), start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { key: 'libra', name: 'Libra', emoji: '♎', color: 0x9B59B6, thumbnail: T('264e'), start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { key: 'scorpio', name: 'Scorpio', emoji: '♏', color: 0x8E44AD, thumbnail: T('264f'), start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { key: 'sagittarius', name: 'Sagittarius', emoji: '♐', color: 0xD35400, thumbnail: T('2650'), start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
    { key: 'capricorn', name: 'Capricorn', emoji: '♑', color: 0x34495E, thumbnail: T('2651'), start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { key: 'aquarius', name: 'Aquarius', emoji: '♒', color: 0x1ABC9C, thumbnail: T('2652'), start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { key: 'pisces', name: 'Pisces', emoji: '♓', color: 0x5DADE2, thumbnail: T('2653'), start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
];

function inRange(month: number, day: number, start: { month: number; day: number }, end: { month: number; day: number }): boolean {
    if (start.month <= end.month) {
        if (month < start.month || month > end.month) return false;
        if (month === start.month && day < start.day) return false;
        if (month === end.month && day > end.day) return false;
        return true;
    } else {
        // Wrap-around (e.g., Capricorn: Dec 22 -> Jan 19)
        if (month > start.month || month < end.month) return true;
        if (month === start.month && day >= start.day) return true;
        if (month === end.month && day <= end.day) return true;
        return false;
    }
}

export function getZodiacSign(month: number, day: number): ZodiacSign | null {
    for (const z of ZODIAC) {
        if (inRange(month, day, z.start, z.end)) return z;
    }
    return null;
}
