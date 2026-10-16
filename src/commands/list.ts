import type { Command } from 'commander';

import { loadConfig } from '../config.js';
import { UsageError } from '../errors.js';
import { R2Storage } from '../storage.js';

export interface ListCommandOptions {
    readonly limit?: number;
    readonly prefix?: string;
    readonly all?: boolean;
    readonly json?: boolean;
}

export async function runListCommand(command: Command, options: ListCommandOptions): Promise<void> {
    if (options.all && options.limit !== undefined) {
        throw new UsageError('Use either --all or --limit, not both.');
    }

    if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit <= 0)) {
        throw new UsageError('--limit must be a positive integer.');
    }

    const config = await loadConfig({ configPath: command.optsWithGlobals<{ config?: string }>().config });
    const storage = new R2Storage(config);
    try {
        const allObjects = await storage.listObjects(options.prefix);
        const limit = options.all ? allObjects.length : (options.limit ?? 20);
        const selected = allObjects.slice(0, limit);

        if (options.json) {
            process.stdout.write(
                `${JSON.stringify(
                    selected.map((item) => ({
                        id: item.key,
                        key: item.key,
                        url: item.url,
                        size: item.size,
                        uploadedAt: item.lastModified.toISOString(),
                    })),
                    null,
                    2,
                )}\n`,
            );
            return;
        }

        if (selected.length === 0) {
            process.stdout.write('No uploaded images found.\n');
            return;
        }

        const formatter = new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });
        const timeZone = formatter.resolvedOptions().timeZone ?? 'local time';

        process.stdout.write(`Showing ${selected.length} upload(s) (${timeZone})\n\n`);

        for (const item of selected) {
            process.stdout.write(`${item.key}\n`);
            process.stdout.write(`  uploaded: ${formatter.format(item.lastModified)}\n`);
            process.stdout.write(`  size: ${formatBytes(item.size)}\n`);
            process.stdout.write(`  url: ${item.url}\n\n`);
        }
    } finally {
        storage.destroy();
    }
}

function formatBytes(value: number): string {
    if (value < 1024) {
        return `${value} B`;
    }

    if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(1)} KiB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
}
