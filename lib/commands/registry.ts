import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';
import { latencyColor } from '../discord/embed';

// Central place to register commands; import and push to this array.
const commands: RegisteredCommand[] = [
    {
        name: 'ping',
        description: 'Respond with pong and latency',
        schema: z.object({}),
        execute: ({ ctx }) => {
            // Estimate latency using signature timestamp if present
            const tsSec = ctx.discord?.signatureTimestamp ? Number(ctx.discord.signatureTimestamp) : undefined;
            const nowMs = Date.now();
            const delta = tsSec ? Math.max(0, nowMs - tsSec * 1000) : 0;
            const color = latencyColor(delta || 0);
            return {
                embeds: [
                    {
                        title: 'Pong! 🏓',
                        description: tsSec ? `Latency ~ ${delta} ms` : 'Latency unavailable',
                        color,
                        fields: [
                            ...(ctx.discord?.guildId ? [{ name: 'Guild', value: ctx.discord.guildId, inline: true }] : []),
                            ...(ctx.discord?.channelId ? [{ name: 'Channel', value: ctx.discord.channelId, inline: true }] : []),
                        ],
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }
    },
];

export const registry = createRegistry(commands);
