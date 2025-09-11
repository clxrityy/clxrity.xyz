import { createRegistry, type RegisteredCommand } from './types';
import { z } from 'zod';

// Central place to register commands; import and push to this array.
const commands: RegisteredCommand[] = [
    {
        name: 'ping',
        description: 'Respond with pong',
        schema: z.object({}),
        execute: () => 'Pong!'
    },
    {
        name: 'about',
        description: 'Show info about this service',
        schema: z.object({ ephemeral: z.boolean().optional() }),
        execute: ({ args }) => ({
            content: 'About this bot',
            ephemeral: !!args.ephemeral,
            embeds: [
                {
                    title: 'hbd.clxrity.xyz',
                    description: 'Next.js on the Edge with Neon + Prisma, typed command router, and Discord interactions.',
                    color: 0x5865f2,
                    fields: [
                        { name: 'Runtime', value: 'Next.js 14 (Edge API for interactions)', inline: true },
                        { name: 'DB', value: 'Neon Postgres (Prisma in Node runtime)', inline: true },
                    ],
                },
            ],
        })
    }
];

export const registry = createRegistry(commands);
