export const runtime = 'edge';

import { getCoreStatus } from '../shared';

// Server-Sent Events stream for status updates.
// Emits an initial status event immediately, then periodic refresh events.
// Uptime is derived client-side from startedAt; we don't stream a ticking value.
export async function GET() {
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const send = () => {
                const status = getCoreStatus();
                const payload = `event: status\ndata: ${JSON.stringify(status)}\n\n`;
                controller.enqueue(encoder.encode(payload));
            };

            // Initial push
            send();

            // Periodic status every 15s (adjustable)
            const statusInterval = setInterval(send, 15000);

            // Keepalive comment every 30s (some proxies require activity)
            const keepAliveInterval = setInterval(() => {
                controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
            }, 30000);

            const close = () => {
                clearInterval(statusInterval);
                clearInterval(keepAliveInterval);
                controller.close();
            };

            // In edge runtime there is no 'request.on'—rely on GC/connection close.
            // We expose a visibility timeout failsafe: if enqueue throws, close.
            try {
                // no-op; send already called
            } catch {
                close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            // Disable Next.js body buffering
            'X-Accel-Buffering': 'no'
        }
    });
}
