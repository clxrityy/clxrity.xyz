import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';

import type { Command } from 'commander';

import { loadConfig } from '../config.js';
import { encodeEmbedMetadata, resolveEmbedStyle, type EmbedFlags, type EmbedRecord } from '../embeds.js';
import { UploadConflictError, UploadOutcomeUnknownError, UsageError } from '../errors.js';
import { processMedia } from '../media.js';
import { buildShareUrl, createGeneratedKey, normalizeRequestedName } from '../names.js';
import { ownedPosterKey, R2Storage, type UploadInput } from '../storage.js';

export interface UploadCommandOptions extends EmbedFlags {
    readonly force?: boolean;
}

export async function runUploadCommand(filePath: string, requestedName: string | undefined, command: Command, options: UploadCommandOptions): Promise<void> {
    if (options.force && !requestedName) {
        throw new UsageError('--force requires a custom name. Randomly generated IDs never overwrite existing media.');
    }
    if (requestedName !== undefined) normalizeRequestedName(requestedName, 'png');
    // Fail on malformed flags before reading credentials or processing a file.
    resolveEmbedStyle(undefined, options);
    const config = await loadConfig({ configPath: command.optsWithGlobals<{ config?: string }>().config });
    const style = resolveEmbedStyle(config.embedDefaults, options);
    const processed = await processMedia(filePath, config.videoLimits);
    let storage: R2Storage | undefined;
    const uploadId = randomUUID();
    const posterKey = processed.poster ? `_previews/${uploadId}.jpg` : undefined;
    let posterStarted = false;
    let uncertainPoster = false;
    let uncertainMedia = false;
    let committed = false;

    try {
        const record: EmbedRecord = {
            ...style, version: 1, kind: processed.kind, width: processed.width, height: processed.height,
            ...(processed.duration !== undefined ? { duration: processed.duration } : {}),
            ...(posterKey ? { posterKey } : {}),
        };
        const metadata = encodeEmbedMetadata(record);
        storage = new R2Storage(config);
        const attempts = requestedName ? 1 : 10;
        // A named replacement keeps the old thumbnail alive until the new media
        // and its metadata are committed together by the conditional/forced PUT.
        const namedKey = requestedName ? normalizeRequestedName(requestedName, processed.extension) : undefined;
        const previousPoster = options.force && namedKey ? ownedPosterKey(await storage.getObject(namedKey)) : undefined;

        if (posterKey && processed.poster) {
            posterStarted = true;
            try {
                await uploadFile(storage, processed.poster.outputPath, {
                    key: posterKey, size: processed.poster.size, contentType: 'image/jpeg', force: false, uploadId,
                });
            } catch (error) {
                uncertainPoster = error instanceof UploadOutcomeUnknownError;
                throw error;
            }
        }

        let rawUrl: string | undefined;
        let finalKey: string | undefined;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const key = namedKey ?? createGeneratedKey(processed.extension);
            try {
                rawUrl = await uploadFile(storage, processed.outputPath, {
                    key, size: processed.size, contentType: processed.contentType,
                    force: options.force ?? false, metadata, uploadId,
                });
                committed = true;
                finalKey = key;
                break;
            } catch (error) {
                uncertainMedia = error instanceof UploadOutcomeUnknownError;
                if (error instanceof UploadConflictError && !requestedName) continue;
                throw error;
            }
        }

        if (!rawUrl || !finalKey) {
            throw new UsageError('Could not allocate a unique random media ID after multiple attempts.');
        }

        if (previousPoster && previousPoster !== posterKey) {
            await cleanupPoster(storage, previousPoster);
        }

        for (const warning of processed.warnings) {
            process.stderr.write(`warning: ${warning}\n`);
        }

        process.stdout.write(`Share: ${buildShareUrl(config.publicBaseUrl, finalKey)}\nRaw: ${rawUrl}\n`);
    } finally {
        try {
            if (storage && posterKey && posterStarted && !committed) {
                if (uncertainMedia || uncertainPoster) {
                    process.stderr.write(`warning: Retained thumbnail ${posterKey} because an upload outcome is uncertain. Inspect the media before cleaning it up.\n`);
                } else {
                    await cleanupPoster(storage, posterKey);
                }
            }
        } finally {
            storage?.destroy();
            await processed.cleanup();
        }
    }
}

async function uploadFile(storage: R2Storage, path: string, input: Omit<UploadInput, 'data'>): Promise<string> {
    const stream = createReadStream(path);
    try {
        return await storage.uploadObject({ ...input, data: stream });
    } finally {
        // Every retry gets a new stream, even when a conditional PUT is rejected.
        stream.destroy();
    }
}

async function cleanupPoster(storage: R2Storage, key: string): Promise<void> {
    try {
        await storage.deletePoster(key);
    } catch {
        process.stderr.write(`warning: Thumbnail cleanup failed for ${key}. The media upload result is unchanged.\n`);
    }
}
