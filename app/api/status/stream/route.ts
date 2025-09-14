export const runtime = 'edge';

import { subscribe } from '../shared';

// SSE endpoint that emits status only when it changes plus periodic keepalive comments.
export async function GET(request: Request) {
    const { signal } = request;
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            let open = true;
            let unsubscribe: (() => void) | null = null;
            let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

            const safeEnqueue = (chunk: string) => {
                if (!open) return;
                try {
                    controller.enqueue(encoder.encode(chunk));
                } catch {
                    close();
                }
            };

            const sendStatus = (status: any) => {
                safeEnqueue(`event: status\ndata: ${JSON.stringify(status)}\n\n`);
            };

            const sendKeepAlive = () => safeEnqueue(`: keepalive ${Date.now()}\n\n`);

            const close = () => {
                if (!open) return;
                open = false;
                if (unsubscribe) { try { unsubscribe(); } catch { /* ignore */ } }
                if (keepAliveInterval) clearInterval(keepAliveInterval);
                try { controller.close(); } catch { /* ignore */ }
            };

            if (signal.aborted) { close(); return; }
            signal.addEventListener('abort', close);

            // Subscribe (immediate push occurs inside shared.subscribe)
            unsubscribe = subscribe(sendStatus);
            // Keepalive every 30s regardless of changes
            keepAliveInterval = setInterval(sendKeepAlive, 30000);
        },
        cancel() {
            // reader canceled
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    });
}
