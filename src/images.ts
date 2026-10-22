import { chmod, mkdtemp, open, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';

import sharp, { type Metadata, type Sharp } from 'sharp';

import { CliError, UnsupportedImageError, UsageError } from './errors.js';
import { MIME_TYPES, type OutputExtension, normalizeOutputExtension } from './names.js';

export interface ProcessedImage {
    readonly inputPath: string;
    readonly outputPath: string;
    readonly cleanup: () => Promise<void>;
    readonly extension: OutputExtension;
    readonly contentType: string;
    readonly warnings: string[];
    readonly width: number;
    readonly height: number;
    readonly frameCount: number;
    readonly size: number;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_INPUT_PIXELS = 100_000_000;
const MAX_FRAMES = 512;
const PROCESS_TIMEOUT_SECONDS = 60;
const SUPPORTED_INPUT_FORMATS = new Set(['jpeg', 'png', 'gif', 'webp', 'avif', 'heif', 'svg', 'tiff']);
const SOFTWARE_MARKER = 'clxrity-img';

export interface ImageLimits {
    readonly maxBytes: number;
    readonly maxPixels: number;
    readonly maxFrames: number;
    readonly timeoutSeconds: number;
}

export async function processImage(inputValue: string, overrides: Partial<ImageLimits> = {}): Promise<ProcessedImage> {
    const limits: ImageLimits = {
        maxBytes: MAX_FILE_SIZE_BYTES,
        maxPixels: MAX_INPUT_PIXELS,
        maxFrames: MAX_FRAMES,
        timeoutSeconds: PROCESS_TIMEOUT_SECONDS,
        ...overrides,
    };
    if (Object.values(limits).some((value) => !Number.isSafeInteger(value) || value <= 0)) {
        throw new UsageError('Image safety limits must be positive integers.');
    }
    const inputPath = await resolveInputPath(inputValue);
    const fileStat = await stat(inputPath);

    if (!fileStat.isFile()) {
        throw new UsageError(`Input path is not a file: ${inputValue}`);
    }

    if (fileStat.size > limits.maxBytes) {
        throw new UsageError(`Input exceeds the file-size limit (${limits.maxBytes} bytes; default 100 MiB).`);
    }

    let temporaryDirectory: string | undefined;
    try {
        // libvips can expose APNG as a single static frame. Inspect the container
        // before decoding so an animation is never silently flattened.
        await rejectAnimatedPng(inputPath, fileStat.size);
        const metadataReader = sharp(inputPath, {
            animated: true,
            failOn: 'warning',
            limitInputPixels: limits.maxPixels,
        });

        const metadata = await metadataReader.metadata();
        const format = metadata.format?.toLowerCase();
        if (!format || !SUPPORTED_INPUT_FORMATS.has(format)) {
            throw new UnsupportedImageError('Unsupported image format or unreadable image data.');
        }

        const frameCount = metadata.pages ?? 1;
        if (frameCount > limits.maxFrames) {
            throw new UsageError(`Animated images may have at most ${limits.maxFrames} frames.`);
        }

        const width = metadata.width ?? 0;
        const height = metadata.pageHeight ?? metadata.height ?? 0;
        if (width <= 0 || height <= 0) {
            throw new UnsupportedImageError('Could not determine the image dimensions.');
        }

        if (width * height * frameCount > limits.maxPixels) {
            throw new UsageError('Image dimensions are too large to process safely.');
        }

        assertSupportedFrameBehavior(format, frameCount);

        const { extension, warnings } = determineOutputFormat(format, frameCount);
        const pipeline = sharp(inputPath, {
            animated: frameCount > 1,
            failOn: 'warning',
            limitInputPixels: limits.maxPixels,
        })
            .toColourspace('srgb')
            .timeout({ seconds: limits.timeoutSeconds });

        // Rotation of multi-page images has restricted support; GIF/WebP don't
        // need EXIF orientation. Default Sharp output strips identifying metadata.
        if (frameCount === 1) pipeline.autoOrient();

        applyOutputFormat(pipeline, extension, metadata);

        temporaryDirectory = await mkdtemp(join(tmpdir(), 'clxrity-img-'));
        const outputPath = join(temporaryDirectory, `image.${extension}`);
        const info = await pipeline.toFile(outputPath);

        if (extension === 'png') {
            await addPngSoftwareMarker(outputPath);
        }

        await chmod(outputPath, 0o600);
        const outputStat = await stat(outputPath);
        if (outputStat.size > limits.maxBytes) {
            throw new UsageError(`Processed output exceeds the upload limit (${limits.maxBytes} bytes; default 100 MiB).`);
        }

        const normalizedExtension = normalizeOutputExtension(info.format ?? extension);
        const directory = temporaryDirectory;

        return {
            inputPath,
            outputPath,
            cleanup: () => rm(directory, { recursive: true, force: true }),
            extension: normalizedExtension,
            contentType: MIME_TYPES[normalizedExtension],
            warnings,
            width: info.width,
            height: info.pageHeight ?? info.height,
            frameCount: info.pages ?? frameCount,
            size: outputStat.size,
        };
    } catch (error) {
        if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
        if (error instanceof CliError) {
            throw error;
        }

        throw new UnsupportedImageError('Could not decode or process this image. It may be corrupt, exceed safety limits, or require an unavailable codec. Convert it to PNG, JPEG, or GIF locally and try again.');
    }
}

export async function resolveInputPath(inputValue: string): Promise<string> {
    const expanded = expandHomeDirectory(inputValue);
    const absolute = resolve(process.cwd(), expanded);
    try {
        return await realpath(absolute);
    } catch {
        throw new UsageError(`Cannot read the input image: ${inputValue}`);
    }
}

function expandHomeDirectory(value: string): string {
    if (value === '~') {
        return homedir();
    }

    if (value.startsWith('~/')) {
        return resolve(homedir(), value.slice(2));
    }

    return value;
}

function assertSupportedFrameBehavior(format: string, frameCount: number): void {
    if (frameCount <= 1) {
        return;
    }

    if (format === 'png') {
        throw new UnsupportedImageError('Animated PNG (APNG) uploads are not supported in v1.');
    }

    if (format === 'avif' || format === 'heif') {
        throw new UnsupportedImageError('Animated AVIF/HEIF uploads are not supported in v1.');
    }

    if (format === 'tiff') {
        throw new UnsupportedImageError('Multi-page TIFF uploads are not supported in v1.');
    }
}

function determineOutputFormat(format: string, frameCount: number): { extension: OutputExtension; warnings: string[] } {
    switch (format) {
        case 'jpeg':
            return { extension: 'jpg', warnings: [] };
        case 'png':
            return { extension: 'png', warnings: [] };
        case 'gif':
            return { extension: 'gif', warnings: [] };
        case 'svg':
            return { extension: 'png', warnings: ['Converted SVG to PNG for safe public hosting.'] };
        case 'webp':
            if (frameCount > 1) {
                return { extension: 'gif', warnings: ['Converted animated WebP to GIF for broader embedding compatibility.'] };
            }

            return { extension: 'png', warnings: ['Converted WebP to PNG for broader embedding compatibility.'] };
        case 'avif':
        case 'heif':
            return { extension: 'png', warnings: ['Converted AVIF/HEIF to PNG for broader embedding compatibility.'] };
        case 'tiff':
            return { extension: 'png', warnings: ['Converted TIFF to PNG for broader embedding compatibility.'] };
        default:
            throw new UnsupportedImageError(`Unsupported image format: ${format}`);
    }
}

function applyOutputFormat(pipeline: Sharp, extension: OutputExtension, metadata: Metadata): void {
    switch (extension) {
        case 'jpg':
            pipeline.withExif({ IFD0: { Software: SOFTWARE_MARKER } });
            pipeline.jpeg({ quality: 95, chromaSubsampling: '4:4:4', progressive: true });
            return;
        case 'png':
            pipeline.png({ compressionLevel: 9 });
            return;
        case 'gif':
            pipeline.gif({
                keepDuplicateFrames: true,
                loop: metadata.loop ?? 1,
                ...(metadata.delay ? { delay: metadata.delay } : {}),
            });
            return;
    }
}

async function rejectAnimatedPng(path: string, size: number): Promise<void> {
    const file = await open(path, 'r');
    try {
        const header = Buffer.alloc(8);
        await file.read(header, 0, 8, 0);
        if (!header.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return;
        let offset = 8;
        while (offset + 8 <= size) {
            const read = await file.read(header, 0, 8, offset);
            if (read.bytesRead !== 8) break;
            const length = header.readUInt32BE(0);
            const type = header.toString('ascii', 4, 8);
            if (type === 'acTL') throw new UnsupportedImageError('Animated PNG (APNG) uploads are not supported in v1.');
            if (type === 'IDAT' || type === 'IEND') return;
            if (offset + length + 12 > size) throw new UnsupportedImageError('Invalid PNG container.');
            offset += length + 12;
        }
    } finally {
        await file.close();
    }
}

async function addPngSoftwareMarker(path: string): Promise<void> {
    const input = await readFile(path);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!input.subarray(0, 8).equals(pngSignature)) {
        throw new UnsupportedImageError('Invalid PNG container.');
    }

    const ihdrLength = input.readUInt32BE(8);
    const ihdrType = input.toString('ascii', 12, 16);
    if (ihdrType !== 'IHDR') {
        throw new UnsupportedImageError('Invalid PNG container.');
    }

    const insertAt = 8 + 12 + ihdrLength;
    const textData = Buffer.from(`Software\0${SOFTWARE_MARKER}`, 'latin1');
    const type = Buffer.from('tEXt', 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(textData.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, textData])), 0);

    const chunk = Buffer.concat([length, type, textData, crc]);
    await writeFile(path, Buffer.concat([input.subarray(0, insertAt), chunk, input.subarray(insertAt)]));
}

function crc32(value: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of value) {
        crc ^= byte;
        for (let index = 0; index < 8; index += 1) {
            crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}
