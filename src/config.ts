import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'dotenv';

import { DEFAULT_EMBED_STYLE, resolveEmbedStyle, type EmbedStyle } from './embeds.js';
import { ConfigError, UsageError } from './errors.js';
import { DEFAULT_VIDEO_LIMITS, type VideoLimits } from './media-types.js';

export interface AppConfig {
    readonly r2AccountId?: string;
    readonly r2Endpoint: string;
    readonly r2AccessKeyId: string;
    readonly r2SecretAccessKey: string;
    readonly r2Bucket: string;
    readonly publicBaseUrl: string;
    readonly embedDefaults?: EmbedStyle;
    readonly videoLimits?: VideoLimits;
}

interface ConfigFileValues {
    readonly r2AccountId?: string | undefined;
    readonly r2Endpoint?: string | undefined;
    readonly r2AccessKeyId?: string | undefined;
    readonly r2SecretAccessKey?: string | undefined;
    readonly r2Bucket?: string | undefined;
    readonly publicBaseUrl?: string | undefined;
    readonly embedDefaults?: Partial<EmbedStyle> | undefined;
    readonly videoLimits?: Partial<VideoLimits> | undefined;
}

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PUBLIC_BASE_URL = 'https://img.clxrity.xyz';

export async function loadConfig(options: { configPath?: string | undefined } = {}): Promise<AppConfig> {
    // Development .env is a fallback, never process-wide state or the caller's .env.
    const development = await loadProjectEnv();

    const explicitConfig = options.configPath ? await readConfigFile(resolveConfigPath(options.configPath), true) : undefined;
    const userConfig = options.configPath ? undefined : await readConfigFile(getUserConfigPath(), false);

    const fileValues = explicitConfig ?? userConfig;

    const r2AccountId = readFirstDefined(process.env.R2_ACCOUNT_ID, fileValues?.r2AccountId, development.R2_ACCOUNT_ID);
    const r2Endpoint = readFirstDefined(process.env.R2_ENDPOINT, fileValues?.r2Endpoint, development.R2_ENDPOINT) ?? deriveEndpoint(r2AccountId);
    const r2AccessKeyId = readFirstDefined(process.env.R2_ACCESS_KEY_ID, fileValues?.r2AccessKeyId, development.R2_ACCESS_KEY_ID);
    const r2SecretAccessKey = readFirstDefined(process.env.R2_SECRET_ACCESS_KEY, fileValues?.r2SecretAccessKey, development.R2_SECRET_ACCESS_KEY);
    const r2Bucket = readFirstDefined(process.env.R2_BUCKET, fileValues?.r2Bucket, development.R2_BUCKET);
    const publicBaseUrl = normalizeUrl(readFirstDefined(process.env.PUBLIC_BASE_URL, fileValues?.publicBaseUrl, development.PUBLIC_BASE_URL) ?? DEFAULT_PUBLIC_BASE_URL, 'PUBLIC_BASE_URL');
    const embedDefaults = resolveEmbedDefaults(fileValues?.embedDefaults, development);
    const videoLimits = { ...DEFAULT_VIDEO_LIMITS, ...fileValues?.videoLimits };

    if (!r2Endpoint) {
        throw new ConfigError('Missing R2 endpoint configuration. Set R2_ACCOUNT_ID or R2_ENDPOINT.');
    }

    if (!r2AccessKeyId) {
        throw new ConfigError('Missing R2 access key ID. Set R2_ACCESS_KEY_ID in your environment or config file.');
    }

    if (!r2SecretAccessKey) {
        throw new ConfigError('Missing R2 secret access key. Set R2_SECRET_ACCESS_KEY in your environment or config file.');
    }

    if (!r2Bucket) {
        throw new ConfigError('Missing R2 bucket name. Set R2_BUCKET in your environment or config file.');
    }

    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(r2Bucket)) {
        throw new ConfigError('R2_BUCKET must be 3–63 lowercase letters, numbers, or hyphens, with no leading or trailing hyphen.');
    }

    return {
        ...(r2AccountId ? { r2AccountId } : {}),
        r2Endpoint: normalizeUrl(r2Endpoint, 'R2_ENDPOINT'),
        r2AccessKeyId,
        r2SecretAccessKey,
        r2Bucket,
        publicBaseUrl,
        embedDefaults,
        videoLimits,
    };
}

export function getUserConfigPath(): string {
    const configured = process.env.XDG_CONFIG_HOME;
    const baseDir = configured && isAbsolute(configured) ? configured : join(homedir(), '.config');
    return join(baseDir, 'clxrity-img', 'config.json');
}

export function deriveEndpoint(accountId?: string): string | undefined {
    if (!accountId) {
        return undefined;
    }

    if (!/^[a-f0-9]{32}$/i.test(accountId)) {
        throw new ConfigError('R2_ACCOUNT_ID must be your 32-character Cloudflare account ID.');
    }

    return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function loadProjectEnv(): Promise<Record<string, string>> {
    // Compiled/global installs intentionally ignore package-local development secrets.
    if (!import.meta.url.endsWith('.ts')) return {};
    try {
        return parse(await readFile(join(PACKAGE_ROOT, '.env')));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
        throw new ConfigError('Could not read the project .env file. Check its permissions.');
    }
}

function resolveConfigPath(configPath: string): string {
    if (configPath.startsWith('~/')) return join(homedir(), configPath.slice(2));
    return isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
}

async function readConfigFile(configPath: string, required: boolean): Promise<ConfigFileValues | undefined> {
    const exists = await fileExists(configPath);
    if (!exists) {
        if (required) {
            throw new ConfigError(`Config file not found: ${configPath}`);
        }

        return undefined;
    }

    let parsed: unknown;
    try {
        const info = await stat(configPath);
        if (!info.isFile()) throw new ConfigError('The config path must refer to a regular JSON file.');
        if (process.platform !== 'win32' && (info.mode & 0o077) !== 0) {
            throw new ConfigError(`Config file must be private. Run chmod 600 on ${configPath}.`);
        }
        parsed = JSON.parse(await readFile(configPath, 'utf8'));
    } catch (error) {
        if (error instanceof ConfigError) throw error;
        // Parser error messages can contain secret JSON source. Never echo them.
        throw new ConfigError(`Could not read config file at ${configPath}. Check permissions and JSON syntax.`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new ConfigError(`Config file at ${configPath} must contain a JSON object.`);
    }

    const object = parsed as Record<string, unknown>;

    return {
        r2AccountId: readString(object.r2AccountId ?? object.R2_ACCOUNT_ID),
        r2Endpoint: readString(object.r2Endpoint ?? object.R2_ENDPOINT),
        r2AccessKeyId: readString(object.r2AccessKeyId ?? object.R2_ACCESS_KEY_ID),
        r2SecretAccessKey: readString(object.r2SecretAccessKey ?? object.R2_SECRET_ACCESS_KEY),
        r2Bucket: readString(object.r2Bucket ?? object.R2_BUCKET),
        publicBaseUrl: readString(object.publicBaseUrl ?? object.PUBLIC_BASE_URL),
        embedDefaults: readEmbedDefaults(object.embedDefaults),
        videoLimits: readVideoLimits(object.videoLimits),
    };
}

function resolveEmbedDefaults(file: Partial<EmbedStyle> | undefined, development: Readonly<Record<string, string>>): EmbedStyle {
    // Empty text and null/empty color are meaningful, unlike empty credentials.
    const color = process.env.EMBED_COLOR !== undefined ? process.env.EMBED_COLOR
        : file?.color !== undefined ? file.color : development.EMBED_COLOR ?? DEFAULT_EMBED_STYLE.color;
    try {
        return resolveEmbedStyle({
            color,
            title: process.env.EMBED_TITLE ?? file?.title ?? development.EMBED_TITLE ?? '',
            description: process.env.EMBED_DESCRIPTION ?? file?.description ?? development.EMBED_DESCRIPTION ?? '',
        });
    } catch (error) {
        if (error instanceof UsageError) throw new ConfigError(`Invalid embed defaults. ${error.message}`);
        throw error;
    }
}

function readEmbedDefaults(value: unknown): Partial<EmbedStyle> | undefined {
    if (value === undefined) return undefined;
    const object = readNestedObject(value, 'embedDefaults');
    const { color, title, description } = object;
    if (color !== undefined && color !== null && typeof color !== 'string') throw new ConfigError('embedDefaults.color must be a string or null.');
    if (title !== undefined && typeof title !== 'string') throw new ConfigError('embedDefaults.title must be a string.');
    if (description !== undefined && typeof description !== 'string') throw new ConfigError('embedDefaults.description must be a string.');
    return {
        ...(color !== undefined ? { color } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
    };
}

function readVideoLimits(value: unknown): Partial<VideoLimits> | undefined {
    if (value === undefined) return undefined;
    const object = readNestedObject(value, 'videoLimits');
    const result: { maxBytes?: number; maxDurationSeconds?: number; timeoutSeconds?: number } = {};
    for (const field of ['maxBytes', 'maxDurationSeconds', 'timeoutSeconds'] as const) {
        const entry = object[field];
        if (entry === undefined) continue;
        if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry <= 0) throw new ConfigError(`videoLimits.${field} must be a positive integer.`);
        result[field] = entry;
    }
    return result;
}

function readNestedObject(value: unknown, field: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ConfigError(`${field} must be a JSON object.`);
    return value as Record<string, unknown>;
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await stat(filePath);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
        throw new ConfigError(`Could not access config file at ${filePath}. Check permissions.`);
    }
}

function readFirstDefined(...values: Array<string | undefined>): string | undefined {
    return values.find((value) => typeof value === 'string' && value.length > 0 && !isPlaceholderValue(value));
}

function readString(value: unknown): string | undefined {
    if (value !== undefined && typeof value !== 'string') {
        throw new ConfigError('Configuration values must be strings.');
    }
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeUrl(value: string, field: string): string {
    try {
        const url = new URL(value);
        const localEndpoint = field === 'R2_ENDPOINT' && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        if ((url.protocol !== 'https:' && !localEndpoint) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
        return url.origin;
    } catch {
        throw new ConfigError(`${field} must be an HTTPS origin without credentials, a path, query, or fragment.`);
    }
}

function isPlaceholderValue(value: string): boolean {
    return /^your[-_]/i.test(value) || /replace[-_ ]?me/i.test(value);
}
