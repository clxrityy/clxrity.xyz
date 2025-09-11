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
    if (ms < 400) return successColor();
    if (ms < 800) return warnColor();
    return errorColor();
}

function truncate(text: string, max = 1000): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
}

// Build a standardized error embed with color, type, and message/stack
export function errorEmbedFromError(err: unknown, opts?: { title?: string; includeStack?: boolean; maxStack?: number }) {
    const anyErr = err as any;
    const name = anyErr?.name || 'Error';
    const message = typeof anyErr?.message === 'string' ? anyErr.message : String(anyErr);
    const stack = typeof anyErr?.stack === 'string' ? anyErr.stack : undefined;
    const title = opts?.title || 'Error';
    const includeStack = opts?.includeStack ?? false;
    const maxStack = opts?.maxStack ?? 900;

    return {
        title,
        color: errorColor(),
        fields: [
            { name: 'Type', value: name, inline: true },
            { name: 'Message', value: '```\n' + truncate(message, 1000) + '\n```' },
            ...(includeStack && stack ? [{ name: 'Stack', value: '```\n' + truncate(stack, maxStack) + '\n```' }] : []),
        ],
        timestamp: new Date().toISOString(),
    };
}