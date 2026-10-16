import { createReadStream } from 'node:fs';

import type { Command } from 'commander';

import { loadConfig } from '../config.js';
import { UploadConflictError, UsageError } from '../errors.js';
import { processImage } from '../images.js';
import { createGeneratedKey, normalizeRequestedName } from '../names.js';
import { R2Storage } from '../storage.js';

export async function runUploadCommand(filePath: string, requestedName: string | undefined, command: Command, options: { force?: boolean }): Promise<void> {
    if (options.force && !requestedName) {
        throw new UsageError('--force requires a custom name. Randomly generated IDs never overwrite existing images.');
    }
    if (requestedName !== undefined) normalizeRequestedName(requestedName, 'png');
    const config = await loadConfig({ configPath: command.optsWithGlobals<{ config?: string }>().config });
    const processed = await processImage(filePath);
    let storage: R2Storage | undefined;

    const attempts = requestedName ? 1 : 10;
    let shareableUrl: string | undefined;

    try {
        storage = new R2Storage(config);
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const key = requestedName
                ? normalizeRequestedName(requestedName, processed.extension)
                : createGeneratedKey(processed.extension);

            const stream = createReadStream(processed.outputPath);
            try {
                shareableUrl = await storage.uploadObject({
                    key,
                    data: stream,
                    size: processed.size,
                    contentType: processed.contentType,
                    force: options.force ?? false,
                });
                break;
            } catch (error) {
                if (error instanceof UploadConflictError && !requestedName) continue;
                throw error;
            } finally {
                stream.destroy();
            }
        }

        if (!shareableUrl) {
            throw new UsageError('Could not allocate a unique random image ID after multiple attempts.');
        }

        for (const warning of processed.warnings) {
            process.stderr.write(`warning: ${warning}\n`);
        }

        process.stdout.write(`${shareableUrl}\n`);
    } finally {
        storage?.destroy();
        await processed.cleanup();
    }
}
