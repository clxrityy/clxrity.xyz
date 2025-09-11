export function parseColor(input?: string | number | null): number | undefined {
    if (input == null) return undefined;
    if (typeof input === 'number') return input >>> 0;
    const s = input.trim().toLowerCase();
    const named: Record<string, number> = {
        red: 0xff0000,
        green: 0x57f287,
        blue: 0x3498db,
        yellow: 0xfee75c,
        orange: 0xfaa61a,
        purple: 0x9b59b6,
        pink: 0xeb459e,
        white: 0xffffff,
        black: 0x000000,
        grey: 0x95a5a6,
        gray: 0x95a5a6,
    };
    if (s in named) return named[s];
    const hex = s.replace(/^#/, '');
    if (/^[0-9a-f]{6}$/i.test(hex)) return parseInt(hex, 16);
    return undefined;
}

export function successColor() { return 0x57f287; }
export function warnColor() { return 0xfee75c; }
export function errorColor() { return 0xed4245; }

export function latencyColor(ms: number) {
    if (ms < 150) return successColor();
    if (ms < 300) return warnColor();
    return errorColor();
}