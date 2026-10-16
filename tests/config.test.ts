import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deriveEndpoint, getUserConfigPath, loadConfig } from '../src/config.js';
import { ConfigError } from '../src/errors.js';

const isolation = vi.hoisted(() => ({ root: '', denied: '', readDenied: '' }));

vi.mock('dotenv', () => ({ parse: vi.fn(() => ({})) }));
vi.mock('node:fs/promises', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs/promises')>();
    return {
        ...actual,
        readFile: (...args: Parameters<typeof actual.readFile>) => {
            const path = String(args[0]);
            // Do not even read the development .env: it may contain real secrets.
            if (path.endsWith('/.env')) return Promise.resolve(Buffer.alloc(0));
            if (!path.startsWith(`${isolation.root}/`)) throw new Error('Blocked non-fixture config read');
            if (path === isolation.readDenied) {
                return Promise.reject(Object.assign(new Error('synthetic-private-error'), { code: 'EACCES' }));
            }
            return actual.readFile(...args);
        },
        stat: (...args: Parameters<typeof actual.stat>) => {
            if (String(args[0]) === isolation.denied) {
                return Promise.reject(Object.assign(new Error('synthetic permission failure'), { code: 'EACCES' }));
            }
            if (!String(args[0]).startsWith(`${isolation.root}/`)) throw new Error('Blocked non-fixture config stat');
            return actual.stat(...args);
        },
    };
});

const accountId = '0123456789abcdef0123456789abcdef';
const valid = {
    r2AccountId: accountId,
    r2AccessKeyId: 'synthetic-access',
    r2SecretAccessKey: 'synthetic-secret',
    r2Bucket: 'test-images',
    publicBaseUrl: 'https://images.example.test/',
};
const variables = ['R2_ACCOUNT_ID', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'PUBLIC_BASE_URL'] as const;

async function configFile(value: unknown, name = 'explicit.json', mode = 0o600): Promise<string> {
    const path = join(isolation.root, name);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, JSON.stringify(value), { mode });
    await chmod(path, mode);
    return path;
}

beforeEach(async () => {
    isolation.root = await mkdtemp(join(tmpdir(), 'regression-config-'));
    isolation.denied = '';
    isolation.readDenied = '';
    vi.stubEnv('XDG_CONFIG_HOME', isolation.root);
    for (const variable of variables) vi.stubEnv(variable, undefined);
});

afterEach(async () => {
    isolation.denied = '';
    isolation.readDenied = '';
    vi.unstubAllEnvs();
    await rm(isolation.root, { recursive: true, force: true });
});

describe('loadConfig isolated from developer secrets', () => {
    it('loads a private 0600 JSON config and normalizes origins', async () => {
        const configPath = await configFile(valid);
        await expect(loadConfig({ configPath })).resolves.toEqual({
            ...valid,
            r2Endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            publicBaseUrl: 'https://images.example.test',
        });
    });

    it('uses environment over explicit JSON and explicit JSON instead of user config', async () => {
        await configFile({ ...valid, r2Bucket: 'user-images' }, 'clxrity-img/config.json');
        const configPath = await configFile({ ...valid, r2Bucket: 'explicit-images' });
        vi.stubEnv('R2_BUCKET', 'environment-images');
        vi.stubEnv('R2_ACCESS_KEY_ID', 'environment-access');
        vi.stubEnv('R2_ENDPOINT', 'https://endpoint.example.test/');
        await expect(loadConfig({ configPath })).resolves.toMatchObject({
            r2Bucket: 'environment-images', r2AccessKeyId: 'environment-access',
            r2SecretAccessKey: valid.r2SecretAccessKey, r2Endpoint: 'https://endpoint.example.test',
        });
        vi.stubEnv('R2_BUCKET', undefined);
        await expect(loadConfig({ configPath })).resolves.toMatchObject({ r2Bucket: 'explicit-images' });
        await expect(loadConfig()).resolves.toMatchObject({ r2Bucket: 'user-images' });
    });

    it('does not merge an explicit partial config with the per-user config', async () => {
        await configFile(valid, 'clxrity-img/config.json');
        const configPath = await configFile({ r2AccountId: accountId });
        await expect(loadConfig({ configPath })).rejects.toThrow(/access key ID/i);
    });

    it('loads uppercase JSON aliases and the default public origin', async () => {
        const configPath = await configFile({
            R2_ACCOUNT_ID: accountId, R2_ACCESS_KEY_ID: 'synthetic-access',
            R2_SECRET_ACCESS_KEY: 'synthetic-secret', R2_BUCKET: 'test-images',
        });
        await expect(loadConfig({ configPath })).resolves.toMatchObject({
            r2Bucket: 'test-images', publicBaseUrl: 'https://img.clxrity.xyz',
        });
    });

    it('ignores empty or placeholder environment values in favor of JSON', async () => {
        const configPath = await configFile(valid);
        vi.stubEnv('R2_ACCOUNT_ID', 'your-account-id');
        vi.stubEnv('R2_ACCESS_KEY_ID', 'YOUR_ACCESS_KEY');
        vi.stubEnv('R2_SECRET_ACCESS_KEY', 'replace-me');
        vi.stubEnv('R2_BUCKET', '');
        vi.stubEnv('PUBLIC_BASE_URL', 'replace me');
        await expect(loadConfig({ configPath })).resolves.toMatchObject({
            r2AccountId: accountId, r2AccessKeyId: valid.r2AccessKeyId,
            r2SecretAccessKey: valid.r2SecretAccessKey, r2Bucket: valid.r2Bucket,
            publicBaseUrl: 'https://images.example.test',
        });
    });

    it('does not treat placeholders as usable credentials', async () => {
        const configPath = await configFile({ ...valid, r2SecretAccessKey: 'your-secret-key' });
        await expect(loadConfig({ configPath })).rejects.toThrow(/Missing R2 secret access key/);
    });

    it.each([
        ['r2AccountId', /endpoint/i], ['r2AccessKeyId', /access key ID/i],
        ['r2SecretAccessKey', /secret access key/i], ['r2Bucket', /bucket name/i],
    ] as const)('requires %s when no fallback exists', async (field, message) => {
        const configPath = await configFile({ ...valid, [field]: '' });
        await expect(loadConfig({ configPath })).rejects.toThrow(message);
    });

    it('allows missing user config but rejects a missing explicit config', async () => {
        vi.stubEnv('R2_ACCOUNT_ID', accountId);
        vi.stubEnv('R2_ACCESS_KEY_ID', 'synthetic-access');
        vi.stubEnv('R2_SECRET_ACCESS_KEY', 'synthetic-secret');
        vi.stubEnv('R2_BUCKET', 'test-images');
        await expect(loadConfig()).resolves.toMatchObject({ r2Bucket: 'test-images' });
        await expect(loadConfig({ configPath: join(isolation.root, 'missing.json') })).rejects.toThrow(/Config file not found/);
    });

    it.skipIf(process.platform === 'win32').each([0o644, 0o640, 0o604, 0o660])('rejects config permissions %s', async (mode) => {
        const configPath = await configFile(valid, 'readable.json', mode);
        await expect(loadConfig({ configPath })).rejects.toThrow(/must be private.*chmod 600/i);
    });

    it('reports access errors without exposing filesystem error details', async () => {
        const configPath = await configFile(valid);
        isolation.denied = configPath;
        await expect(loadConfig({ configPath })).rejects.toThrow(/Could not access config file.*permissions/);
    });

    it('reports read permission failures without echoing the underlying error', async () => {
        const configPath = await configFile(valid);
        isolation.readDenied = configPath;
        const error = await loadConfig({ configPath }).catch((cause: unknown) => cause);
        expect(error).toBeInstanceOf(ConfigError);
        expect((error as Error).message).toMatch(/permissions and JSON syntax/);
        expect((error as Error).message).not.toContain('synthetic-private-error');
    });

    it('rejects a directory instead of parsing it as JSON', async () => {
        const configPath = join(isolation.root, 'directory');
        await mkdir(configPath, { mode: 0o700 });
        await expect(loadConfig({ configPath })).rejects.toThrow(/regular JSON file/);
    });

    it('never echoes JSON source or parser details on malformed secret-bearing JSON', async () => {
        const configPath = await configFile({});
        const secret = 'synthetic-secret-marker-do-not-echo';
        await writeFile(configPath, `{"r2SecretAccessKey":"${secret}", broken}`);
        const error = await loadConfig({ configPath }).catch((cause: unknown) => cause);
        expect(error).toBeInstanceOf(ConfigError);
        expect((error as Error).message).toMatch(/permissions and JSON syntax/);
        expect((error as Error).message).not.toContain(secret);
        expect((error as Error).message).not.toContain('broken');
    });

    it.each([null, [], 'string', 42, true])('requires an object schema, not %j', async (value) => {
        await expect(loadConfig({ configPath: await configFile(value) })).rejects.toThrow(/JSON object/);
    });

    it.each(['r2AccountId', 'r2Endpoint', 'r2AccessKeyId', 'r2SecretAccessKey', 'r2Bucket', 'publicBaseUrl'])('rejects nonstring %s without echoing values', async (field) => {
        await expect(loadConfig({ configPath: await configFile({ ...valid, [field]: { private: 'synthetic-secret' } }) })).rejects.toThrow('Configuration values must be strings.');
    });

    it.each(['ab', 'A-bucket', '-bucket', 'bucket-', 'bucket.name', 'bucket_name', 'a'.repeat(64)])('rejects invalid bucket %j', async (r2Bucket) => {
        await expect(loadConfig({ configPath: await configFile({ ...valid, r2Bucket }) })).rejects.toThrow(/R2_BUCKET must/);
    });

    it.each(['http://public.example.test', 'https://user:pass@example.test', 'https://example.test/path', 'https://example.test/?x=1', 'https://example.test/#x', 'file:///tmp/config', 'not-a-url'])('rejects unsafe origins %j', async (url) => {
        for (const field of ['r2Endpoint', 'publicBaseUrl']) {
            await expect(loadConfig({ configPath: await configFile({ ...valid, [field]: url }) })).rejects.toThrow(/HTTPS origin/);
        }
    });

    it.each(['http://localhost:9000', 'http://127.0.0.1:9000', 'http://[::1]:9000'])('allows a local HTTP endpoint only: %s', async (r2Endpoint) => {
        await expect(loadConfig({ configPath: await configFile({ ...valid, r2Endpoint }) })).resolves.toMatchObject({ r2Endpoint });
        await expect(loadConfig({ configPath: await configFile({ ...valid, publicBaseUrl: r2Endpoint }) })).rejects.toThrow(/PUBLIC_BASE_URL/);
    });

    it('uses an explicit endpoint without requiring an account ID', async () => {
        await expect(loadConfig({ configPath: await configFile({ ...valid, r2AccountId: '', r2Endpoint: 'https://storage.example.test' }) })).resolves.toMatchObject({ r2Endpoint: 'https://storage.example.test' });
    });

    it('locates the user config exclusively inside the temporary XDG directory', () => {
        expect(getUserConfigPath()).toBe(join(isolation.root, 'clxrity-img', 'config.json'));
    });
});

describe('deriveEndpoint', () => {
    it('accepts only full 32-character hexadecimal Cloudflare account IDs', () => {
        expect(deriveEndpoint(accountId)).toBe(`https://${accountId}.r2.cloudflarestorage.com`);
        expect(deriveEndpoint(accountId.toUpperCase())).toBe(`https://${accountId.toUpperCase()}.r2.cloudflarestorage.com`);
        expect(deriveEndpoint()).toBeUndefined();
        expect(deriveEndpoint('')).toBeUndefined();
    });

    it.each(['account', 'your-account-id', 'replace-me', 'a'.repeat(31), 'a'.repeat(33), 'g'.repeat(32), ` ${accountId}`, `${accountId}/`])('rejects invalid account IDs: %j', (value) => {
        expect(() => deriveEndpoint(value)).toThrow(ConfigError);
    });
});