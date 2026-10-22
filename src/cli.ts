#!/usr/bin/env node
import { readFileSync } from 'node:fs';

import { Command, InvalidArgumentError } from 'commander';

import { getExitCode, formatError } from './errors.js';
import { runListCommand } from './commands/list.js';
import { runRemoveCommand } from './commands/remove.js';
import { runUploadCommand, type UploadCommandOptions } from './commands/upload.js';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('clxrity-img')
        .description('Upload, list, and delete images/videos hosted at img.clxrity.xyz via Cloudflare R2.')
        .version(packageJson.version)
        .showHelpAfterError()
        .option('--config <path>', 'path to a JSON config file');

    program
        .command('upload')
        .description('Upload media and print its share-page and direct-file URLs.')
        .argument('<file>', 'path to an image, MOV, or MP4 file')
        .argument('[name]', 'optional custom filename stem or filename')
        .option('--force', 'replace existing media at the same final filename')
        .option('--color [value]', 'override preview color (CSS name, blurple, #RGB, #RRGGBB); bare flag means transparent')
        .option('--title <text>', 'override preview title for this upload; an empty string clears its default')
        .option('--description [text]', 'override preview description for this upload; bare flag clears its default')
        .action(async (file: string, name: string | undefined, options: UploadCommandOptions, command: Command) => {
            await runUploadCommand(file, name, command, options);
        });

    program
        .command('list')
        .description('List uploaded images and videos.')
        .option('--limit <number>', 'number of items to show (default: 20)', parseInteger)
        .option('--prefix <value>', 'only show objects whose key starts with this prefix')
        .option('--all', 'show all uploaded media')
        .option('--json', 'output JSON instead of text')
        .action(async (options, command: Command) => {
            await runListCommand(command, options);
        });

    program
        .command('remove')
        .description('Delete uploaded media and its thumbnail by filename or unambiguous stem.')
        .argument('<idOrFilename>', 'exact filename (for example sunset.jpg) or an unambiguous stem')
        .option('--yes', 'skip the interactive confirmation prompt')
        .action(async (identifier: string, options: { yes?: boolean }, command: Command) => {
            await runRemoveCommand(identifier, command, options);
        });

    await program.parseAsync(process.argv);
}

function parseInteger(value: string): number {
    const parsed = Number(value);
    if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new InvalidArgumentError('--limit must be a positive integer.');
    }
    return parsed;
}

main().catch((error: unknown) => {
    process.stderr.write(`${formatError(error)}\n`);
    process.exitCode = getExitCode(error);
});
