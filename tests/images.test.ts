import { mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import sharp, { type Sharp } from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UnsupportedImageError, UsageError } from '../src/errors.js';
import { type ImageLimits, type ProcessedImage, processImage, resolveInputPath } from '../src/images.js';

const SOFTWARE_MARKER = 'clxrity-img';

const fixtures = vi.hoisted(() => ({ home: '', outputs: [] as string[] }));
vi.mock('node:os', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:os')>();
    return { ...actual, homedir: () => fixtures.home };
});
vi.mock('node:fs/promises', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs/promises')>();
    return {
        ...actual,
        mkdtemp: async (...args: Parameters<typeof actual.mkdtemp>) => {
            const directory = await actual.mkdtemp(...args);
            if (String(args[0]).endsWith('clxrity-img-')) fixtures.outputs.push(String(directory));
            return directory;
        },
    };
});

let directory: string;
const cleanups: Array<() => Promise<void>> = [];

beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'regression-images-'));
    fixtures.home = directory;
    fixtures.outputs.length = 0;
});

afterEach(async () => {
    vi.restoreAllMocks();
    try {
        await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
        // Check rejected processing paths too; do not hide leaks with test cleanup.
        for (const output of fixtures.outputs) {
            await expect(stat(output)).rejects.toMatchObject({ code: 'ENOENT' });
        }
    } finally {
        await Promise.all([...fixtures.outputs, directory].map((path) => rm(path, { recursive: true, force: true })));
    }
});

function image(): Sharp {
    return sharp({ create: { width: 12, height: 8, channels: 4, background: { r: 240, g: 20, b: 80, alpha: 0.5 } } });
}

async function withProcessed(
    path: string,
    check: (processed: ProcessedImage) => Promise<void> | void,
    limits: Partial<ImageLimits> = {},
): Promise<void> {
    const original = await readFile(path);
    const processed = await processImage(path, limits);
    // Register immediately: an assertion or metadata decode must never leak output.
    cleanups.push(processed.cleanup);
    try {
        expect(processed.outputPath).not.toBe(path);
        expect(processed.inputPath).toBe(await realpath(path));
        expect(processed.size).toBe((await stat(processed.outputPath)).size);
        if (process.platform !== 'win32') expect((await stat(processed.outputPath)).mode & 0o777).toBe(0o600);
        await check(processed);
    } finally {
        await processed.cleanup();
        await expect(stat(dirname(processed.outputPath))).rejects.toMatchObject({ code: 'ENOENT' });
        expect(await readFile(path)).toEqual(original);
    }
}

function animation(): Sharp {
    // Three 4x4 frames, the first two identical: frame dropping would be observable.
    const pixels = Buffer.alloc(4 * 4 * 3 * 3);
    for (let pixel = 0; pixel < 4 * 4 * 3; pixel += 1) {
        pixels[pixel * 3 + (pixel < 32 ? 0 : 2)] = 255;
    }
    return sharp(pixels, { raw: { width: 4, height: 12, channels: 3, pageHeight: 4 } });
}

function duplicateFirstWebpFrame(input: Buffer): Buffer {
    // WebP's encoder may coalesce duplicates. Duplicate a Sharp-generated ANMF
    // chunk ourselves so the decoder is tested against an actual duplicate frame.
    let offset = 12;
    while (offset + 8 <= input.length) {
        const length = input.readUInt32LE(offset + 4);
        const end = offset + 8 + length + (length % 2);
        if (input.toString('ascii', offset, offset + 4) === 'ANMF') {
            const result = Buffer.concat([input.subarray(0, end), input.subarray(offset, end), input.subarray(end)]);
            result.writeUInt32LE(result.length - 8, 4);
            return result;
        }
        offset = end;
    }
    throw new Error('Synthetic WebP fixture has no animation frame');
}

describe('processImage', () => {
    it('converts SVG input to PNG output', async () => {
        const filePath = join(directory, 'logo.svg');
        await writeFile(
            filePath,
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ff00ff" /></svg>',
            'utf8',
        );

        await withProcessed(filePath, async (processed) => {
            expect(processed.extension).toBe('png');
            expect(processed.contentType).toBe('image/png');
            expect(processed.size).toBeGreaterThan(0);
            expect(processed.warnings[0]).toMatch(/Converted SVG to PNG/);
            expect(await sharp(processed.outputPath).metadata()).toMatchObject({ format: 'png', width: 10, height: 10 });
        });
    });

    it('preserves PNG alpha and visible dimensions without changing source bytes', async () => {
        const path = join(directory, 'transparent.png');
        await image().png().toFile(path);
        const originalPixels = await sharp(path).raw().toBuffer();
        await withProcessed(path, async (processed) => {
            expect(processed).toMatchObject({ extension: 'png', contentType: 'image/png', width: 12, height: 8, frameCount: 1, warnings: [] });
            expect(await sharp(processed.outputPath).metadata()).toMatchObject({ hasAlpha: true, space: 'srgb' });
            expect(await sharp(processed.outputPath).raw().toBuffer()).toEqual(originalPixels);
            expect((await readFile(processed.outputPath)).includes(Buffer.from(SOFTWARE_MARKER))).toBe(true);
        });
    });

    it('detects real JPEG bytes despite a misleading PNG filename', async () => {
        const path = join(directory, 'renamed.PNG');
        await image().jpeg().toFile(path);
        await withProcessed(path, async (processed) => {
            expect(processed).toMatchObject({ extension: 'jpg', contentType: 'image/jpeg', width: 12, height: 8, warnings: [] });
            expect(await sharp(processed.outputPath).metadata()).toMatchObject({ format: 'jpeg', chromaSubsampling: '4:4:4', isProgressive: true });
            expect((await readFile(processed.outputPath)).includes(Buffer.from(SOFTWARE_MARKER))).toBe(true);
        });
    });

    it('applies EXIF orientation and removes synthetic EXIF/GPS/XMP metadata', async () => {
        const path = join(directory, 'oriented.jpg');
        await image().jpeg().withMetadata({ orientation: 6 }).withExif({
            IFD0: { Orientation: '6', Artist: 'Synthetic Artist', ImageDescription: 'synthetic-private-marker' },
            IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '1/1 2/1 3/1', GPSLongitudeRef: 'E', GPSLongitude: '4/1 5/1 6/1' },
        }).withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/">synthetic-private-marker</x:xmpmeta>').toFile(path);
        const source = await sharp(path).metadata();
        expect(source.orientation).toBe(6);
        expect(source.exif).toBeInstanceOf(Buffer);
        expect(source.xmp).toBeInstanceOf(Buffer);
        await withProcessed(path, async (processed) => {
            const metadata = await sharp(processed.outputPath).metadata();
            expect(processed).toMatchObject({ width: 8, height: 12 });
            expect(metadata).toMatchObject({ width: 8, height: 12, space: 'srgb' });
            for (const field of ['xmp', 'iptc', 'icc'] as const) expect(metadata[field]).toBeUndefined();
            // Fresh EXIF can include normal orientation after pixels are rotated.
            expect([undefined, 1]).toContain(metadata.orientation);
            const output = await readFile(processed.outputPath);
            expect(output.includes(Buffer.from('synthetic-private-marker'))).toBe(false);
            expect(output.includes(Buffer.from('Synthetic Artist'))).toBe(false);
            expect(output.includes(Buffer.from(SOFTWARE_MARKER))).toBe(true);
        });
    });

    it.each(['webp', 'avif', 'tiff'] as const)('converts static %s to PNG', async (format) => {
        const path = join(directory, `static.${format}`);
        const encoder = image();
        if (format === 'avif') encoder.avif({ effort: 0 });
        else if (format === 'tiff') encoder.tiff({ compression: 'deflate' });
        else encoder.webp({ lossless: true });
        await encoder.toFile(path);
        await withProcessed(path, async (processed) => {
            expect(processed).toMatchObject({ extension: 'png', contentType: 'image/png', width: 12, height: 8, frameCount: 1 });
            expect(processed.warnings.join(' ')).toMatch(/Converted/);
            expect(await sharp(processed.outputPath).metadata()).toMatchObject({ format: 'png', width: 12, height: 8 });
        });
    });

    it.each([0, 3])('retains animated GIF duplicate frames, timings, and loop=%s', async (loop) => {
        const path = join(directory, 'animated.gif');
        await animation().gif({ keepDuplicateFrames: true, delay: [30, 70, 110], loop }).toFile(path);
        const source = await sharp(path, { animated: true }).metadata();
        expect(source).toMatchObject({ pages: 3, pageHeight: 4, delay: [30, 70, 110], loop });
        const pixels = await sharp(path, { animated: true }).removeAlpha().raw().toBuffer();
        await withProcessed(path, async (processed) => {
            expect(processed).toMatchObject({ extension: 'gif', contentType: 'image/gif', frameCount: 3, width: 4, height: 4 });
            expect(await sharp(processed.outputPath, { animated: true }).metadata()).toMatchObject({ pages: 3, pageHeight: 4, delay: [30, 70, 110], loop });
            expect(await sharp(processed.outputPath, { animated: true }).removeAlpha().raw().toBuffer()).toEqual(pixels);
        });
    });

    it.each([0, 3])('converts animated WebP to GIF without flattening duplicate frames, loop=%s', async (loop) => {
        const path = join(directory, 'animated.webp');
        // Distinct red/green/blue source frames prevent encoder coalescing before
        // insertion of a duplicate first frame into the WebP container.
        const pixels = Buffer.alloc(4 * 4 * 3 * 3);
        for (let pixel = 0; pixel < 48; pixel += 1) pixels[pixel * 3 + Math.floor(pixel / 16)] = 255;
        const encoded = await sharp(pixels, { raw: { width: 4, height: 12, channels: 3, pageHeight: 4 } })
            .webp({ lossless: true, delay: [30, 70, 110], loop }).toBuffer();
        await writeFile(path, duplicateFirstWebpFrame(encoded));
        expect(await sharp(path, { animated: true }).metadata()).toMatchObject({ pages: 4, delay: [30, 30, 70, 110], loop });
        const sourcePixels = await sharp(path, { animated: true }).removeAlpha().raw().toBuffer();
        await withProcessed(path, async (processed) => {
            expect(processed).toMatchObject({ extension: 'gif', contentType: 'image/gif', frameCount: 4, width: 4, height: 4 });
            expect(processed.warnings.join(' ')).toMatch(/animated WebP to GIF/);
            expect(await sharp(processed.outputPath, { animated: true }).metadata()).toMatchObject({ pages: 4, pageHeight: 4, delay: [30, 30, 70, 110], loop });
            expect(await sharp(processed.outputPath, { animated: true }).removeAlpha().raw().toBuffer()).toEqual(sourcePixels);
        });
    });

    it('rejects synthetic APNG before libvips can silently flatten it', async () => {
        const png = await image().png().toBuffer();
        let offset = 8;
        while (png.toString('ascii', offset + 4, offset + 8) !== 'IDAT') {
            offset += png.readUInt32BE(offset) + 12;
            if (offset + 8 > png.length) throw new Error('Synthetic PNG has no IDAT');
        }
        const control = Buffer.alloc(20);
        control.writeUInt32BE(8, 0);
        control.write('acTL', 4, 'ascii');
        control.writeUInt32BE(2, 8);
        // Dummy CRC is deliberate: the pre-decoder APNG guard must reject first.
        const path = join(directory, 'animated.png');
        await writeFile(path, Buffer.concat([png.subarray(0, offset), control, png.subarray(offset)]));
        await expect(processImage(path)).rejects.toThrow(/Animated PNG.*not supported/);
    });

    it('rejects a real Sharp-generated multi-page TIFF instead of flattening it', async () => {
        const path = join(directory, 'multipage.tiff');
        await animation().tiff({ compression: 'deflate' }).toFile(path);
        expect(await sharp(path, { animated: true }).metadata()).toMatchObject({ pages: 3 });
        await expect(processImage(path)).rejects.toThrow(/Multi-page TIFF.*not supported/);
    });

    it.each(['not an image', '', '<svg invalid', '\u0089PNG\r\ntruncated'])('rejects corrupt or nonimage content: %j', async (data) => {
        const path = join(directory, 'invalid.png');
        await writeFile(path, data);
        await expect(processImage(path)).rejects.toBeInstanceOf(UnsupportedImageError);
        expect(await readFile(path, 'utf8')).toBe(data);
    });

    it('rejects missing paths and directories with usage errors', async () => {
        await expect(processImage(join(directory, 'missing.png'))).rejects.toBeInstanceOf(UsageError);
        await expect(processImage(directory)).rejects.toThrow(/not a file/);
    });

    it('resolves relative paths, spaces, symlinks and a synthetic home without modifying originals', async () => {
        const path = join(directory, 'image with spaces.png');
        await image().png().toFile(path);
        const alias = join(directory, 'alias.png');
        await symlink(path, alias);
        const resolved = await realpath(path);
        expect(await resolveInputPath(relative(process.cwd(), path))).toBe(resolved);
        expect(await resolveInputPath('~/image with spaces.png')).toBe(resolved);
        expect(await resolveInputPath(alias)).toBe(resolved);
        await withProcessed(alias, (processed) => { expect(processed.inputPath).toBe(resolved); });
    });

    it('enforces a small input byte limit before processing', async () => {
        const path = join(directory, 'bytes.png');
        await image().png().toFile(path);
        const original = await readFile(path);
        await expect(processImage(path, { maxBytes: original.length - 1 })).rejects.toThrow(/file-size limit/);
        expect(await readFile(path)).toEqual(original);
        expect(fixtures.outputs).toEqual([]);
    });

    it('enforces a small pixel limit without allocating a large image', async () => {
        const path = join(directory, 'pixels.png');
        await image().png().toFile(path);
        await expect(processImage(path, { maxPixels: 95 })).rejects.toThrow(/too large|safety limits|pixel/i);
        expect(fixtures.outputs).toEqual([]);
        await withProcessed(path, (processed) => { expect(processed.width * processed.height).toBe(96); }, { maxPixels: 96 });
    });

    it('enforces a small animation frame limit before output allocation', async () => {
        const path = join(directory, 'frames.gif');
        await animation().gif({ keepDuplicateFrames: true, delay: [30, 70, 110] }).toFile(path);
        await expect(processImage(path, { maxFrames: 2 })).rejects.toThrow(/at most 2 frames/);
        expect(fixtures.outputs).toEqual([]);
    });

    it('enforces the cumulative animation pixel budget, not just one frame', async () => {
        const path = join(directory, 'animation-pixels.gif');
        await animation().gif({ keepDuplicateFrames: true, delay: [30, 70, 110] }).toFile(path);
        await expect(processImage(path, { maxPixels: 32 })).rejects.toThrow(/too large|safety limits|pixel/i);
        expect(fixtures.outputs).toEqual([]);
    });

    it('checks expanded output bytes and cleans up when conversion exceeds the upload limit', async () => {
        const path = join(directory, 'compact.webp');
        const pixels = Buffer.alloc(64 * 64 * 3);
        for (let index = 0; index < pixels.length; index += 1) pixels[index] = (index * 73 + (index >> 4) * 19) % 256;
        await sharp(pixels, { raw: { width: 64, height: 64, channels: 3 } }).webp({ quality: 1 }).toFile(path);
        const source = await readFile(path);
        await withProcessed(path, (processed) => { expect(processed.size).toBeGreaterThan(source.length); });
        await expect(processImage(path, { maxBytes: source.length })).rejects.toThrow(/Processed output exceeds the upload limit/);
        expect(await readFile(path)).toEqual(source);
    });

    it('forwards the timeout budget to Sharp rather than relying on wall-clock timing', async () => {
        const path = join(directory, 'timeout.png');
        await image().png().toFile(path);
        const prototype = Object.getPrototypeOf(sharp()) as Sharp;
        const timeout = vi.spyOn(prototype, 'timeout');
        await withProcessed(path, () => { expect(timeout).toHaveBeenCalledWith({ seconds: 1 }); }, { timeoutSeconds: 1 });
    });

    it('cleans its temporary output directory when Sharp fails after allocation', async () => {
        const path = join(directory, 'failed.png');
        await image().png().toFile(path);
        const original = await readFile(path);
        const prototype = Object.getPrototypeOf(sharp()) as Sharp;
        vi.spyOn(prototype, 'toFile').mockRejectedValueOnce(new Error('synthetic processing timeout'));
        await expect(processImage(path, { timeoutSeconds: 1 })).rejects.toBeInstanceOf(UnsupportedImageError);
        expect(fixtures.outputs).toHaveLength(1);
        await expect(stat(fixtures.outputs[0]!)).rejects.toMatchObject({ code: 'ENOENT' });
        expect(await readFile(path)).toEqual(original);
    });

    it.each(['maxBytes', 'maxPixels', 'maxFrames', 'timeoutSeconds'] as const)('rejects invalid %s limits before touching a file', async (field) => {
        for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            await expect(processImage(join(directory, 'does-not-exist'), { [field]: value })).rejects.toThrow(/positive integers/);
        }
    });

    it('supports repeated cleanup without deleting the local source', async () => {
        const path = join(directory, 'cleanup.png');
        await image().png().toFile(path);
        await withProcessed(path, async (processed) => {
            await processed.cleanup();
            await processed.cleanup();
            await expect(stat(processed.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
            expect((await stat(path)).isFile()).toBe(true);
        });
    });
});
