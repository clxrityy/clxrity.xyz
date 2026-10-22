import { execFile, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { decodeEmbedMetadata } from '../src/embeds.js';

const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const publicBaseUrl = 'https://img.example.test'; // Output assertion only; never requested.
const bucket = 'test-images';
const privateMarker = 'CLI_PRIVATE_ARTIST';

interface StoredObject {
    body: Buffer;
    contentType: string;
    cacheControl: string;
    contentDisposition: string;
    uploadId: string;
    lastModified: string;
    customMetadata: Record<string, string>;
}

interface CliResult {
    code: number | string | null;
    signal: string | null;
    stdout: string;
    stderr: string;
}

function xml(value: string): string {
    return value.replace(/[<>&"']/g, (character) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
    })[character]!);
}

describe('compiled CLI against loopback S3', () => {
    const objects = new Map<string, StoredObject>();
    const requests: Array<{ method: string; key: string; ifNoneMatch: string | undefined }> = [];
    const fixtureErrors: string[] = [];
    const explicitEmbedDefaults = Object.freeze({ color: 'rebeccapurple', title: 'saved title', description: 'saved description' });
    let root: string;
    let cwd: string;
    let configPath: string;
    let defaultsConfigPath: string;
    let scratch: string;
    let env: NodeJS.ProcessEnv;
    let clock = 0;
    let originalPng: Buffer;

    function s3Error(response: ServerResponse, status: number, code: string): void {
        response.writeHead(status, { 'content-type': 'application/xml' });
        response.end(`<Error><Code>${xml(code)}</Code><Message>${xml(code)}</Message></Error>`);
    }

    async function serve(request: IncomingMessage, response: ServerResponse): Promise<void> {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1');
        const path = decodeURIComponent(url.pathname).replace(/^\//, '');
        const key = path === bucket ? '' : path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
        const method = request.method ?? '';
        requests.push({ method, key, ifNoneMatch: request.headers['if-none-match'] });
        if (!request.headers.authorization) {
            fixtureErrors.push('SDK request did not include Authorization');
            s3Error(response, 403, 'AccessDenied');
            return;
        }

        if (method === 'GET' && !key && url.searchParams.get('list-type') === '2') {
            const prefix = url.searchParams.get('prefix') ?? '';
            // S3 lists in key order, not upload order: the CLI must sort timestamps.
            const entries = [...objects].filter(([name]) => name.startsWith(prefix))
                .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
            const contents = entries.map(([name, object]) =>
                `<Contents><Key>${xml(name)}</Key><LastModified>${xml(object.lastModified)}</LastModified><Size>${object.body.length}</Size></Contents>`).join('');
            response.writeHead(200, { 'content-type': 'application/xml' });
            response.end(`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>${xml(bucket)}</Name><Prefix>${xml(prefix)}</Prefix><KeyCount>${entries.length}</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated>${contents}</ListBucketResult>`);
            return;
        }

        if (method === 'PUT' && key) {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of request) {
                const bytes = Buffer.from(chunk as Uint8Array);
                size += bytes.length;
                if (size > 1024 * 1024) {
                    fixtureErrors.push('Unexpectedly large synthetic upload');
                    s3Error(response, 413, 'EntityTooLarge');
                    return;
                }
                chunks.push(bytes);
            }
            const customMetadata = Object.fromEntries(
                Object.entries(request.headers)
                    .filter(([name]) => name.startsWith('x-amz-meta-'))
                    .map(([name, value]) => [name.slice('x-amz-meta-'.length), String(Array.isArray(value) ? value[0] ?? '' : value ?? '')]),
            );
            // Check and commit synchronously after consuming the body, so competing
            // conditional writes cannot both succeed. A rejected PUT changes nothing.
            if (request.headers['if-none-match'] === '*' && objects.has(key)) {
                s3Error(response, 412, 'PreconditionFailed');
                return;
            }
            objects.set(key, {
                body: Buffer.concat(chunks),
                contentType: String(request.headers['content-type'] ?? ''),
                cacheControl: String(request.headers['cache-control'] ?? ''),
                contentDisposition: String(request.headers['content-disposition'] ?? ''),
                uploadId: String(customMetadata['upload-id'] ?? request.headers['x-amz-meta-upload-id'] ?? ''),
                // Deterministic whole seconds also survive HEAD's HTTP date precision.
                lastModified: new Date(Date.UTC(2026, 0, 1, 0, 0, ++clock)).toISOString(),
                customMetadata,
            });
            response.writeHead(200, { etag: '"fixture-etag"' });
            response.end();
            return;
        }

        if (method === 'HEAD' && key) {
            const object = objects.get(key);
            if (!object) {
                s3Error(response, 404, 'NoSuchKey');
                return;
            }
            const metadataHeaders = Object.fromEntries(
                Object.entries(object.customMetadata).map(([name, value]) => [`x-amz-meta-${name}`, value]),
            );
            if (!Object.hasOwn(object.customMetadata, 'upload-id')) {
                metadataHeaders['x-amz-meta-upload-id'] = object.uploadId;
            }
            response.writeHead(200, {
                'content-length': object.body.length,
                'content-type': object.contentType,
                'cache-control': object.cacheControl,
                'content-disposition': object.contentDisposition,
                'last-modified': new Date(object.lastModified).toUTCString(),
                ...metadataHeaders,
            });
            response.end();
            return;
        }

        if (method === 'DELETE' && key) {
            objects.delete(key);
            response.writeHead(204);
            response.end();
            return;
        }

        fixtureErrors.push(`Unexpected request: ${method} ${request.url}`);
        s3Error(response, 400, 'InvalidRequest');
    }

    const server = createServer((request, response) => {
        void serve(request, response).catch((error: unknown) => {
            fixtureErrors.push(String(error));
            if (!response.headersSent) s3Error(response, 400, 'InvalidRequest');
            else response.destroy();
        });
    });
    server.requestTimeout = 5_000;
    server.headersTimeout = 5_000;

    // Resolve failures too: assertions retain both streams rather than losing them
    // in an execFile rejection. SIGKILL bounds hung network/auth/child operations.
    function cliWithTimeout(timeoutMs: number, ...args: string[]): Promise<CliResult> {
        return new Promise((resolve) => {
            const child = execFile(process.execPath, [cliPath, ...args], {
                cwd, env, encoding: 'utf8', maxBuffer: 1024 * 1024,
                timeout: timeoutMs, killSignal: 'SIGKILL',
            }, (error, stdout, stderr) => {
                resolve({ code: error ? error.code ?? null : 0, signal: error?.signal ?? null, stdout, stderr });
            });
            child.stdin?.end();
        });
    }

    function cli(...args: string[]): Promise<CliResult> {
        return cliWithTimeout(8_000, ...args);
    }

    function success(result: CliResult): void {
        expect(result, JSON.stringify(result)).toMatchObject({ code: 0, signal: null });
        expect(result.stdout + result.stderr).not.toMatch(/dotenv|fake-access-key|fake-secret-key|CALLER_ENV_POISON/i);
    }

    function failure(result: CliResult, message: RegExp): void {
        expect(result, JSON.stringify(result)).toMatchObject({ signal: null, stdout: '' });
        expect(typeof result.code, JSON.stringify(result)).toBe('number');
        expect(result.code, JSON.stringify(result)).not.toBe(0);
        expect(result.stderr).toMatch(message);
        expect(result.stderr).not.toMatch(/fake-access-key|fake-secret-key|CALLER_ENV_POISON/);
    }

    function parseUploadOutput(output: string): { shareUrl: string; rawUrl: string; key: string } {
        const lines = output.trimEnd().split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[0]).toMatch(/^Share: https:\/\/img\.example\.test\/s\/.+/);
        expect(lines[1]).toMatch(/^Raw: https:\/\/img\.example\.test\/.+/);
        const shareUrl = lines[0]!.replace(/^Share: /, '');
        const rawUrl = lines[1]!.replace(/^Raw: /, '');
        const sharePath = new URL(shareUrl).pathname;
        const rawPath = new URL(rawUrl).pathname;
        expect(sharePath.startsWith('/s/')).toBe(true);
        const shareKey = decodeURIComponent(sharePath.slice('/s/'.length));
        const rawKey = decodeURIComponent(rawPath.replace(/^\//, ''));
        expect(shareKey).toBe(rawKey);
        return { shareUrl, rawUrl, key: rawKey };
    }

    async function uploadViaConfig(config: string, file: string, args: string[] = [], timeoutMs = 8_000): Promise<{ shareUrl: string; rawUrl: string; key: string }> {
        const result = await cliWithTimeout(timeoutMs, '--config', config, 'upload', file, ...args);
        success(result);
        return parseUploadOutput(result.stdout);
    }

    async function upload(file: string, ...args: string[]): Promise<string> {
        const parsed = await uploadViaConfig(configPath, file, args);
        return parsed.rawUrl;
    }

    function expectedListing(keys: string[]): unknown[] {
        return keys.map((key) => {
            const object = objects.get(key)!;
            return {
                id: key,
                key,
                url: `${publicBaseUrl}/${key}`,
                shareUrl: `${publicBaseUrl}/s/${key}`,
                size: object.body.length,
                uploadedAt: object.lastModified,
            };
        });
    }

    async function expectList(keys: string[], ...args: string[]): Promise<void> {
        const result = await cli('--config', configPath, 'list', '--json', ...args);
        success(result);
        expect(JSON.parse(result.stdout)).toEqual(expectedListing(keys));
    }

    async function runExternal(command: string, args: readonly string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, [...args], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            let timedOut = false;

            const timeout = setTimeout(() => {
                timedOut = true;
                child.kill('SIGKILL');
            }, timeoutMs);
            timeout.unref();

            child.stdout.on('data', (chunk) => {
                stdout += chunk.toString('utf8');
            });
            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString('utf8');
            });

            child.once('error', (error) => {
                clearTimeout(timeout);
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    reject(new Error(`Missing required executable: ${command}. Install ffmpeg and ffprobe to run video integration tests.`));
                    return;
                }
                reject(error);
            });

            child.once('close', (code, signal) => {
                clearTimeout(timeout);
                if (timedOut) {
                    reject(new Error(`${command} timed out after ${timeoutMs}ms while preparing video fixtures.`));
                    return;
                }
                if (code !== 0) {
                    reject(new Error(`${command} exited with code ${String(code)}${signal ? ` (${signal})` : ''}: ${stderr || stdout}`));
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    }

    async function ensureVideoTooling(): Promise<void> {
        for (const command of ['ffmpeg', 'ffprobe']) {
            try {
                await runExternal(command, ['-version'], 10_000);
            } catch (error) {
                throw new Error(`Video integration requires ${command} on PATH. ${(error as Error).message}`);
            }
        }
    }

    async function createTinyVideoFixture(path: string, color: string, marker: string): Promise<void> {
        await runExternal('ffmpeg', [
            '-hide_banner',
            '-loglevel', 'error',
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=${color}:s=320x180:r=24`,
            '-t', '1',
            '-map', '0:v:0',
            '-an',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-metadata', `title=${marker}`,
            '-metadata', `artist=${marker}`,
            '-metadata', `comment=${marker}`,
            '-metadata:s:v:0', `handler_name=${marker}`,
            path,
        ], 30_000);
    }

    beforeAll(async () => {
        root = await mkdtemp(join(tmpdir(), 'clxrity-cli-test-'));
        cwd = join(root, 'unrelated working directory');
        configPath = join(root, 'fake-config.json');
        scratch = join(root, 'processing-temp');
        const home = join(root, 'home');
        await Promise.all([cwd, scratch, home].map((directory) => mkdir(directory, { recursive: true })));
        // An allowlist drops every inherited R2_*, PUBLIC_BASE_URL, XDG_CONFIG_HOME,
        // AWS credential/provider variable, proxy, and NODE_OPTIONS/preload hook.
        env = {};
        for (const name of ['PATH', 'SystemRoot', 'WINDIR']) {
            if (process.env[name] !== undefined) env[name] = process.env[name];
        }
        Object.assign(env, {
            HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: join(home, '.config'),
            TMPDIR: scratch, TMP: scratch, TEMP: scratch,
            AWS_EC2_METADATA_DISABLED: 'true', AWS_MAX_ATTEMPTS: '1',
            NO_PROXY: '127.0.0.1,localhost', LANG: 'C', TZ: 'UTC',
        });
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', () => {
                server.off('error', reject);
                resolve();
            });
        });
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Missing loopback server address');
        await writeFile(configPath, JSON.stringify({
            r2Endpoint: `http://127.0.0.1:${address.port}`,
            r2AccessKeyId: 'fake-access-key', r2SecretAccessKey: 'fake-secret-key',
            r2Bucket: bucket, publicBaseUrl,
        }), { mode: 0o600 });
        defaultsConfigPath = join(root, 'fake-config-with-defaults.json');
        await writeFile(defaultsConfigPath, JSON.stringify({
            r2Endpoint: `http://127.0.0.1:${address.port}`,
            r2AccessKeyId: 'fake-access-key',
            r2SecretAccessKey: 'fake-secret-key',
            r2Bucket: bucket,
            publicBaseUrl,
            embedDefaults: explicitEmbedDefaults,
        }), { mode: 0o600 });
        // If the CLI mistakenly loads the caller's .env, config validation must
        // fail locally rather than sending even fake credentials off-loopback.
        await writeFile(join(cwd, '.env'), 'R2_ENDPOINT=INVALID_CALLER_ENDPOINT\nR2_ACCESS_KEY_ID=CALLER_ENV_POISON\nR2_SECRET_ACCESS_KEY=CALLER_ENV_POISON\nPUBLIC_BASE_URL=INVALID_CALLER_URL\n');
        originalPng = await sharp({ create: { width: 8, height: 6, channels: 4, background: '#ff000080' } })
            .withExif({ IFD0: { Artist: privateMarker } }).png().toBuffer();
        expect((await sharp(originalPng).metadata()).exif).toBeDefined();
        await writeFile(join(cwd, 'source image.png'), originalPng);
        await sharp({ create: { width: 8, height: 6, channels: 4, background: '#0000ffff' } })
            .png().toFile(join(cwd, 'replacement.png'));
        await sharp(originalPng).withExif({ IFD0: { Artist: privateMarker } })
            .jpeg().toFile(join(cwd, 'source.jpg'));
        await sharp({ create: { width: 8, height: 6, channels: 4, background: '#00ff0080' } })
            .gif().toFile(join(cwd, 'source.gif'));
    });

    beforeEach(() => {
        objects.clear();
        requests.length = 0;
        fixtureErrors.length = 0;
        clock = 0;
    });

    afterEach(async () => {
        expect(fixtureErrors).toEqual([]);
        expect(await readdir(scratch)).toEqual([]);
    });

    afterAll(async () => {
        try {
            if (server.listening) {
                await new Promise<void>((resolve, reject) => {
                    server.close((error) => error ? reject(error) : resolve());
                    server.closeAllConnections();
                });
            }
        } finally {
            if (root) await rm(root, { recursive: true, force: true });
        }
    });

    it('prints help and the package version outside the workspace without config', async () => {
        const help = await cli('--help');
        success(help);
        expect(help.stdout).toMatch(/Usage: clxrity-img/);
        expect(help.stdout).toMatch(/upload/);
        const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
        const version = await cli('--version');
        success(version);
        expect(version.stdout).toBe(`${manifest.version}\n`);
        expect(requests).toEqual([]);
    });

    it('rejects malformed arguments and noninteractive removal before reading credentials', async () => {
        const missingConfig = join(root, 'does-not-exist.json');
        const cases: Array<{ args: string[]; message: RegExp }> = [
            ...['10abc', '1.5', '0'].map((limit) => ({ args: ['list', '--limit', limit], message: /--limit must be a positive integer/i })),
            { args: ['list', '--all', '--limit', '1'], message: /either --all or --limit/i },
            { args: ['remove', 'Ab12Cd34'], message: /--yes.*non-interactive/i },
            { args: ['upload', 'source image.png', '--force'], message: /--force requires a custom name/i },
            { args: ['upload', 'source image.png', '../escape.png'], message: /media names/i },
            { args: ['upload', 'source image.png', 'bad name'], message: /media names/i },
            { args: ['remove', '../escape.png', '--yes'], message: /media IDs|media identifiers/i },
            { args: ['upload', 'source image.png', '--color', 'url(evil)'], message: /color must/i },
        ];
        for (const testCase of cases) {
            const result = await cli('--config', missingConfig, ...testCase.args);
            failure(result, testCase.message);
            expect(result.stderr).not.toMatch(/config file not found|missing R2|authentication/i);
        }
        expect(requests).toEqual([]);
    }, 60_000);

    it('uploads private images, sorts JSON, protects collisions, replaces and removes exact identities', async () => {
        const namedUrl = await upload('source image.png', 'z-custom.JPEG');
        expect(namedUrl).toBe(`${publicBaseUrl}/z-custom.png`);
        const original = objects.get('z-custom.png')!;
        expect(original).toMatchObject({ contentType: 'image/png', cacheControl: 'no-store', contentDisposition: 'inline' });
        expect(original.uploadId).toMatch(/^[a-f0-9-]{36}$/i);
        expect(requests.find((request) => request.method === 'PUT')).toMatchObject({ ifNoneMatch: '*' });
        const metadata = await sharp(original.body).metadata();
        expect(metadata).toMatchObject({ format: 'png', width: 8, height: 6, hasAlpha: true });
        expect(metadata.exif).toBeUndefined();
        expect(metadata.xmp).toBeUndefined();
        expect(metadata.iptc).toBeUndefined();
        expect(original.body.includes(Buffer.from(privateMarker))).toBe(false);
        expect(await readFile(join(cwd, 'source image.png'))).toEqual(originalPng);

        expect(await upload('source image.png', 'a-custom')).toBe(`${publicBaseUrl}/a-custom.png`);
        // Key order and timestamp order disagree deliberately.
        await expectList(['a-custom.png', 'z-custom.png']);
        await expectList(['a-custom.png'], '--limit', '1');
        await expectList(['z-custom.png'], '--prefix', 'z-');

        const generatedUrl = await upload('source image.png');
        expect(generatedUrl).toMatch(/^https:\/\/img\.example\.test\/[A-Za-z0-9]{8}\.png$/);
        const generatedKey = new URL(generatedUrl).pathname.slice(1);
        await expectList([generatedKey, 'a-custom.png', 'z-custom.png'], '--all');

        const conflict = await cli('--config', configPath, 'upload', 'replacement.png', 'z-custom.png');
        failure(conflict, /already exists.*--force/i);
        expect(objects.get('z-custom.png')).toBe(original);
        expect(requests.some((request) => request.method === 'HEAD' && request.key === 'z-custom.png')).toBe(true);
        expect(await readdir(scratch)).toEqual([]);

        expect(await upload('replacement.png', 'z-custom', '--force')).toBe(namedUrl);
        const replacement = objects.get('z-custom.png')!;
        expect(replacement.body).not.toEqual(original.body);
        expect(replacement.uploadId).not.toBe(original.uploadId);
        expect(Date.parse(replacement.lastModified)).toBeGreaterThan(Date.parse(original.lastModified));
        expect(requests.filter((request) => request.method === 'PUT').at(-1)?.ifNoneMatch).toBeUndefined();
        await expectList(['z-custom.png', generatedKey, 'a-custom.png']);

        const removeStem = await cli('--config', configPath, 'remove', generatedKey.slice(0, 8), '--yes');
        success(removeStem);
        expect(removeStem.stdout).toBe(`Removed ${generatedKey}\n`);
        for (const key of ['z-custom.png', 'a-custom.png']) {
            const removed = await cli('--config', configPath, 'remove', key, '--yes');
            success(removed);
            expect(removed.stdout).toBe(`Removed ${key}\n`);
        }
        await expectList([]);
        failure(await cli('--config', configPath, 'remove', generatedKey, '--yes'), /no uploaded media|not found/i);
        failure(await cli('--config', configPath, 'remove', generatedKey.slice(0, 8), '--yes'), /no uploaded media|not found/i);

        await upload('source image.png', 'ambiguous');
        await upload('source.jpg', 'ambiguous');
        const jpeg = objects.get('ambiguous.jpg')!;
        expect(jpeg.contentType).toBe('image/jpeg');
        expect((await sharp(jpeg.body).metadata()).exif).toBeInstanceOf(Buffer);
        expect(jpeg.body.includes(Buffer.from('clxrity-img'))).toBe(true);
        expect(jpeg.body.includes(Buffer.from(privateMarker))).toBe(false);
        const beforeAmbiguous = [...objects.entries()];
        const deleteCount = requests.filter((request) => request.method === 'DELETE').length;
        const ambiguous = await cli('--config', configPath, 'remove', 'ambiguous', '--yes');
        failure(ambiguous, /ambiguous|multiple/i);
        expect(ambiguous.stderr).toContain('ambiguous.jpg');
        expect(ambiguous.stderr).toContain('ambiguous.png');
        expect([...objects.entries()]).toEqual(beforeAmbiguous);
        expect(requests.filter((request) => request.method === 'DELETE')).toHaveLength(deleteCount);
        await expectList(['ambiguous.jpg', 'ambiguous.png']);
        for (const key of ['ambiguous.jpg', 'ambiguous.png']) {
            success(await cli('--config', configPath, 'remove', key, '--yes'));
        }
        await expectList([]);
        expect(objects.size).toBe(0);
    }, 60_000);

    it('implements upload-only defaults, optional values and explicit empty values in the compiled CLI', async () => {
        const before = await readFile(defaultsConfigPath);
        const inherited = await uploadViaConfig(defaultsConfigPath, 'source image.png', ['inherited']);
        expect(decodeEmbedMetadata(objects.get(inherited.key)!.customMetadata)).toMatchObject({
            color: '#663399', title: 'saved title', description: 'saved description',
        });
        const overrides = await uploadViaConfig(defaultsConfigPath, 'source image.png', [
            'overrides', '--color', 'coral', '--title', 'coral', '--description',
        ]);
        expect(decodeEmbedMetadata(objects.get(overrides.key)!.customMetadata)).toMatchObject({ color: '#FF7F50', title: 'coral', description: '' });
        const cleared = await uploadViaConfig(defaultsConfigPath, 'source image.png', [
            'cleared', '--color', '--title', '', '--description', '',
        ]);
        expect(decodeEmbedMetadata(objects.get(cleared.key)!.customMetadata)).toMatchObject({ color: null, title: '', description: '' });
        const builtins = await uploadViaConfig(configPath, 'source image.png', ['builtins']);
        expect(decodeEmbedMetadata(objects.get(builtins.key)!.customMetadata)).toMatchObject({ color: '#5865F2', title: '', description: '' });
        expect(await readFile(defaultsConfigPath)).toEqual(before);
    }, 60_000);

    it('uploads normalized videos, hides posters, replaces safely and removes complete media', async () => {
        await ensureVideoTooling();
        const sourcePath = join(cwd, 'private-source.mov');
        const replacementPath = join(cwd, 'video-replacement.mp4');
        const marker = 'CLI_PRIVATE_VIDEO_METADATA';
        await createTinyVideoFixture(sourcePath, 'red', marker);
        await createTinyVideoFixture(replacementPath, 'blue', marker);
        const original = await readFile(sourcePath);
        const result = await uploadViaConfig(configPath, sourcePath, ['clip.MOV', '--color'], 30_000);
        expect(result).toEqual({ key: 'clip.mp4', shareUrl: `${publicBaseUrl}/s/clip.mp4`, rawUrl: `${publicBaseUrl}/clip.mp4` });
        const video = objects.get('clip.mp4')!;
        expect(video.contentType).toBe('video/mp4');
        expect(video.body.includes(Buffer.from(marker))).toBe(false);
        expect(video.body.includes(Buffer.from('clxrity-img'))).toBe(true);
        const record = decodeEmbedMetadata(video.customMetadata)!;
        const poster = record.posterKey!;
        expect(record).toMatchObject({ kind: 'video', color: null, title: '', description: '', width: 320, height: 180 });
        expect(poster).toBe(`_previews/${video.uploadId}.jpg`);
        expect(objects.get(poster)).toMatchObject({ contentType: 'image/jpeg', uploadId: video.uploadId });
        expect(await readFile(sourcePath)).toEqual(original);
        await expectList(['clip.mp4']);
        expect(requests.filter(({ method }) => method === 'PUT').slice(0, 2).map(({ key }) => key)).toEqual([poster, 'clip.mp4']);

        await upload('source image.png', 'clip');
        failure(await cli('--config', configPath, 'remove', 'clip', '--yes'), /multiple/i);
        expect(objects.has(poster)).toBe(true);
        const forced = await uploadViaConfig(configPath, replacementPath, ['clip', '--force'], 30_000);
        expect(forced.key).toBe('clip.mp4');
        const replacement = objects.get('clip.mp4')!;
        const newPoster = decodeEmbedMetadata(replacement.customMetadata)!.posterKey!;
        expect(newPoster).not.toBe(poster);
        expect(objects.has(poster)).toBe(false);
        expect(objects.has(newPoster)).toBe(true);
        expect(replacement.body).not.toEqual(video.body);
        success(await cli('--config', configPath, 'remove', 'clip.mp4', '--yes'));
        expect(objects.has('clip.mp4')).toBe(false);
        expect(objects.has(newPoster)).toBe(false);
        await expectList(['clip.png']);
    }, 120_000);
});