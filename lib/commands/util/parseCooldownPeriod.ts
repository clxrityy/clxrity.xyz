// Utility to parse cooldown period strings like '1h', '1m', '1s', '1d', '1mo' into milliseconds
// Supported: s (second), m (minute), h (hour), d (day), mo (month)

const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    mo: 30 * 24 * 60 * 60 * 1000, // Approximate month as 30 days
};

/**
 * Parses a cooldown period string (e.g., '1h', '30m', '2d', '1mo') into milliseconds.
 * @param periodStr The period string.
 * @returns The duration in milliseconds, or null if invalid.
 */
export function parseCooldownPeriod(periodStr: string): number | null {
    const regex = /^(\d+)(mo|[smhd])$/i;
    const match = regex.exec(periodStr);
    if (!match) return null;
    const [, numStr, unit] = match;
    const num = parseInt(numStr, 10);
    const mult = multipliers[unit.toLowerCase()];
    if (!mult) return null;
    return num * mult;
}
