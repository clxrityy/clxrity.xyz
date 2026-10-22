import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UnsupportedImageError, UsageError } from '../src/errors.js';
import { processMedia } from '../src/media.js';
import { DEFAULT_VIDEO_LIMITS } from '../src/media-types.js';
import { processVideo } from '../src/videos.js';

const SOFTWARE_MARKER = 'clxrity-img';
const PRIVATE_MARKERS = [
    'private-title-marker',
    'private-artist-marker',
    'private-comment-marker',
    'private-handler-marker',
    'private-audio-handler-marker',
    'private-location-marker',
    'private-device-marker',
    'private-model-marker',
    'private-date-marker',
    'private-chapter-marker',
];

interface ProbeResult {
    readonly streams?: ReadonlyArray<ProbeStream>;
    readonly format?: {
        readonly duration?: string;
        readonly tags?: Record<string, string>;
    };
    readonly chapters?: ReadonlyArray<unknown>;
}

interface ProbeStream {
    readonly codec_type?: string;
    readonly codec_name?: string;
    readonly pix_fmt?: string;
    readonly width?: number;
    readonly height?: number;
    readonly duration?: string;
    readonly disposition?: Record<string, number>;
    readonly tags?: Record<string, string>;
    readonly side_data_list?: ReadonlyArray<{ readonly side_data_type?: string }>;
}

let directory: string;
let fixtureCounter = 0;

beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'videos-test-'));
});

afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
});

describe('processVideo and processMedia', () => {
    it('normalizes MOV to scrubbed MP4 + poster, preserving limits and faststart', async () => {
        const sourcePath = join(directory, 'source.mov');
        await createFixtureVideo(sourcePath, { fps: 30, seconds: 2, withAudio: true, withChapters: true, withPrivateMetadata: true });

        const sourceProbe = await ffprobe(sourcePath);
        expect((sourceProbe.chapters ?? []).length).toBeGreaterThan(0);
        const sourceBytes = await readFile(sourcePath);
        // Prove the source contains each private field before testing its removal.
        for (const marker of PRIVATE_MARKERS) expect(sourceBytes.includes(Buffer.from(marker)), marker).toBe(true);

        const originalHash = await sha256(sourcePath);
        const processed = await processVideo(sourcePath);

        try {
            expect(processed.kind).toBe('video');
            expect(processed.extension).toBe('mp4');
            expect(processed.contentType).toBe('video/mp4');
            expect(processed.size).toBeGreaterThan(0);
            expect(processed.size).toBeLessThanOrEqual(DEFAULT_VIDEO_LIMITS.maxBytes);
            expect(processed.duration).toBeGreaterThan(0);
            expect(processed.duration).toBeLessThanOrEqual(DEFAULT_VIDEO_LIMITS.maxDurationSeconds);
            expect(processed.poster).toBeDefined();
            expect(await sha256(sourcePath)).toBe(originalHash);

            const outputBytes = await readFile(processed.outputPath);
            for (const marker of PRIVATE_MARKERS) {
                expect(outputBytes.includes(Buffer.from(marker))).toBe(false);
            }
            expect(outputBytes.includes(Buffer.from('clxrity-img'))).toBe(true);

            const outputProbe = await ffprobe(processed.outputPath);
            const video = outputProbe.streams?.find((stream) => stream.codec_type === 'video');
            const audio = outputProbe.streams?.find((stream) => stream.codec_type === 'audio');
            expect(video?.codec_name).toBe('h264');
            expect(video?.pix_fmt).toBe('yuv420p');
            expect(audio?.codec_name).toBe('aac');
            expect((outputProbe.chapters ?? []).length).toBe(0);
            expect(outputProbe.streams?.every((stream) => stream.codec_type === 'video' || stream.codec_type === 'audio')).toBe(true);

            const formatTags = outputProbe.format?.tags ?? {};
            expect(formatTags.software).toBe(SOFTWARE_MARKER);
            // Some muxer versions omit the container encoder despite retaining software.
            expect([undefined, SOFTWARE_MARKER]).toContain(formatTags.encoder);
            for (const forbidden of ['title', 'artist', 'comment', 'creation_time', 'date', 'location', 'make', 'model']) {
                expect(formatTags[forbidden]).toBeUndefined();
            }

            expect((video?.tags?.handler_name ?? '').trim()).toBe('VideoHandler');
            expect((video?.tags?.language ?? '').trim().toLowerCase()).toBe('und');
            expect(['', '[0][0][0][0]']).toContain((video?.tags?.vendor_id ?? '').trim());
            expect((video?.tags?.encoder ?? '').trim()).toBe(SOFTWARE_MARKER);
            expect((audio?.tags?.handler_name ?? '').trim()).toBe('SoundHandler');
            expect((audio?.tags?.language ?? '').trim().toLowerCase()).toBe('und');
            expect(['', '[0][0][0][0]']).toContain((audio?.tags?.vendor_id ?? '').trim());
            // MP4's AAC sample description may not serialize a stream encoder tag.
            expect(['', SOFTWARE_MARKER]).toContain((audio?.tags?.encoder ?? '').trim());

            const moovOffset = outputBytes.indexOf(Buffer.from('moov'));
            const mdatOffset = outputBytes.indexOf(Buffer.from('mdat'));
            expect(moovOffset).toBeGreaterThanOrEqual(0);
            expect(mdatOffset).toBeGreaterThanOrEqual(0);
            expect(moovOffset).toBeLessThan(mdatOffset);

            expect(processed.poster).toBeDefined();
            expect((await stat(processed.poster!.outputPath)).size).toBe(processed.poster!.size);
            const posterMetadata = await sharp(processed.poster!.outputPath).metadata();
            expect(posterMetadata.format).toBe('jpeg');
            expect(processed.poster!.width).toBeLessThanOrEqual(1200);
            expect(processed.poster!.height).toBeGreaterThan(0);
            expect((await readFile(processed.poster!.outputPath)).includes(Buffer.from(SOFTWARE_MARKER))).toBe(true);
        } finally {
            await processed.cleanup();
            await expect(stat(processed.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
        }
    });

    it('dispatches case-insensitive .MP4 via processMedia video pipeline', async () => {
        const sourcePath = join(directory, 'input.MP4');
        await createFixtureVideo(sourcePath, { fps: 24, seconds: 1, withAudio: false });
        const processed = await processMedia(sourcePath);

        try {
            expect(processed.kind).toBe('video');
            expect(processed.extension).toBe('mp4');
            expect(processed.poster).toBeDefined();
        } finally {
            await processed.cleanup();
        }
    });

    it('processes images without requiring ffmpeg/ffprobe on PATH', async () => {
        const imagePath = join(directory, 'plain.png');
        await sharp({ create: { width: 24, height: 16, channels: 4, background: { r: 64, g: 128, b: 255, alpha: 0.8 } } }).png().toFile(imagePath);

        const processed = await withPath('', async () => processMedia(imagePath));
        try {
            expect(processed.kind).toBe('image');
            expect(processed.extension).toBe('png');
            expect(processed.poster).toBeUndefined();
        } finally {
            await processed.cleanup();
        }
    });

    it('rejects source videos above 120 fps', async () => {
        const fastPath = join(directory, 'fast.mp4');
        await createFixtureVideo(fastPath, { fps: 121, seconds: 1, withAudio: false, withPrivateMetadata: false });
        await expect(processVideo(fastPath)).rejects.toThrow(/frame rate exceeds the safety limit/i);
    });

    it('rejects videos when the longest source stream duration exceeds limits', async () => {
        const inputPath = join(directory, 'over-duration.mp4');
        await writeFile(inputPath, 'synthetic bytes');

        const binDir = await mkdtemp(join(directory, 'bin-over-duration-'));
        await writeExecutable(join(binDir, 'ffprobe'), `#!/bin/sh
printf '%s' '{"format":{"format_name":"mov,mp4,m4a,3gp,3g2,mj2","duration":"5"},"streams":[{"codec_type":"video","codec_name":"h264","width":640,"height":360,"avg_frame_rate":"30/1","color_transfer":"bt709","duration":"5","disposition":{"attached_pic":0}},{"codec_type":"audio","codec_name":"aac","duration":"700"}]}'
exit 0
`);

        await withPath(binDir, async () => {
            await expect(processVideo(inputPath)).rejects.toThrow(/duration exceeds the limit/i);
        });
    });

    it('falls back to r_frame_rate when average frame rate is 0/0', async () => {
        const inputPath = join(directory, 'fallback.mp4');
        await writeFile(inputPath, 'synthetic bytes');
        const binDir = await mkdtemp(join(directory, 'bin-fallback-'));
        await writeExecutable(join(binDir, 'ffprobe'), `#!/bin/sh
printf '%s' '{"format":{"format_name":"mov,mp4","duration":"1"},"streams":[{"codec_type":"video","width":640,"height":360,"avg_frame_rate":"0/0","r_frame_rate":"121/1","duration":"1"}]}'
`);
        await withPath(binDir, async () => {
            await expect(processVideo(inputPath)).rejects.toThrow(/frame rate exceeds the safety limit/i);
        });
    });

    it('rejects input files above configured maxBytes before probing', async () => {
        const inputPath = join(directory, 'too-large-input.mp4');
        await writeFile(inputPath, Buffer.alloc(64, 1));

        await expect(processVideo(inputPath, { maxBytes: 32 })).rejects.toThrow(/Input exceeds the file-size limit/i);
    });

    it('rejects oversized normalized outputs above configured maxBytes', async () => {
        const inputPath = join(directory, 'oversized-output.mp4');
        await writeFile(inputPath, 'synthetic bytes');

        const binDir = await mkdtemp(join(directory, 'bin-oversized-output-'));
        await writeExecutable(join(binDir, 'ffprobe'), `#!/bin/sh
printf '%s' '{"format":{"format_name":"mov,mp4,m4a,3gp,3g2,mj2","duration":"2"},"streams":[{"codec_type":"video","codec_name":"h264","width":640,"height":360,"avg_frame_rate":"30/1","color_transfer":"bt709","duration":"2","disposition":{"attached_pic":0}}]}'
exit 0
`);
        await writeExecutable(join(binDir, 'ffmpeg'), `#!/bin/sh
for last; do :; done
out="$last"
i=0
: > "$out"
while [ "$i" -lt 3000 ]; do
  printf '0123456789' >> "$out"
  i=$((i + 1))
done
exit 0
`);

        await withPath(binDir, async () => {
            await expect(processVideo(inputPath, { maxBytes: 20_000, timeoutSeconds: 5 })).rejects.toThrow(/Processed output exceeds the upload limit/i);
        });
    });

    it('fails cleanly when ffprobe emits malformed JSON', async () => {
        const inputPath = join(directory, 'input.mp4');
        await writeFile(inputPath, 'not really a video');

        const binDir = await mkdtemp(join(directory, 'bin-malformed-'));
        await writeExecutable(join(binDir, 'ffprobe'), '#!/bin/sh\nprintf "{ invalid json"\nexit 0\n');

        await withPath(binDir, async () => {
            await expect(processVideo(inputPath)).rejects.toBeInstanceOf(UnsupportedImageError);
        });
    });

    it('times out and fails cleanly when ffprobe stalls', async () => {
        const inputPath = join(directory, 'input.mp4');
        await writeFile(inputPath, 'not really a video');

        const binDir = await mkdtemp(join(directory, 'bin-timeout-'));
        await writeExecutable(join(binDir, 'ffprobe'), '#!/bin/sh\n/bin/sleep 3\nexit 0\n');

        await withPath(binDir, async () => {
            const result = processVideo(inputPath, { timeoutSeconds: 1 });
            await expect(result).rejects.toBeInstanceOf(UsageError);
            await expect(result).rejects.toThrow(/timeout/i);
        });
    });

    it('reports missing ffprobe executable with actionable guidance', async () => {
        const inputPath = join(directory, 'missing-tools.mp4');
        await writeFile(inputPath, 'synthetic bytes');

        await withPath('', async () => {
            await expect(processVideo(inputPath)).rejects.toBeInstanceOf(UsageError);
            await expect(processVideo(inputPath)).rejects.toThrow(/Missing required executable: ffprobe/i);
        });
    });

    it('rejects corrupt disguised .mp4 content', async () => {
        const inputPath = join(directory, 'corrupt.mp4');
        await writeFile(inputPath, Buffer.from('this is definitely not a valid MP4 container'));

        await expect(processVideo(inputPath)).rejects.toBeInstanceOf(UnsupportedImageError);
    });

    it('applies source rotation from remux metadata during normalization', async () => {
        const sourcePath = join(directory, 'rotated-source.mp4');
        await createRotatedRemuxFixture(sourcePath, { fps: 24, seconds: 2, withAudio: false });

        const sourceProbe = await ffprobe(sourcePath);
        const sourceVideo = sourceProbe.streams?.find((stream) => stream.codec_type === 'video');
        expect(sourceVideo).toMatchObject({ width: 640, height: 360 });
        expect(hasRotationMetadata(sourceVideo)).toBe(true);

        const processed = await processVideo(sourcePath);
        try {
            expect(processed).toMatchObject({ width: 360, height: 640 });
            const outputProbe = await ffprobe(processed.outputPath);
            const outputVideo = outputProbe.streams?.find((stream) => stream.codec_type === 'video');
            expect(outputVideo).toMatchObject({ width: 360, height: 640 });
            expect(hasRotationMetadata(outputVideo)).toBe(false);
        } finally {
            await processed.cleanup();
        }
    });

    it('preserves silent video behavior without synthesizing audio', async () => {
        const sourcePath = join(directory, 'silent-source.mp4');
        await createFixtureVideo(sourcePath, { fps: 24, seconds: 2, withAudio: false, withPrivateMetadata: false });

        const processed = await processVideo(sourcePath);
        try {
            const outputProbe = await ffprobe(processed.outputPath);
            const audio = outputProbe.streams?.find((stream) => stream.codec_type === 'audio');
            expect(audio).toBeUndefined();
        } finally {
            await processed.cleanup();
        }
    });

    it('fails cleanly when ffprobe output exceeds diagnostic limits', async () => {
        const inputPath = join(directory, 'output-overflow.mp4');
        await writeFile(inputPath, 'not really a video');

        const binDir = await mkdtemp(join(directory, 'bin-overflow-'));
        await writeExecutable(join(binDir, 'ffprobe'), `#!/bin/sh
i=0
while [ "$i" -lt 300000 ]; do
  printf 'x'
  i=$((i + 1))
done
exit 0
`);

        await withPath(binDir, async () => {
            await expect(processVideo(inputPath, { timeoutSeconds: 5 })).rejects.toThrow(/too much diagnostic output/i);
        });
    });

    it('strips FFREPORT from child-process environment', async () => {
        const inputPath = join(directory, 'ffreport-input.mp4');
        await writeFile(inputPath, 'synthetic bytes');

        const leakPath = join(directory, 'ffreport-leak.txt');
        const binDir = await mkdtemp(join(directory, 'bin-ffreport-'));
        await writeExecutable(join(binDir, 'ffprobe'), `#!/bin/sh
if [ -n "$FFREPORT" ]; then
  : > "$REPORT_LEAK_FILE"
fi
printf '%s' '{"format":{"format_name":"mov,mp4,m4a,3gp,3g2,mj2","duration":"1"},"streams":[]}'
exit 0
        `);

        const previousFfreport = process.env.FFREPORT;
        const previousLeakFile = process.env.REPORT_LEAK_FILE;
        process.env.FFREPORT = 'file=should-not-leak.log:level=32';
        process.env.REPORT_LEAK_FILE = leakPath;
        try {
            await withPath(binDir, async () => {
                await expect(processVideo(inputPath)).rejects.toBeInstanceOf(UnsupportedImageError);
            });
        } finally {
            restoreEnvironmentVariable('FFREPORT', previousFfreport);
            restoreEnvironmentVariable('REPORT_LEAK_FILE', previousLeakFile);
        }

        await expect(stat(leakPath)).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('restores PATH by deleting it if PATH was originally absent', async () => {
        const hadPath = Object.prototype.hasOwnProperty.call(process.env, 'PATH');
        const previousPath = process.env.PATH;

        delete process.env.PATH;
        try {
            await withPath('/tmp', async () => {
                expect(process.env.PATH).toBe('/tmp');
            });

            expect(Object.prototype.hasOwnProperty.call(process.env, 'PATH')).toBe(false);
        } finally {
            if (hadPath) {
                process.env.PATH = previousPath;
            } else {
                delete process.env.PATH;
            }
        }
    });
});

async function createFixtureVideo(path: string, options: {
    fps: number;
    seconds: number;
    withAudio: boolean;
    withPrivateMetadata?: boolean;
    withChapters?: boolean;
}): Promise<void> {
    const withPrivateMetadata = options.withPrivateMetadata ?? true;
    const withChapters = options.withChapters ?? false;
    const encodedPath = withChapters ? join(directory, `encoded-${nextFixtureId()}.mp4`) : path;

    const args = [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-f', 'lavfi',
        '-i', `testsrc=size=640x360:rate=${options.fps}`,
    ];

    if (options.withAudio) {
        args.push('-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000');
    }

    args.push(
        '-t', String(options.seconds),
        '-map', '0:v:0',
        ...(options.withAudio ? ['-map', '1:a:0'] : ['-an']),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        ...(options.withAudio ? ['-c:a', 'aac', '-b:a', '96k'] : []),
        '-movflags', '+faststart+use_metadata_tags',
    );

    if (withPrivateMetadata) {
        args.push(
            '-metadata', 'title=private-title-marker',
            '-metadata', 'artist=private-artist-marker',
            '-metadata', 'comment=private-comment-marker',
            '-metadata', 'location=private-location-marker',
            '-metadata', 'make=private-device-marker',
            '-metadata', 'model=private-model-marker',
            '-metadata', 'date=private-date-marker',
            '-metadata', 'creation_time=2020-01-02T03:04:05Z',
            '-metadata:s:v:0', 'handler_name=private-handler-marker',
        );
        if (options.withAudio) {
            args.push('-metadata:s:a:0', 'handler_name=private-audio-handler-marker');
        }
    }

    args.push(encodedPath);
    await runExternal('ffmpeg', args, 60_000);

    if (!withChapters) {
        return;
    }

    const metadataPath = join(directory, `chapters-${nextFixtureId()}.ffmetadata`);
    const chapterDurationMs = Math.max(1_000, Math.round(options.seconds * 1_000));
    await writeFile(metadataPath, [
        ';FFMETADATA1',
        'title=private-title-marker',
        '[CHAPTER]',
        'TIMEBASE=1/1000',
        'START=0',
        `END=${chapterDurationMs}`,
        'title=private-chapter-marker',
        '',
    ].join('\n'), 'utf8');

    await runExternal('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-i', encodedPath,
        '-i', metadataPath,
        '-map', '0',
        '-map_metadata', '0',
        '-map_chapters', '1',
        '-c', 'copy',
        '-movflags', '+faststart+use_metadata_tags',
        path,
    ], 60_000);

    await rm(encodedPath, { force: true });
    await rm(metadataPath, { force: true });
}

async function createRotatedRemuxFixture(path: string, options: { fps: number; seconds: number; withAudio: boolean }): Promise<void> {
    const basePath = join(directory, `rot - base - ${nextFixtureId()}.mp4`);
    await createFixtureVideo(basePath, {
        fps: options.fps,
        seconds: options.seconds,
        withAudio: options.withAudio,
        withPrivateMetadata: false,
    });

    // Modern FFmpeg uses input display transforms; older releases use rotate tags.
    const help = await runExternal('ffmpeg', ['-hide_banner', '-h', 'full'], 20_000);
    const supportsDisplayRotation = `${help.stdout}\n${help.stderr}`.includes('-display_rotation');
    await runExternal('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        ...(supportsDisplayRotation ? ['-display_rotation:v:0', '90'] : []),
        '-i', basePath,
        '-map', '0',
        '-c', 'copy',
        ...(!supportsDisplayRotation ? ['-metadata:s:v:0', 'rotate=90'] : []),
        path,
    ], 60_000);

    await rm(basePath, { force: true });
}

async function ffprobe(path: string): Promise<ProbeResult> {
    const { stdout } = await runExternal('ffprobe', [
        '-v', 'error',
        '-show_format',
        '-show_streams',
        '-show_chapters',
        '-of', 'json',
        path,
    ], 20_000);
    return JSON.parse(stdout) as ProbeResult;
}

async function runExternal(command: string, args: readonly string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
    const child = spawn(command, [...args], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timeoutHandle: NodeJS.Timeout | undefined;

    const completion = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ code, signal }));
    });

    child.stdout.on('data', (chunk) => {
        stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
        stderr += chunk.toString('utf8');
    });

    timeoutHandle = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    timeoutHandle.unref();

    try {
        const result = await completion;
        if (result.code !== 0) {
            throw new Error(`${command} exited with code ${String(result.code)}: ${stderr || stdout} `);
        }

        return { stdout, stderr };
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
}

async function withPath<T>(pathValue: string, action: () => Promise<T>): Promise<T> {
    const hadPath = Object.prototype.hasOwnProperty.call(process.env, 'PATH');
    const previousPath = process.env.PATH;
    process.env.PATH = pathValue;
    try {
        return await action();
    } finally {
        if (hadPath) {
            process.env.PATH = previousPath;
        } else {
            delete process.env.PATH;
        }
    }
}

async function writeExecutable(path: string, source: string): Promise<void> {
    await writeFile(path, source, 'utf8');
    await chmod(path, 0o755);
}

async function sha256(path: string): Promise<string> {
    const data = await readFile(path);
    return createHash('sha256').update(data).digest('hex');
}

function hasRotationMetadata(stream: ProbeStream | undefined): boolean {
    if (!stream) {
        return false;
    }

    const rotateTag = (stream.tags?.rotate ?? '').trim();
    if (rotateTag !== '' && Number(rotateTag) !== 0) {
        return true;
    }

    return (stream.side_data_list ?? []).some((sideData) =>
        (sideData.side_data_type ?? '').toLowerCase().includes('display matrix'));
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
    if (value === undefined) {
        delete process.env[name];
        return;
    }

    process.env[name] = value;
}

function nextFixtureId(): number {
    fixtureCounter += 1;
    return fixtureCounter;
}