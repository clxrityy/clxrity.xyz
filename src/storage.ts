import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import {
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
    S3ServiceException,
} from '@aws-sdk/client-s3';

import type { AppConfig } from './config.js';
import { assertMetadataBudget, decodeEmbedMetadata } from './embeds.js';
import { CliError, NotFoundError, UploadConflictError, UploadOutcomeUnknownError, UsageError } from './errors.js';
import { isMediaKey, isPosterKey } from './media-types.js';
import { buildPublicUrl } from './names.js';

export interface ListedObject {
    readonly key: string;
    readonly url: string;
    readonly size: number;
    readonly lastModified: Date;
    readonly customMetadata?: Readonly<Record<string, string>>;
}

export interface UploadInput {
    readonly key: string;
    readonly data: Uint8Array | Readable;
    readonly size?: number;
    readonly contentType: string;
    readonly force: boolean;
    readonly metadata?: Readonly<Record<string, string>>;
    readonly uploadId?: string;
}

export class R2Storage {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicBaseUrl: string;

    constructor(config: AppConfig) {
        this.bucket = config.r2Bucket;
        this.publicBaseUrl = config.publicBaseUrl;
        this.client = new S3Client({
            endpoint: config.r2Endpoint,
            region: 'auto',
            maxAttempts: 3,
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
            requestHandler: { connectionTimeout: 10_000, requestTimeout: 120_000 },
            forcePathStyle: false,
            credentials: {
                accessKeyId: config.r2AccessKeyId,
                secretAccessKey: config.r2SecretAccessKey,
            },
        });
    }

    async uploadObject(input: UploadInput): Promise<string> {
        if (!isMediaKey(input.key) && !isPosterKey(input.key)) throw new UsageError('Invalid media storage key.');
        const uploadId = input.uploadId ?? randomUUID();
        if (!/^[a-f0-9-]{36}$/.test(uploadId)) throw new UsageError('Invalid upload ownership ID.');
        if (Object.keys(input.metadata ?? {}).some((key) => key.toLowerCase() === 'upload-id')) throw new UsageError('Upload ownership metadata is reserved.');
        const metadata = { ...input.metadata, 'upload-id': uploadId };
        assertMetadataBudget(metadata);
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: input.key,
                    Body: input.data,
                    ...(input.size !== undefined ? { ContentLength: input.size } : {}),
                    ContentType: input.contentType,
                    ContentDisposition: 'inline',
                    CacheControl: 'no-store',
                    IfNoneMatch: input.force ? undefined : '*',
                    Metadata: metadata,
                }),
            );
        } catch (error) {
            // A write can commit even if its response is lost. Reconcile this
            // exact attempt before reporting a collision or generating another ID.
            if (isConflictError(error) || isUncertainWrite(error)) {
                try {
                    const stored = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: input.key }));
                    if (stored.Metadata?.['upload-id'] === uploadId) return buildPublicUrl(this.publicBaseUrl, input.key);
                } catch {
                    // Never interpret a failed reconciliation as proof the write failed.
                }
            }
            if (isConflictError(error)) {
                throw new UploadConflictError(input.key, `Media already exists at ${input.key}. Use --force with that name to replace it.`);
            }
            if (isUncertainWrite(error)) {
                throw new UploadOutcomeUnknownError(input.key);
            }
            throw storageError(error);
        }

        return buildPublicUrl(this.publicBaseUrl, input.key);
    }

    async getObject(key: string): Promise<ListedObject | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );

            return {
                key,
                url: buildPublicUrl(this.publicBaseUrl, key),
                size: response.ContentLength ?? 0,
                lastModified: response.LastModified ?? new Date(0),
                ...(response.Metadata ? { customMetadata: response.Metadata } : {}),
            };
        } catch (error) {
            if (isNotFoundError(error)) {
                return null;
            }

            throw storageError(error);
        }
    }

    async listObjects(prefix?: string): Promise<ListedObject[]> {
        const objects: ListedObject[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this.client.send(
                new ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                }),
            ).catch((error: unknown) => { throw storageError(error); });

            for (const content of response.Contents ?? []) {
                if (!content.Key || !isMediaKey(content.Key) || !content.LastModified) {
                    continue;
                }

                objects.push({
                    key: content.Key,
                    url: buildPublicUrl(this.publicBaseUrl, content.Key),
                    size: Number(content.Size ?? 0),
                    lastModified: content.LastModified,
                });
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return sortListedObjects(objects);
    }

    async listStemMatches(stem: string): Promise<ListedObject[]> {
        const prefix = `${stem}.`;
        return this.listObjects(prefix);
    }

    async deleteObject(key: string): Promise<void> {
        if (!isMediaKey(key)) throw new UsageError('Only canonical media filenames can be removed.');
        const existing = await this.getObject(key);
        if (!existing) {
            throw new NotFoundError(`No uploaded media exists at ${key}.`);
        }

        // Remove the authoritative media first. A failed delete must never make
        // a still-published video lose its thumbnail.
        await this.deleteKey(key);
        const posterKey = ownedPosterKey(existing);
        if (posterKey) {
            try {
                await this.deletePoster(posterKey);
            } catch {
                process.stderr.write(`warning: Media was removed, but thumbnail cleanup failed for ${posterKey}.\n`);
            }
        }
    }

    async deletePoster(key: string): Promise<void> {
        if (!isPosterKey(key)) throw new UsageError('Invalid thumbnail storage key.');
        const object = await this.getObject(key);
        if (!object) return;
        if (`_previews/${object.customMetadata?.['upload-id'] ?? ''}.jpg` !== key) {
            throw new UsageError('Thumbnail ownership could not be verified; refusing to delete it.');
        }
        await this.deleteKey(key);
    }

    private async deleteKey(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        ).catch((error: unknown) => { throw storageError(error); });
    }

    destroy(): void {
        this.client.destroy();
    }
}

export function ownedPosterKey(object: ListedObject | null): string | undefined {
    if (!object || !object.key.endsWith('.mp4')) return undefined;
    try {
        const record = decodeEmbedMetadata(object.customMetadata);
        const owner = object.customMetadata?.['upload-id'];
        return record?.posterKey && owner && record.posterKey === `_previews/${owner}.jpg` ? record.posterKey : undefined;
    } catch {
        // Untrusted/legacy metadata cannot authorize deletion of another object.
        return undefined;
    }
}

export function sortListedObjects(objects: readonly ListedObject[]): ListedObject[] {
    return [...objects].sort((left, right) => {
        const timeDiff = right.lastModified.getTime() - left.lastModified.getTime();
        if (timeDiff !== 0) {
            return timeDiff;
        }

        return left.key < right.key ? -1 : left.key > right.key ? 1 : 0;
    });
}

function isConflictError(error: unknown): boolean {
    return error instanceof S3ServiceException && (error.$metadata.httpStatusCode === 412 || error.name === 'PreconditionFailed');
}

function isNotFoundError(error: unknown): boolean {
    return error instanceof S3ServiceException && (error.$metadata.httpStatusCode === 404 || error.name === 'NotFound' || error.name === 'NoSuchKey');
}

function isUncertainWrite(error: unknown): boolean {
    return !(error instanceof S3ServiceException) || (error.$metadata.httpStatusCode ?? 500) >= 500;
}

function storageError(error: unknown): CliError {
    if (error instanceof S3ServiceException) {
        const status = error.$metadata.httpStatusCode;
        if (status === 401 || status === 403) return new CliError('R2 authentication failed. Check your bucket-scoped Object Read & Write credentials.');
        if (status === 404) return new NotFoundError('The R2 bucket or media was not found. Check R2_BUCKET and R2_ENDPOINT.');
        return new CliError(`R2 request failed (${status ?? 'unknown status'}). Check your bucket, permissions, and endpoint.`);
    }
    return new CliError('Could not reach R2. Check your endpoint and network connection.');
}
