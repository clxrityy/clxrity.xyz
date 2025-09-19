export const startedAt = Date.now();

export type CoreStatus = {
    online: boolean;
    guilds: number;
    startedAt: number;
};

let cache: CoreStatus = { online: true, guilds: 0, startedAt };
type Listener = (s: CoreStatus) => void;
const listeners = new Set<Listener>();

export function getCoreStatus(): CoreStatus { return cache; }

export function subscribe(fn: Listener): () => void {
    listeners.add(fn);
    // Immediate invoke with current cache (so subscribers always see something first)
    try { fn(cache); } catch { /* ignore listener error */ }
    return () => { listeners.delete(fn); };
}

function broadcast(next: CoreStatus) {
    for (const l of listeners) {
        try { l(next); } catch { /* ignore individual listener errors */ }
    }
}

function update(partial: Partial<Omit<CoreStatus, 'startedAt'>>) {
    const next: CoreStatus = { ...cache, ...partial };
    if (next.guilds === cache.guilds && next.online === cache.online) return; // no observable change
    cache = next;
    broadcast(cache);
}

// Resolve base URL without bundling heavy logic: prefer environment-provided origin
function baseOrigin(): string {
    const v = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    if (v) {
        const s = /^https?:\/\//i.test(v) ? v : `https://${v}`;
        try { return new URL(s).origin; } catch { /* fallthrough */ }
    }
    return process.env.NODE_ENV === 'production' ? 'https://localhost' : 'http://localhost:3000';
}

// Fetch guild count from Discord Bot API primarily; fall back to internal DB route if needed
async function fetchGuildCount(): Promise<number> {
    // 1) Discord Bot API (paginated)
    const token = process.env.DISCORD_BOT_TOKEN;
    if (token) {
        let after: string | undefined = undefined;
        let total = 0;
        for (let page = 0; page < 10; page++) { // cap pages to avoid long loops
            const qs = new URLSearchParams();
            qs.set('limit', '200');
            if (after) qs.set('after', after);
            const url = `https://discord.com/api/v10/users/@me/guilds?${qs.toString()}`;
            try {
                const res = await fetch(url, { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' });
                if (!res.ok) throw new Error(`Discord ${res.status}`);
                const arr: any[] = await res.json();
                total += arr.length;
                if (arr.length < 200) return total;
                after = arr[arr.length - 1]?.id;
                if (!after) return total;
            } catch {
                break; // fall back
            }
        }
        if (total > 0) return total;
    }

    // 2) Fallback: internal DB-backed endpoint
    try {
        const url = `${baseOrigin()}/api/status/count`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
            const j: any = await res.json();
            const n = Number(j?.guilds);
            if (Number.isFinite(n)) return n;
        }
    } catch { /* ignore */ }

    return cache.guilds || 0;
}

const REFRESH_INTERVAL_MS = 60_000; // 1 minute polling for changes
async function refreshLoop() {
    while (true) {
        try {
            const guilds = await fetchGuildCount();
            update({ guilds });
        } catch {
            // silent failure retains prior cache
        }
        await new Promise(r => setTimeout(r, REFRESH_INTERVAL_MS));
    }
}

// Kick off background loop (non-blocking)
refreshLoop();
