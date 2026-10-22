import { DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { afterAll, afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { AppConfig } from '../src/config.js';
import { encodeEmbedMetadata } from '../src/embeds.js';
import { CliError, NotFoundError, UploadConflictError } from '../src/errors.js';
import type { ListedObject } from '../src/storage.js';
import { ownedPosterKey, R2Storage, sortListedObjects } from '../src/storage.js';

const config: AppConfig = {
    r2Endpoint: 'https://storage.example.test',
    r2AccessKeyId: 'synthetic-access-key',
    r2SecretAccessKey: 'synthetic-secret-never-echo',
    r2Bucket: 'regression-images',
    publicBaseUrl: 'https://images.example.test',
};

function serviceError(status: number, name = 'ServiceFailure'): S3ServiceException {
    return new S3ServiceException({
        name,
        $fault: 'client',
        $metadata: { httpStatusCode: status },
        message: config.r2SecretAccessKey,
    });
}

describe('R2Storage with intercepted SDK sends', () => {
    type Command = PutObjectCommand | HeadObjectCommand | ListObjectsV2Command | DeleteObjectCommand;
    type Response = Partial<HeadObjectCommandOutput & ListObjectsV2CommandOutput>;
    // The real SDK has callback overloads; these tests use only its promise API.
    const send = vi.spyOn(S3Client.prototype, 'send') as unknown as MockInstance<(command: Command) => Promise<Response>>;
    let storage: R2Storage;

    beforeEach(() => {
        // Fail closed: an unconfigured request can never reach a real endpoint.
        send.mockReset();
        send.mockRejectedValue(new Error('Unexpected SDK request'));
        storage = new R2Storage(config);
    });

    afterEach(() => {
        storage.destroy();
    });

    afterAll(() => {
        send.mockRestore();
    });

    const upload = (force = false) => storage.uploadObject({
        key: 'photo.png', data: Buffer.from('synthetic'), size: 9, contentType: 'image/png', force,
    });

    it.each([
        ['photo.jpg', 'image/jpeg'], ['photo.png', 'image/png'], ['photo.gif', 'image/gif'], ['clip.mp4', 'video/mp4'],
    ])('conditionally creates %s with correct public-serving headers', async (key, contentType) => {
        send.mockResolvedValueOnce({});
        const data = Buffer.from('synthetic');
        await expect(storage.uploadObject({ key, contentType, data, size: data.length, force: false })).resolves.toBe(`${config.publicBaseUrl}/${key}`);
        expect(send).toHaveBeenCalledTimes(1);
        const command = send.mock.calls[0]?.[0] as PutObjectCommand;
        expect(command).toBeInstanceOf(PutObjectCommand);
        expect(command.input).toMatchObject({
            Bucket: config.r2Bucket, Key: key, Body: data, ContentLength: data.length,
            ContentType: contentType, ContentDisposition: 'inline', CacheControl: 'no-store',
            IfNoneMatch: '*', Metadata: { 'upload-id': expect.stringMatching(/^[a-f0-9-]{36}$/) },
        });
    });

    it('force replaces the exact key without an If-None-Match condition', async () => {
        send.mockResolvedValueOnce({});
        await upload(true);
        const command = send.mock.calls[0]?.[0] as PutObjectCommand;
        expect(command.input.Key).toBe('photo.png');
        expect(command.input.IfNoneMatch).toBeUndefined();
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('reconciles a 412 and reports a conflict when another attempt owns the object', async () => {
        send.mockRejectedValueOnce(serviceError(412, 'PreconditionFailed'));
        send.mockResolvedValueOnce({ Metadata: { 'upload-id': 'another-attempt' } });
        await expect(upload()).rejects.toMatchObject({ name: 'UploadConflictError', key: 'photo.png', exitCode: 3 });
        expect(send.mock.calls[1]?.[0]).toBeInstanceOf(HeadObjectCommand);
        expect((send.mock.calls[1]?.[0] as HeadObjectCommand).input).toEqual({ Bucket: config.r2Bucket, Key: 'photo.png' });
    });

    it.each(['lost response', 'server error', 'retried conditional write'])('recognizes a committed attempt after %s', async (failure) => {
        let uploadId: string | undefined;
        send.mockImplementation(async (command) => {
            if (command instanceof PutObjectCommand) {
                uploadId = command.input.Metadata?.['upload-id'];
                if (failure === 'server error') throw serviceError(503);
                if (failure === 'retried conditional write') throw serviceError(412, 'PreconditionFailed');
                throw new Error(config.r2SecretAccessKey);
            }
            expect(command).toBeInstanceOf(HeadObjectCommand);
            return { Metadata: { 'upload-id': uploadId ?? '' } };
        });
        await expect(upload()).resolves.toBe(`${config.publicBaseUrl}/photo.png`);
        expect(uploadId).toEqual(expect.any(String));
        expect(send).toHaveBeenCalledTimes(2);
    });

    it.each(['missing metadata', 'failed HEAD'])('reports a safe ambiguous outcome with %s', async (reconciliation) => {
        send.mockRejectedValueOnce(new Error(config.r2SecretAccessKey));
        if (reconciliation === 'failed HEAD') send.mockRejectedValueOnce(serviceError(403));
        else send.mockResolvedValueOnce({ Metadata: {} });
        const error = await upload().catch((cause: unknown) => cause);
        expect(error).toBeInstanceOf(CliError);
        expect(error).not.toBeInstanceOf(UploadConflictError);
        expect((error as Error).message).toMatch(/photo\.png/);
        expect((error as Error).message).toMatch(/could not be confirmed|may still finish/i);
        expect((error as Error).message).not.toContain(config.r2SecretAccessKey);
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('does not mistake forbidden reads for missing objects', async () => {
        send.mockRejectedValueOnce(serviceError(403, 'AccessDenied'));
        const error = await storage.getObject('photo.png').catch((cause: unknown) => cause);
        expect(error).toBeInstanceOf(CliError);
        expect(error).not.toBeInstanceOf(NotFoundError);
        expect((error as Error).message).toMatch(/authentication/i);
        expect((error as Error).message).not.toContain(config.r2SecretAccessKey);
    });

    it('returns null for a genuine 404', async () => {
        send.mockRejectedValueOnce(serviceError(404, 'NotFound'));
        await expect(storage.getObject('photo.png')).resolves.toBeNull();
    });

    it('never issues DeleteObject for a missing object', async () => {
        send.mockRejectedValueOnce(serviceError(404, 'NoSuchKey'));
        await expect(storage.deleteObject('photo.png')).rejects.toBeInstanceOf(NotFoundError);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls.some(([command]) => command instanceof DeleteObjectCommand)).toBe(false);
    });

    it('never issues DeleteObject when HEAD is forbidden', async () => {
        send.mockRejectedValueOnce(serviceError(403));
        await expect(storage.deleteObject('photo.png')).rejects.toBeInstanceOf(CliError);
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('deletes only the exact existing key', async () => {
        send.mockResolvedValueOnce({ ContentLength: 42, LastModified: new Date(0) }).mockResolvedValueOnce({});
        await storage.deleteObject('photo.png');
        expect(send).toHaveBeenCalledTimes(2);
        expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand);
        const command = send.mock.calls[1]?.[0] as DeleteObjectCommand;
        expect(command).toBeInstanceOf(DeleteObjectCommand);
        expect(command.input).toEqual({ Bucket: config.r2Bucket, Key: 'photo.png' });
    });

    it('scans at least 1000 keys before sorting, forwards prefix and continuation, and filters unsafe keys', async () => {
        const older = new Date('2026-01-01T00:00:00Z');
        const newer = new Date('2026-02-01T00:00:00Z');
        const firstPage = Array.from({ length: 1000 }, (_, index) => ({
            Key: `photo${String(index).padStart(4, '0')}.png`, Size: index, LastModified: older,
        }));
        const snapshot = firstPage.map((entry) => ({ ...entry }));
        send.mockResolvedValueOnce({ Contents: firstPage, IsTruncated: true, NextContinuationToken: 'next-page' });
        send.mockResolvedValueOnce({
            Contents: [
                { Key: 'photoLatest.jpg', Size: 77, LastModified: newer },
                ...['folder/photo.png', 'photo.webp', 'photo.txt', 'photo.PNG', '.png', 'a.b.gif', ''].map((Key) => ({ Key, LastModified: newer })),
                { Key: 'no-date.png' }, { LastModified: newer },
            ], IsTruncated: false
        });
        const listed = await storage.listObjects('photo');
        expect(listed).toHaveLength(1001);
        expect(listed[0]).toEqual({ key: 'photoLatest.jpg', size: 77, lastModified: newer, url: `${config.publicBaseUrl}/photoLatest.jpg` });
        expect(listed.slice(1).map((object) => object.key)).toEqual(firstPage.map((object) => object.Key));
        expect(firstPage).toEqual(snapshot);
        expect(send).toHaveBeenCalledTimes(2);
        for (const [index, token] of [undefined, 'next-page'].entries()) {
            const command = send.mock.calls[index]?.[0] as ListObjectsV2Command;
            expect(command).toBeInstanceOf(ListObjectsV2Command);
            expect(command.input).toEqual({ Bucket: config.r2Bucket, Prefix: 'photo', ContinuationToken: token });
        }
    });

    it('uses an exact stem prefix and handles an empty bucket', async () => {
        send.mockResolvedValueOnce({});
        await expect(storage.listStemMatches('photo')).resolves.toEqual([]);
        expect((send.mock.calls[0]?.[0] as ListObjectsV2Command).input.Prefix).toBe('photo.');
    });

    const owner = '01234567-89ab-cdef-0123-456789abcdef';
    const posterKey = `_previews/${owner}.jpg`;
    const videoMetadata = (): Record<string, string> => ({
        ...encodeEmbedMetadata({ version: 1, kind: 'video', color: null, title: 'こんにちは', description: '', width: 8, height: 6, duration: 1, posterKey }),
        'upload-id': owner,
    });

    it('stores ASCII-safe embed metadata together with the reserved upload owner', async () => {
        const { 'upload-id': _owner, ...metadata } = videoMetadata();
        send.mockResolvedValueOnce({});
        await storage.uploadObject({ key: 'clip.mp4', data: Buffer.from('video'), contentType: 'video/mp4', force: false, metadata, uploadId: owner });
        expect((send.mock.calls[0]![0] as PutObjectCommand).input.Metadata).toEqual(videoMetadata());
        expect(metadata.embed).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('rejects ownership spoofing, unsafe keys and excessive metadata before any request', async () => {
        const input = { key: 'clip.mp4', data: Buffer.from('video'), contentType: 'video/mp4', force: false };
        await expect(storage.uploadObject({ ...input, metadata: { 'UPLOAD-ID': 'spoof' } })).rejects.toThrow(/reserved/i);
        await expect(storage.uploadObject({ ...input, metadata: { oversized: 'x'.repeat(2048) } })).rejects.toThrow(/metadata exceeds/i);
        await expect(storage.uploadObject({ ...input, key: '../clip.mp4' })).rejects.toThrow(/key/i);
        expect(send).not.toHaveBeenCalled();
    });

    it('lists videos but hides internal thumbnails without extra HEAD requests', async () => {
        send.mockResolvedValueOnce({
            Contents: [
                { Key: 'clip.mp4', Size: 20, LastModified: new Date(0) },
                { Key: posterKey, Size: 10, LastModified: new Date(0) },
            ]
        });
        expect((await storage.listObjects()).map(({ key }) => key)).toEqual(['clip.mp4']);
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('deletes media before its verified generation-owned poster', async () => {
        send.mockResolvedValueOnce({ Metadata: videoMetadata() }).mockResolvedValueOnce({})
            .mockResolvedValueOnce({ Metadata: { 'upload-id': owner } }).mockResolvedValueOnce({});
        await storage.deleteObject('clip.mp4');
        expect(send.mock.calls.map(([command]) => [command.constructor.name, 'Key' in command.input ? command.input.Key : undefined])).toEqual([
            ['HeadObjectCommand', 'clip.mp4'], ['DeleteObjectCommand', 'clip.mp4'],
            ['HeadObjectCommand', posterKey], ['DeleteObjectCommand', posterKey],
        ]);
    });

    it('refuses to delete a poster whose upload owner does not match its key', async () => {
        send.mockResolvedValueOnce({ Metadata: { 'upload-id': 'someone-else' } });
        await expect(storage.deletePoster(posterKey)).rejects.toThrow(/ownership/i);
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('does not authorize poster cleanup from malformed or cross-owned metadata', () => {
        const object = { key: 'clip.mp4', url: '', size: 1, lastModified: new Date(0) };
        expect(ownedPosterKey({ ...object, customMetadata: videoMetadata() })).toBe(posterKey);
        expect(ownedPosterKey({ ...object, customMetadata: { ...videoMetadata(), 'upload-id': 'another-owner' } })).toBeUndefined();
        expect(ownedPosterKey({ ...object, customMetadata: { embed: 'broken' } })).toBeUndefined();
    });
});

describe('sortListedObjects', () => {
    it('sorts newest-first and uses the key as a stable tie-breaker', () => {
        const objects: ListedObject[] = [
            {
                key: 'zebra.png',
                url: 'https://img.clxrity.xyz/zebra.png',
                size: 10,
                lastModified: new Date('2026-10-14T00:00:00.000Z'),
            },
            {
                key: 'alpha.jpg',
                url: 'https://img.clxrity.xyz/alpha.jpg',
                size: 10,
                lastModified: new Date('2026-10-16T00:00:00.000Z'),
            },
            {
                key: 'beta.jpg',
                url: 'https://img.clxrity.xyz/beta.jpg',
                size: 10,
                lastModified: new Date('2026-10-16T00:00:00.000Z'),
            },
        ];

        expect(sortListedObjects(objects).map((item) => item.key)).toEqual(['alpha.jpg', 'beta.jpg', 'zebra.png']);
        expect(objects.map((item) => item.key)).toEqual(['zebra.png', 'alpha.jpg', 'beta.jpg']);
        expect(sortListedObjects(objects)).not.toBe(objects);
    });

    it('breaks equal timestamps by code-point key order, not locale or original order', () => {
        const objects = ['z.png', 'a.png', '_a.png', 'A.png', '0.png', '-a.png'].map((key) => Object.freeze({
            key, url: `https://images.example.test/${key}`, size: 1, lastModified: new Date(0),
        }));
        Object.freeze(objects);
        expect(sortListedObjects(objects).map(({ key }) => key)).toEqual(['-a.png', '0.png', 'A.png', '_a.png', 'a.png', 'z.png']);
        expect(sortListedObjects([])).toEqual([]);
    });
});
