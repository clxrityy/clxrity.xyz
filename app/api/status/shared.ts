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

// Placeholder for real guild count acquisition. Replace implementation to pull from bot service or DB.
async function fetchGuildCount(): Promise<number> {
    return 0;
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
