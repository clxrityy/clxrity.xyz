import { spawn } from 'node:child_process';
import { chmod, mkdtemp, realpath, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

import sharp from 'sharp';

import { CliError, UnsupportedImageError, UsageError } from './errors.js';
import { DEFAULT_VIDEO_LIMITS, MEDIA_MIME_TYPES, type ProcessedMedia, type VideoLimits } from './media-types.js';

const SOFTWARE_MARKER = 'clxrity-img';
const GENERIC_VIDEO_HANDLER = 'VideoHandler';
const GENERIC_AUDIO_HANDLER = 'SoundHandler';
const GENERIC_LANGUAGE = 'und';
const GENERIC_VENDOR_ID = '[0][0][0][0]';
const MAX_PIXELS_PER_FRAME = 33_177_600;
const MAX_FRAME_RATE = 120;
const MAX_TOOL_OUTPUT_BYTES = 256 * 1024;
const MAX_TIMEOUT_SECONDS = 2_147_483;
const MAX_TIMEOUT_MS = 2_147_483_647;
const PROCESS_FORCE_KILL_GRACE_MS = 2_000;
const DURATION_LIMIT_TOLERANCE_SECONDS = 0.05;
const DURATION_MATCH_TOLERANCE_SECONDS = 0.50;
const AAC_PADDING_TOLERANCE_SECONDS = 0.05;

const HDR_COLOR_TRANSFERS = new Set(['smpte2084', 'arib-std-b67', 'bt2020-10', 'bt2020-12']);
const ALLOWED_COLOR_TRANSFERS = new Set(['', 'unknown', 'bt709', 'iec61966-2-1', 'bt470bg', 'smpte170m', 'gamma22', 'gamma28', 'linear']);
const HDR_OR_DOLBY_SIDE_DATA_TOKENS = [
    'dolby vision',
    'dynamic hdr',
    'mastering display metadata',
    'content light level',
    'dovi',
    'hdr',
];

interface FfprobeResult {
    readonly streams?: ReadonlyArray<FfprobeStream>;
    readonly format?: FfprobeFormat;
    readonly chapters?: ReadonlyArray<unknown>;
}

interface FfprobeFormat {
    readonly format_name?: string;
    readonly duration?: string;
    readonly tags?: Record<string, string>;
}

interface FfprobeStream {
    readonly codec_type?: string;
    readonly codec_name?: string;
    readonly width?: number;
    readonly height?: number;
    readonly avg_frame_rate?: string;
    readonly r_frame_rate?: string;
    readonly duration?: string;
    readonly pix_fmt?: string;
    readonly color_transfer?: string;
    readonly disposition?: Record<string, number>;
    readonly tags?: Record<string, string>;
    readonly side_data_list?: ReadonlyArray<{ readonly side_data_type?: string }>;
}

interface SourceVideoProfile {
    readonly width: number;
    readonly height: number;
    readonly duration: number;
    readonly videoDuration: number;
    readonly audioDuration?: number | undefined;
    readonly hasAudio: boolean;
}

interface NormalizedVideoProfile {
    readonly width: number;
    readonly height: number;
    readonly duration: number;
}

interface Deadline {
    readonly expiresAtMs: number;
    readonly timeoutSeconds: number;
}

export async function processVideo(input: string, overrides: Partial<VideoLimits> = {}): Promise<ProcessedMedia> {
    const limits = resolveVideoLimits(overrides);
    const deadline = createDeadline(limits.timeoutSeconds);
    const inputPath = await resolveInputPath(input);
    const extension = extname(inputPath).toLowerCase();
    if (extension !== '.mov' && extension !== '.mp4') {
        throw new UsageError('Video uploads currently support only local MOV or MP4 files.');
    }

    const inputStat = await stat(inputPath);
    if (!inputStat.isFile()) {
        throw new UsageError(`Input path is not a file: ${input}`);
    }

    if (inputStat.size > limits.maxBytes) {
        throw new UsageError(`Input exceeds the file-size limit (${limits.maxBytes} bytes; default 100 MiB).`);
    }

    let temporaryDirectory: string | undefined;
    try {
        const directory = await mkdtemp(join(tmpdir(), 'clxrity-video-'));
        temporaryDirectory = directory;
        if (process.platform !== 'win32') {
            await chmod(directory, 0o700);
        }

        const outputPath = join(directory, 'video.mp4');
        const sourceProbe = await probeMedia(inputPath, deadline);
        const sourceProfile = validateSourceProbe(sourceProbe, limits);

        await transcodeVideo(inputPath, outputPath, {
            hasAudio: sourceProfile.hasAudio,
            maxBytes: limits.maxBytes,
        }, deadline);
        if (process.platform !== 'win32') {
            await chmod(outputPath, 0o600);
        }

        const outputStat = await stat(outputPath);
        if (outputStat.size > limits.maxBytes) {
            throw new UsageError(`Processed output exceeds the upload limit (${limits.maxBytes} bytes; default 100 MiB).`);
        }

        const normalizedProbe = await probeMedia(outputPath, deadline);
        const normalizedProfile = validateNormalizedProbe(normalizedProbe, {
            expectAudio: sourceProfile.hasAudio,
            maxDurationSeconds: limits.maxDurationSeconds,
            sourceDurationSeconds: sourceProfile.duration,
            sourceVideoDurationSeconds: sourceProfile.videoDuration,
            sourceAudioDurationSeconds: sourceProfile.audioDuration,
        });

        await verifyNormalizedDecodability(outputPath, sourceProfile.hasAudio, deadline);

        const poster = await generatePoster(outputPath, directory, normalizedProfile.duration, deadline);

        return {
            kind: 'video',
            inputPath,
            outputPath,
            extension: 'mp4',
            contentType: MEDIA_MIME_TYPES.mp4,
            size: outputStat.size,
            width: normalizedProfile.width,
            height: normalizedProfile.height,
            warnings: [],
            cleanup: () => rm(directory, { recursive: true, force: true }),
            duration: normalizedProfile.duration,
            poster,
        };
    } catch (error) {
        if (temporaryDirectory) {
            await rm(temporaryDirectory, { recursive: true, force: true });
        }

        if (error instanceof CliError) {
            throw error;
        }

        throw new UnsupportedImageError('Could not decode or process this video. Ensure it is a local MOV/MP4 file with supported codecs.');
    }
}

function resolveVideoLimits(overrides: Partial<VideoLimits>): VideoLimits {
    const limits: VideoLimits = { ...DEFAULT_VIDEO_LIMITS, ...overrides };
    const values = [limits.maxBytes, limits.maxDurationSeconds, limits.timeoutSeconds];
    if (values.some((value) => typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)) {
        throw new UsageError('Video safety limits must be positive integers.');
    }

    if (limits.timeoutSeconds > MAX_TIMEOUT_SECONDS) {
        throw new UsageError(`Video timeout must be <= ${MAX_TIMEOUT_SECONDS} seconds.`);
    }

    return limits;
}

async function resolveInputPath(inputValue: string): Promise<string> {
    const expanded = expandHomeDirectory(inputValue);
    const absolute = resolve(process.cwd(), expanded);
    try {
        return await realpath(absolute);
    } catch {
        throw new UsageError(`Cannot read the input media: ${inputValue}`);
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

async function probeMedia(path: string, deadline: Deadline): Promise<FfprobeResult> {
    const result = await runProcess('ffprobe', [
        '-v', 'error',
        '-hide_banner',
        '-show_format',
        '-show_streams',
        '-show_chapters',
        '-of', 'json',
        '-protocol_whitelist', 'file,pipe',
        '-f', 'mov',
        '-enable_drefs', '0',
        '-use_absolute_path', '0',
        path,
    ], deadline, 'probing video metadata');

    try {
        const parsed = JSON.parse(result.stdout) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('invalid structure');
        }

        return parsed as FfprobeResult;
    } catch {
        throw new UnsupportedImageError('Could not inspect video streams with ffprobe.');
    }
}

function validateSourceProbe(probe: FfprobeResult, limits: VideoLimits): SourceVideoProfile {
    const formatNames = new Set((probe.format?.format_name ?? '').toLowerCase().split(',').map((value) => value.trim()).filter(Boolean));
    if (!formatNames.has('mov') && !formatNames.has('mp4')) {
        throw new UnsupportedImageError('Unsupported video container. Use MOV or MP4 input.');
    }

    const streams = probe.streams ?? [];
    const video = selectPrimaryVideoStream(streams);
    if (!video) {
        throw new UnsupportedImageError('No decodable video stream was found in the input file.');
    }

    const width = readPositiveInteger(video.width, 'video width');
    const height = readPositiveInteger(video.height, 'video height');
    if (width * height > MAX_PIXELS_PER_FRAME) {
        throw new UsageError(`Video frame dimensions exceed the safety limit (${MAX_PIXELS_PER_FRAME.toLocaleString()} pixels/frame).`);
    }

    const frameRate = readUsableFrameRate(video);
    if (!frameRate || frameRate <= 0) {
        throw new UnsupportedImageError('Could not determine the source video frame rate.');
    }

    if (frameRate > MAX_FRAME_RATE) {
        throw new UsageError(`Video frame rate exceeds the safety limit (${MAX_FRAME_RATE} fps).`);
    }

    const colorTransfer = (video.color_transfer ?? '').toLowerCase();
    if (HDR_COLOR_TRANSFERS.has(colorTransfer)) {
        throw new UsageError(`HDR video transfer characteristics are not supported (${colorTransfer}).`);
    }

    if (!ALLOWED_COLOR_TRANSFERS.has(colorTransfer)) {
        throw new UsageError(`Unsupported color transfer characteristic: ${colorTransfer || 'unknown'}.`);
    }

    const hdrSideData = findHdrOrDolbyVisionSideData(video);
    if (hdrSideData) {
        throw new UsageError(`Unsupported HDR/Dolby Vision side-data in source stream: ${hdrSideData}.`);
    }

    const videoDurations = streams
        .filter((stream) => stream.codec_type === 'video' && stream.disposition?.attached_pic !== 1)
        .map((stream) => readDurationSeconds(stream.duration))
        .filter(isDefinedNumber);
    const audioDurations = streams
        .filter((stream) => stream.codec_type === 'audio')
        .map((stream) => readDurationSeconds(stream.duration))
        .filter(isDefinedNumber);

    const duration = maxDefinedNumber([
        readDurationSeconds(probe.format?.duration),
        ...videoDurations,
        ...audioDurations,
    ]);
    if (!duration || duration <= 0) {
        throw new UnsupportedImageError('Could not determine the source video duration.');
    }

    if (duration > limits.maxDurationSeconds + DURATION_LIMIT_TOLERANCE_SECONDS) {
        throw new UsageError(`Video duration exceeds the limit (${limits.maxDurationSeconds} seconds; default 600s).`);
    }

    const hasAudio = streams.some((stream) => stream.codec_type === 'audio');
    return {
        width,
        height,
        duration,
        videoDuration: maxDefinedNumber(videoDurations) ?? duration,
        audioDuration: maxDefinedNumber(audioDurations),
        hasAudio,
    };
}

function validateNormalizedProbe(
    probe: FfprobeResult,
    constraints: {
        expectAudio: boolean;
        maxDurationSeconds: number;
        sourceDurationSeconds: number;
        sourceVideoDurationSeconds: number;
        sourceAudioDurationSeconds?: number | undefined;
    },
): NormalizedVideoProfile {
    const formatNames = new Set((probe.format?.format_name ?? '').toLowerCase().split(',').map((value) => value.trim()).filter(Boolean));
    if (!formatNames.has('mp4') && !formatNames.has('mov')) {
        throw new UsageError('Normalized output must be an MP4-compatible container.');
    }

    if (Array.isArray(probe.chapters) && probe.chapters.length > 0) {
        throw new UsageError('Normalized output still contains chapters.');
    }

    const streams = probe.streams ?? [];
    const videoStreams = streams.filter((stream) => stream.codec_type === 'video' && stream.disposition?.attached_pic !== 1);
    if (videoStreams.length !== 1) {
        throw new UsageError('Normalized output must contain exactly one real video stream.');
    }

    const video = videoStreams[0]!;
    if ((video.codec_name ?? '').toLowerCase() !== 'h264') {
        throw new UsageError('Normalized output must use H.264 video.');
    }

    if ((video.pix_fmt ?? '').toLowerCase() !== 'yuv420p') {
        throw new UsageError('Normalized output must use yuv420p pixel format.');
    }

    const width = readPositiveInteger(video.width, 'normalized video width');
    const height = readPositiveInteger(video.height, 'normalized video height');
    if (width * height > MAX_PIXELS_PER_FRAME) {
        throw new UsageError(`Normalized frame dimensions exceed the safety limit (${MAX_PIXELS_PER_FRAME.toLocaleString()} pixels/frame).`);
    }

    const frameRate = readUsableFrameRate(video);
    if (!frameRate || frameRate <= 0 || frameRate > MAX_FRAME_RATE) {
        throw new UsageError(`Normalized output has an invalid frame rate (${video.avg_frame_rate ?? video.r_frame_rate ?? 'unknown'}).`);
    }

    const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
    const extraStreams = streams.filter((stream) => {
        const type = stream.codec_type ?? '';
        return type !== 'video' && type !== 'audio';
    });
    if (extraStreams.length > 0) {
        throw new UsageError('Normalized output still contains non-audio/video streams.');
    }

    if (audioStreams.length > 1) {
        throw new UsageError('Normalized output must contain at most one audio stream.');
    }

    if (constraints.expectAudio && audioStreams.length === 0) {
        throw new UsageError('Normalized output dropped the source audio stream.');
    }

    if (audioStreams[0] && (audioStreams[0].codec_name ?? '').toLowerCase() !== 'aac') {
        throw new UsageError('Normalized output must use AAC audio when audio is present.');
    }

    validateTagAllowlist(probe.format?.tags ?? {}, new Set(['software', 'encoder', 'major_brand', 'minor_version', 'compatible_brands']), 'container');
    validateNormalizedStreamTags(video.tags ?? {}, 'video', GENERIC_VIDEO_HANDLER);
    const audio = audioStreams[0];
    if (audio) {
        validateNormalizedStreamTags(audio.tags ?? {}, 'audio', GENERIC_AUDIO_HANDLER);
    }

    const software = (probe.format?.tags?.software ?? '').trim();
    const encoder = (probe.format?.tags?.encoder ?? '').trim();
    if (software !== SOFTWARE_MARKER) {
        throw new UsageError('Normalized output is missing the required generic software marker.');
    }

    if (encoder !== '' && encoder !== SOFTWARE_MARKER) {
        throw new UsageError('Normalized output encoder metadata must be the generic software marker.');
    }

    const duration = maxDefinedNumber([
        readDurationSeconds(probe.format?.duration),
        readDurationSeconds(video.duration),
        readDurationSeconds(audio?.duration),
    ]);
    if (!duration || duration <= 0) {
        throw new UsageError('Normalized output does not include a valid duration.');
    }

    if (duration > constraints.maxDurationSeconds + DURATION_LIMIT_TOLERANCE_SECONDS) {
        throw new UsageError(`Normalized output duration exceeds the limit (${constraints.maxDurationSeconds} seconds).`);
    }

    if (duration + DURATION_MATCH_TOLERANCE_SECONDS < constraints.sourceDurationSeconds) {
        throw new UsageError('Normalized output appears truncated relative to the source duration.');
    }

    if (duration > constraints.sourceDurationSeconds + AAC_PADDING_TOLERANCE_SECONDS) {
        throw new UsageError('Normalized output duration drift exceeds the allowed audio padding tolerance.');
    }

    const normalizedVideoDuration = readDurationSeconds(video.duration);
    if (normalizedVideoDuration && normalizedVideoDuration + DURATION_MATCH_TOLERANCE_SECONDS < constraints.sourceVideoDurationSeconds) {
        throw new UsageError('Normalized output video stream appears truncated.');
    }

    if (constraints.expectAudio && constraints.sourceAudioDurationSeconds !== undefined) {
        const normalizedAudioDuration = readDurationSeconds(audio?.duration);
        if (!normalizedAudioDuration || normalizedAudioDuration + DURATION_MATCH_TOLERANCE_SECONDS < constraints.sourceAudioDurationSeconds) {
            throw new UsageError('Normalized output audio stream appears truncated.');
        }
    }

    for (const stream of streams) {
        if ((stream.disposition?.attached_pic ?? 0) === 1) {
            throw new UsageError('Normalized output must not include attached picture streams.');
        }

        for (const sideData of stream.side_data_list ?? []) {
            const type = (sideData.side_data_type ?? '').toLowerCase();
            if (type.includes('display matrix')) {
                throw new UsageError('Normalized output still contains identifying or unsupported stream side-data.');
            }

            if (HDR_OR_DOLBY_SIDE_DATA_TOKENS.some((token) => type.includes(token))) {
                throw new UsageError('Normalized output still contains HDR/Dolby Vision side-data.');
            }
        }
    }

    return { width, height, duration };
}

function validateNormalizedStreamTags(tags: Record<string, string>, scope: 'video' | 'audio', expectedHandlerName: string): void {
    validateTagAllowlist(tags, new Set(['language', 'handler_name', 'vendor_id', 'encoder']), `${scope} stream`);

    const handlerName = (tags.handler_name ?? '').trim();
    if (handlerName !== expectedHandlerName) {
        throw new UsageError(`Normalized ${scope} stream must use generic handler_name=${expectedHandlerName}.`);
    }

    const language = (tags.language ?? '').trim().toLowerCase();
    if (language !== GENERIC_LANGUAGE) {
        throw new UsageError(`Normalized ${scope} stream must use language=${GENERIC_LANGUAGE}.`);
    }

    const vendor = (tags.vendor_id ?? '').trim();
    if (vendor !== '' && vendor !== GENERIC_VENDOR_ID) {
        throw new UsageError(`Normalized ${scope} stream must use a generic vendor_id.`);
    }

    const encoder = (tags.encoder ?? '').trim();
    if (encoder !== '' && encoder !== SOFTWARE_MARKER) {
        throw new UsageError(`Normalized ${scope} stream encoder metadata must be generic.`);
    }
}

function validateTagAllowlist(tags: Record<string, string>, allowedKeys: ReadonlySet<string>, scope: string): void {
    const forbiddenKeys = new Set([
        'title',
        'artist',
        'album',
        'comment',
        'description',
        'synopsis',
        'creation_time',
        'date',
        'location',
        'location-eng',
        'location-iso6709',
        'make',
        'model',
        'com.apple.quicktime.creationdate',
        'com.apple.quicktime.make',
        'com.apple.quicktime.model',
        'com.apple.quicktime.software',
    ]);

    for (const [rawKey, rawValue] of Object.entries(tags)) {
        const key = rawKey.toLowerCase();
        if (forbiddenKeys.has(key)) {
            throw new UsageError(`Normalized ${scope} contains forbidden metadata tag "${rawKey}".`);
        }

        if (!allowedKeys.has(key)) {
            throw new UsageError(`Normalized ${scope} contains unexpected metadata tag "${rawKey}".`);
        }

        if (key === 'software' || key === 'encoder') {
            if (rawValue.trim() !== '' && rawValue.trim() !== SOFTWARE_MARKER) {
                throw new UsageError(`Normalized ${scope} metadata tag "${rawKey}" must be the generic marker.`);
            }
        }
    }
}

function selectPrimaryVideoStream(streams: ReadonlyArray<FfprobeStream>): FfprobeStream | undefined {
    return streams.find((stream) => stream.codec_type === 'video' && stream.disposition?.attached_pic !== 1);
}

function readPositiveInteger(value: number | undefined, label: string): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
        throw new UnsupportedImageError(`Could not determine a valid ${label}.`);
    }

    return value;
}

function readDurationSeconds(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }

    return parsed;
}

function readFrameRate(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }

    const [numeratorString, denominatorString] = value.split('/');
    if (!numeratorString || !denominatorString) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    const numerator = Number(numeratorString);
    const denominator = Number(denominatorString);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
        return undefined;
    }

    return numerator / denominator;
}

function readUsableFrameRate(stream: FfprobeStream): number | undefined {
    // ffprobe often reports avg_frame_rate="0/0" on otherwise valid inputs.
    const average = readFrameRate(stream.avg_frame_rate);
    return average !== undefined && average > 0 ? average : readFrameRate(stream.r_frame_rate);
}

function findHdrOrDolbyVisionSideData(stream: FfprobeStream): string | undefined {
    for (const sideData of stream.side_data_list ?? []) {
        const type = (sideData.side_data_type ?? '').toLowerCase();
        if (HDR_OR_DOLBY_SIDE_DATA_TOKENS.some((token) => type.includes(token))) {
            return sideData.side_data_type ?? type;
        }
    }

    return undefined;
}

function isDefinedNumber(value: number | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function maxDefinedNumber(values: ReadonlyArray<number | undefined>): number | undefined {
    let result: number | undefined;
    for (const value of values) {
        if (!isDefinedNumber(value)) {
            continue;
        }

        result = result === undefined ? value : Math.max(result, value);
    }

    return result;
}

async function transcodeVideo(
    inputPath: string,
    outputPath: string,
    options: { hasAudio: boolean; maxBytes: number },
    deadline: Deadline,
): Promise<void> {
    await runProcess('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-nostdin',
        '-y',
        '-protocol_whitelist', 'file,pipe',
        '-f', 'mov',
        '-enable_drefs', '0',
        '-use_absolute_path', '0',
        '-threads', '4',
        '-max_pixels', String(MAX_PIXELS_PER_FRAME),
        '-i', inputPath,
        '-map_metadata', '-1',
        '-map_metadata:s', '-1',
        '-map_chapters', '-1',
        '-map', '0:V:0',
        ...(options.hasAudio ? ['-map', '0:a:0'] : ['-an']),
        '-dn',
        '-sn',
        '-vf', 'sidedata=mode=delete,pad=ceil(iw/2)*2:ceil(ih/2)*2',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-bsf:v', 'filter_units=remove_types=6',
        '-fflags', '+bitexact',
        '-flags:v', '+bitexact',
        '-movflags', '+faststart+use_metadata_tags',
        '-write_tmcd', '0',
        '-metadata', `software=${SOFTWARE_MARKER}`,
        '-metadata', `encoder=${SOFTWARE_MARKER}`,
        '-metadata:s:v:0', `encoder=${SOFTWARE_MARKER}`,
        '-metadata:s:v:0', `handler_name=${GENERIC_VIDEO_HANDLER}`,
        '-metadata:s:v:0', `language=${GENERIC_LANGUAGE}`,
        ...(options.hasAudio
            ? [
                '-c:a', 'aac',
                '-b:a', '192k',
                '-flags:a', '+bitexact',
                '-metadata:s:a:0', `encoder=${SOFTWARE_MARKER}`,
                '-metadata:s:a:0', `handler_name=${GENERIC_AUDIO_HANDLER}`,
                '-metadata:s:a:0', `language=${GENERIC_LANGUAGE}`,
            ]
            : []),
        '-fs', String(options.maxBytes + 1),
        outputPath,
    ], deadline, 'normalizing video');
}

async function verifyNormalizedDecodability(outputPath: string, hasAudio: boolean, deadline: Deadline): Promise<void> {
    await runProcess('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-nostdin',
        '-xerror',
        '-protocol_whitelist', 'file,pipe',
        '-f', 'mov',
        '-enable_drefs', '0',
        '-use_absolute_path', '0',
        '-threads', '4',
        '-max_pixels', String(MAX_PIXELS_PER_FRAME),
        '-i', outputPath,
        '-map', '0:V:0',
        ...(hasAudio ? ['-map', '0:a:0'] : ['-an']),
        '-f', 'null',
        '-',
    ], deadline, 'verifying normalized output decodability');
}

async function generatePoster(
    outputPath: string,
    temporaryDirectory: string,
    durationSeconds: number,
    deadline: Deadline,
): Promise<{ outputPath: string; size: number; width: number; height: number }> {
    const sampleSecond = Math.max(0, Math.min(1, durationSeconds / 2));
    const rawPosterPath = join(temporaryDirectory, 'poster-raw.jpg');
    const posterPath = join(temporaryDirectory, 'poster.jpg');

    await runProcess('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-nostdin',
        '-y',
        '-ss', sampleSecond.toFixed(3),
        '-protocol_whitelist', 'file,pipe',
        '-f', 'mov',
        '-enable_drefs', '0',
        '-use_absolute_path', '0',
        '-threads', '2',
        '-max_pixels', String(MAX_PIXELS_PER_FRAME),
        '-i', outputPath,
        '-frames:v', '1',
        '-map', '0:V:0',
        '-map_metadata', '-1',
        '-map_metadata:s', '-1',
        '-map_chapters', '-1',
        '-an',
        '-dn',
        '-sn',
        '-vf', 'sidedata=mode=delete,scale=w=min(1200\\,iw):h=-2:force_original_aspect_ratio=decrease',
        rawPosterPath,
    ], deadline, 'generating poster frame');

    if (process.platform !== 'win32') {
        await chmod(rawPosterPath, 0o600);
    }

    // Let Sharp terminate its own work before cleanup. A Promise.race timeout
    // alone would leave a native writer running against a removed directory.
    const info = await sharp(rawPosterPath, { limitInputPixels: MAX_PIXELS_PER_FRAME })
        .timeout({ seconds: Math.max(1, Math.ceil(getRemainingMilliseconds(deadline, 'processing poster image') / 1000)) })
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4', progressive: true })
        .withExif({ IFD0: { Software: SOFTWARE_MARKER } })
        .toFile(posterPath);
    getRemainingMilliseconds(deadline, 'processing poster image');

    if (process.platform !== 'win32') {
        await chmod(posterPath, 0o600);
    }

    await rm(rawPosterPath, { force: true });

    const posterStat = await stat(posterPath);
    return {
        outputPath: posterPath,
        size: posterStat.size,
        width: info.width,
        height: info.height,
    };
}

function createDeadline(timeoutSeconds: number): Deadline {
    return {
        expiresAtMs: Date.now() + timeoutSeconds * 1_000,
        timeoutSeconds,
    };
}

function getRemainingMilliseconds(deadline: Deadline, description: string): number {
    const remaining = deadline.expiresAtMs - Date.now();
    if (remaining <= 0) {
        throw new UsageError(`${description} exceeded the ${deadline.timeoutSeconds}-second timeout.`);
    }

    return Math.max(1, Math.min(MAX_TIMEOUT_MS, Math.floor(remaining)));
}

async function runProcess(
    executable: string,
    args: ReadonlyArray<string>,
    deadline: Deadline,
    description: string,
): Promise<{ stdout: string; stderr: string }> {
    // Check before spawning: throwing after spawn could orphan the child.
    const timeoutMs = getRemainingMilliseconds(deadline, description);
    const env = { ...process.env };
    delete env.FFREPORT;

    const child = spawn(executable, [...args], {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env,
    });

    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let outputOverflow = false;
    let timedOut = false;
    let interruptedSignal: NodeJS.Signals | undefined;
    let forceKillTimer: NodeJS.Timeout | undefined;
    let spawnError: NodeJS.ErrnoException | undefined;

    const armForceKill = (): void => {
        if (forceKillTimer) {
            return;
        }

        forceKillTimer = setTimeout(() => child.kill('SIGKILL'), PROCESS_FORCE_KILL_GRACE_MS);
        forceKillTimer.unref();
    };

    const terminateChild = (): void => {
        child.kill('SIGTERM');
        armForceKill();
    };

    const onChunk = (chunk: Buffer, target: 'stdout' | 'stderr'): void => {
        outputBytes += chunk.length;
        if (outputBytes > MAX_TOOL_OUTPUT_BYTES) {
            outputOverflow = true;
            terminateChild();
            return;
        }

        if (target === 'stdout') {
            stdout += chunk.toString('utf8');
        } else {
            stderr += chunk.toString('utf8');
        }
    };

    child.stdout.on('data', (chunk) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        onChunk(buffer, 'stdout');
    });
    child.stderr.on('data', (chunk) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        onChunk(buffer, 'stderr');
    });

    const onSigint = (): void => {
        interruptedSignal = 'SIGINT';
        terminateChild();
    };
    const onSigterm = (): void => {
        interruptedSignal = 'SIGTERM';
        terminateChild();
    };
    process.once('SIGINT', onSigint);
    process.once('SIGTERM', onSigterm);

    const timeoutTimer = setTimeout(() => {
        timedOut = true;
        terminateChild();
    }, timeoutMs);
    timeoutTimer.unref();

    try {
        const completion = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
            child.once('error', (error) => {
                spawnError = error as NodeJS.ErrnoException;
            });
            child.once('close', (code, signal) => resolve({ code, signal }));
        });

        if (spawnError?.code === 'ENOENT') {
            throw new UsageError(`Missing required executable: ${executable}. Install ffmpeg and ffprobe to process video uploads.`);
        }

        if (spawnError) {
            throw spawnError;
        }

        if (timedOut) {
            throw new UsageError(`${description} exceeded the ${deadline.timeoutSeconds}-second timeout.`);
        }

        if (outputOverflow) {
            throw new UsageError(`${description} produced too much diagnostic output.`);
        }

        if (interruptedSignal) {
            throw new UsageError(`${description} interrupted by ${interruptedSignal}.`);
        }

        if (completion.code !== 0) {
            throw new UnsupportedImageError(`Video processing failed while ${description}.`);
        }

        return { stdout, stderr };
    } finally {
        clearTimeout(timeoutTimer);
        if (forceKillTimer) {
            clearTimeout(forceKillTimer);
        }
        process.removeListener('SIGINT', onSigint);
        process.removeListener('SIGTERM', onSigterm);
    }
}