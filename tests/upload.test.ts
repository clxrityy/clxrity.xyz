import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { runUploadCommand } from '../src/commands/upload.js';
import { decodeEmbedMetadata, encodeEmbedMetadata } from '../src/embeds.js';
import { CliError, UploadConflictError, UploadOutcomeUnknownError } from '../src/errors.js';
import type { UploadInput } from '../src/storage.js';

const mocks = vi.hoisted(() => ({
    config: vi.fn(), process: vi.fn(), generate: vi.fn(), upload: vi.fn(),
    cleanup: vi.fn(), destroy: vi.fn(), construct: vi.fn(), get: vi.fn(), deletePoster: vi.fn(),
}));

vi.mock('../src/config.js', () => ({ loadConfig: mocks.config }));
vi.mock('../src/media.js', () => ({ processMedia: mocks.process }));
vi.mock('../src/names.js', async (original) => ({
    ...await original<typeof import('../src/names.js')>(), createGeneratedKey: mocks.generate,
}));
vi.mock('../src/storage.js', async (original) => ({
    ...await original<typeof import('../src/storage.js')>(),
    R2Storage: class {
        constructor() { mocks.construct(); }
        uploadObject = mocks.upload;
        getObject = mocks.get;
        deletePoster = mocks.deletePoster;
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
    mocks.config.mockResolvedValue({ publicBaseUrl: 'https://images.example.test' });
    mocks.get.mockResolvedValue(null);
    mocks.deletePoster.mockResolvedValue(undefined);
    mocks.cleanup.mockResolvedValue(undefined);
    mocks.process.mockResolvedValue({ kind: 'image', outputPath, extension: 'png', contentType: 'image/png', size: 21, width: 8, height: 6, warnings: [], cleanup: mocks.cleanup });
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
        expect(stdout).toHaveBeenCalledExactlyOnceWith('Share: https://images.example.test/s/secondKY.png\nRaw: https://images.example.test/secondKY.png\n');
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
        await expect(runUploadCommand('unused-source', undefined, command, {})).rejects.toThrow(/unique random media ID/);
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

    it('snapshots upload-only overrides without modifying configured defaults', async () => {
        const defaults = Object.freeze({ color: '#5865F2', title: 'saved title', description: 'saved description' });
        mocks.config.mockResolvedValue({ publicBaseUrl: 'https://images.example.test', embedDefaults: defaults });
        await runUploadCommand('source', 'photo', command, { color: 'coral', title: 'coral', description: true });
        const input = mocks.upload.mock.calls[0]![0] as UploadInput;
        expect(decodeEmbedMetadata(input.metadata)).toMatchObject({ color: '#FF7F50', title: 'coral', description: '', kind: 'image', width: 8, height: 6 });
        expect(defaults).toEqual({ color: '#5865F2', title: 'saved title', description: 'saved description' });
        expect(input.uploadId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('clears inherited color with a bare flag and rejects invalid colors before config', async () => {
        await runUploadCommand('source', 'photo', command, { color: true });
        expect(decodeEmbedMetadata(mocks.upload.mock.calls[0]![0].metadata)?.color).toBeNull();
        mocks.config.mockClear();
        await expect(runUploadCommand('source', undefined, command, { color: 'url(evil)' })).rejects.toThrow(/color/i);
        expect(mocks.config).not.toHaveBeenCalled();
    });

    async function useVideo(): Promise<void> {
        const outputPath = join(directory, 'video.mp4');
        const posterPath = join(directory, 'poster.jpg');
        await Promise.all([writeFile(outputPath, 'synthetic video'), writeFile(posterPath, 'synthetic poster')]);
        mocks.process.mockResolvedValue({
            kind: 'video', outputPath, extension: 'mp4', contentType: 'video/mp4', size: 15,
            width: 8, height: 6, duration: 1, warnings: [], cleanup: mocks.cleanup,
            poster: { outputPath: posterPath, size: 16, width: 8, height: 6 },
        });
        mocks.generate.mockReturnValue('randomID.mp4');
    }

    it('publishes a generation-owned poster before the video metadata that references it', async () => {
        await useVideo();
        await runUploadCommand('source.mov', undefined, command, {});
        expect(mocks.upload).toHaveBeenCalledTimes(2);
        const poster = mocks.upload.mock.calls[0]![0] as UploadInput;
        const video = mocks.upload.mock.calls[1]![0] as UploadInput;
        expect(poster.key).toBe(`_previews/${video.uploadId}.jpg`);
        expect(poster.uploadId).toBe(video.uploadId);
        expect(poster.force).toBe(false);
        expect(decodeEmbedMetadata(video.metadata)).toMatchObject({ kind: 'video', posterKey: poster.key, duration: 1 });
        expect(mocks.deletePoster).not.toHaveBeenCalled();
        expect(stdout).toHaveBeenCalledExactlyOnceWith('Share: https://images.example.test/s/randomID.mp4\nRaw: https://images.example.test/randomID.mp4\n');
    });

    it('cleans its poster after a definite named media collision', async () => {
        await useVideo();
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume each stream */ }
            if (input.key === 'clip.mp4') throw new UploadConflictError(input.key);
            return `https://images.example.test/${input.key}`;
        });
        await expect(runUploadCommand('source.mov', 'clip', command, {})).rejects.toBeInstanceOf(UploadConflictError);
        expect(mocks.deletePoster).toHaveBeenCalledExactlyOnceWith(mocks.upload.mock.calls[0]![0].key);
        expect(stdout).not.toHaveBeenCalled();
    });

    it('never deletes a poster that an uncertain media write might reference', async () => {
        await useVideo();
        const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume each stream */ }
            if (input.key === 'clip.mp4') throw new UploadOutcomeUnknownError(input.key);
            return `https://images.example.test/${input.key}`;
        });
        await expect(runUploadCommand('source.mov', 'clip', command, {})).rejects.toBeInstanceOf(UploadOutcomeUnknownError);
        expect(mocks.deletePoster).not.toHaveBeenCalled();
        expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/Retained thumbnail.*uncertain/));
        expect(stdout).not.toHaveBeenCalled();
    });

    it('does not proceed to the media write after an uncertain poster upload', async () => {
        await useVideo();
        vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        mocks.upload.mockImplementation(async (input: UploadInput) => {
            for await (const _chunk of input.data) { /* consume */ }
            throw new UploadOutcomeUnknownError(input.key);
        });
        await expect(runUploadCommand('source.mov', 'clip', command, {})).rejects.toBeInstanceOf(UploadOutcomeUnknownError);
        expect(mocks.upload).toHaveBeenCalledTimes(1);
        expect(mocks.deletePoster).not.toHaveBeenCalled();
        expect(stdout).not.toHaveBeenCalled();
        expect(mocks.cleanup).toHaveBeenCalledTimes(1);
    });

    it('warns about cleanup failure without changing a successful forced upload result', async () => {
        await useVideo();
        const owner = '01234567-89ab-cdef-0123-456789abcdef';
        const posterKey = `_previews/${owner}.jpg`;
        mocks.get.mockResolvedValue({
            key: 'clip.mp4', customMetadata: {
                'upload-id': owner,
                ...encodeEmbedMetadata({ version: 1, kind: 'video', color: null, title: '', description: '', width: 8, height: 6, duration: 1, posterKey }),
            }
        });
        mocks.deletePoster.mockRejectedValue(new Error('synthetic cleanup failure'));
        const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        await runUploadCommand('source.mov', 'clip', command, { force: true });
        expect(stdout).toHaveBeenCalledWith(expect.stringContaining('/s/clip.mp4'));
        expect(stderr).toHaveBeenCalledWith(expect.stringContaining(posterKey));
    });

    it('cleans the previous generation only after a successful forced replacement', async () => {
        await useVideo();
        const owner = '01234567-89ab-cdef-0123-456789abcdef';
        const oldPoster = `_previews/${owner}.jpg`;
        mocks.get.mockResolvedValue({
            key: 'clip.mp4', customMetadata: {
                'upload-id': owner,
                ...encodeEmbedMetadata({ version: 1, kind: 'video', color: null, title: 'old', description: 'old', width: 8, height: 6, duration: 1, posterKey: oldPoster }),
            }
        });
        await runUploadCommand('source.mov', 'clip', command, { force: true });
        expect(mocks.deletePoster).toHaveBeenCalledExactlyOnceWith(oldPoster);
        expect(mocks.deletePoster.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.upload.mock.invocationCallOrder.at(-1)!);
        expect(decodeEmbedMetadata(mocks.upload.mock.calls[1]![0].metadata)).toMatchObject({ title: '', description: '', color: '#5865F2' });
    });
});