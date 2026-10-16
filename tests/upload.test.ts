import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { runUploadCommand } from '../src/commands/upload.js';
import { CliError, UploadConflictError } from '../src/errors.js';
import type { UploadInput } from '../src/storage.js';

const mocks = vi.hoisted(() => ({
    config: vi.fn(), process: vi.fn(), generate: vi.fn(), upload: vi.fn(),
    cleanup: vi.fn(), destroy: vi.fn(), construct: vi.fn(),
}));

vi.mock('../src/config.js', () => ({ loadConfig: mocks.config }));
vi.mock('../src/images.js', () => ({ processImage: mocks.process }));
vi.mock('../src/names.js', async (original) => ({
    ...await original<typeof import('../src/names.js')>(), createGeneratedKey: mocks.generate,
}));
vi.mock('../src/storage.js', () => ({
    R2Storage: class {
        constructor() { mocks.construct(); }
        uploadObject = mocks.upload;
        destroy = mocks.destroy;
    },
}));

let directory: string;
let stdout: MockInstance<typeof process.stdout.write>;

beforeEach(async () => {
    vi.resetAllMocks();
    directory = await mkdtemp(join(tmpdir(), 'upload-handler-test-'));
    const outputPath = join(directory, 'processed.png');
    await writeFile(outputPath, 'synthetic image bytes');
    mocks.config.mockResolvedValue({});
    mocks.cleanup.mockResolvedValue(undefined);
    mocks.process.mockResolvedValue({ outputPath, extension: 'png', contentType: 'image/png', size: 21, warnings: [], cleanup: mocks.cleanup });
    mocks.generate.mockReturnValue('randomID.png');
    // Consume streams like the real SDK, including rejected conditional PUTs.
    mocks.upload.mockImplementation(async (input: UploadInput) => {
        for await (const _chunk of input.data) { /* consume synthetic file */ }
        return `https://images.example.test/${input.key}`;
    });
    stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
});

afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
});

describe('upload collision and cleanup orchestration', () => {
    const command = new Command();

    it('retries a random-ID collision with a fresh stream, never --force', async () => {
        mocks.generate.mockReturnValueOnce('firstKEY.png').mockReturnValueOnce('secondKY.png');
        mocks.upload.mockImplementationOnce(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* rejected upload */ }
            throw new UploadConflictError(input.key);
        });
        await runUploadCommand('unused-source', undefined, command, {});
        expect(mocks.upload).toHaveBeenCalledTimes(2);
        expect(mocks.upload.mock.calls.map(([input]) => input.key)).toEqual(['firstKEY.png', 'secondKY.png']);
        expect(mocks.upload.mock.calls.every(([input]) => input.force === false)).toBe(true);
        expect(mocks.upload.mock.calls[0]![0].data).not.toBe(mocks.upload.mock.calls[1]![0].data);
        expect(stdout).toHaveBeenCalledExactlyOnceWith('https://images.example.test/secondKY.png\n');
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
        expect(mocks.destroy).toHaveBeenCalledTimes(1);
    });

    it('never retries a named collision or prints a URL on failure', async () => {
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume */ }
            throw new UploadConflictError(input.key);
        });
        await expect(runUploadCommand('unused-source', 'sunset', command, {})).rejects.toBeInstanceOf(UploadConflictError);
        expect(mocks.upload).toHaveBeenCalledTimes(1);
        expect(mocks.generate).not.toHaveBeenCalled();
        expect(stdout).not.toHaveBeenCalled();
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
    });

    it('does not create another ID after an uncertain upload outcome', async () => {
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume */ }
            throw new CliError('Upload outcome could not be confirmed');
        });
        await expect(runUploadCommand('unused-source', undefined, command, {})).rejects.toThrow(/could not be confirmed/);
        expect(mocks.generate).toHaveBeenCalledTimes(1);
        expect(mocks.upload).toHaveBeenCalledTimes(1);
        expect(stdout).not.toHaveBeenCalled();
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
        expect(mocks.destroy).toHaveBeenCalledTimes(1);
    });

    it('bounds random collision retries and cleans up on exhaustion', async () => {
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume */ }
            throw new UploadConflictError(input.key);
        });
        await expect(runUploadCommand('unused-source', undefined, command, {})).rejects.toThrow(/unique random image ID/);
        expect(mocks.generate).toHaveBeenCalledTimes(10);
        expect(mocks.upload).toHaveBeenCalledTimes(10);
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
        expect(stdout).not.toHaveBeenCalled();
    });

    it('cleans up processed output even if client construction fails', async () => {
        mocks.construct.mockImplementationOnce(() => { throw new Error('synthetic client failure'); });
        await expect(runUploadCommand('unused-source', undefined, command, {})).rejects.toThrow(/synthetic client failure/);
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
        expect(mocks.upload).not.toHaveBeenCalled();
    });

    it('rejects --force without a custom name before processing or credentials', async () => {
        await expect(runUploadCommand('unused-source', undefined, command, { force: true })).rejects.toThrow(/--force requires/);
        expect(mocks.config).not.toHaveBeenCalled();
        expect(mocks.process).not.toHaveBeenCalled();
    });
});