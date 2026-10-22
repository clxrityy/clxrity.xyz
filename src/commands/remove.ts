import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import type { Command } from 'commander';

import { loadConfig } from '../config.js';
import { AmbiguousMatchError, NotFoundError, UsageError } from '../errors.js';
import { buildPublicUrl, normalizeExistingKey, resolveIdentifierFromKeys, validateIdentifier } from '../names.js';
import { R2Storage } from '../storage.js';

export async function runRemoveCommand(identifier: string, command: Command, options: { yes?: boolean }): Promise<void> {
    validateIdentifier(identifier);
    if (!options.yes && (!process.stdin.isTTY || !process.stdout.isTTY)) {
        throw new UsageError('Use --yes when removing media from a non-interactive shell.');
    }
    const config = await loadConfig({ configPath: command.optsWithGlobals<{ config?: string }>().config });
    const storage = new R2Storage(config);

    try {
        const target = await resolveTargetKey(storage, identifier);

        if (!options.yes) {
            const confirmed = await confirmRemoval(target, config.publicBaseUrl);
            if (!confirmed) {
                process.stdout.write('Aborted.\n');
                return;
            }
        }

        await storage.deleteObject(target);
        process.stdout.write(`Removed ${target}\n`);
    } finally {
        storage.destroy();
    }
}

async function resolveTargetKey(storage: R2Storage, identifier: string): Promise<string> {
    if (identifier.includes('.')) {
        const exactKey = normalizeExistingKey(identifier);
        const existing = await storage.getObject(exactKey);
        if (!existing) {
            throw new NotFoundError(`No uploaded media exists at ${exactKey}.`);
        }

        return existing.key;
    }

    const matches = await storage.listStemMatches(identifier);
    const matchingKeys = resolveIdentifierFromKeys(identifier, matches.map((item) => item.key));

    if (matchingKeys.length === 0) {
        throw new NotFoundError(`No uploaded media matches the ID ${identifier}.`);
    }

    if (matchingKeys.length > 1) {
        throw new AmbiguousMatchError(identifier, matchingKeys);
    }

    return matchingKeys[0]!;
}

async function confirmRemoval(key: string, publicBaseUrl: string): Promise<boolean> {
    const rl = createInterface({ input, output });
    try {
        const answer = await rl.question(`Delete ${buildPublicUrl(publicBaseUrl, key)}? [y/N] `);
        return /^y(es)?$/i.test(answer.trim());
    } finally {
        rl.close();
    }
}
