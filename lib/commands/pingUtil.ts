import { latencyColor } from '../discord/embed';

export interface PingEmbedOptions {
    signatureTimestamp?: string | null;
    nowMs?: number;
}

export function buildPingEmbed(opts: PingEmbedOptions) {
    const tsSec = opts.signatureTimestamp ? Number(opts.signatureTimestamp) : undefined;
    const nowMs = opts.nowMs ?? Date.now();
    const delta = tsSec ? Math.max(0, nowMs - tsSec * 1000) : 0;
    const color = latencyColor(delta || 0);
    return {
        title: 'Pong!',
        description: tsSec ? `\`${delta}\` ms` : 'Latency unavailable',
        color,
        timestamp: new Date().toISOString()
    };
}
