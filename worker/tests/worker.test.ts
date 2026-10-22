import { describe, expect, it } from 'vitest';
import { EMBED_METADATA_KEY, encodeEmbedMetadata, type EmbedRecord } from '../../src/embeds.js';
import { handleRequest, type Env, type R2HeadResult, type ReadonlyMediaBucket } from '../src/index.js';

class FakeBucket implements ReadonlyMediaBucket {
    readonly calls: string[] = [];
    private readonly heads = new Map<string, R2HeadResult | null>();
    private readonly throwKeys = new Set<string>();

    setHead(key: string, head: R2HeadResult | null): void {
        this.heads.set(key, head);
    }

    throwOnHead(key: string): void {
        this.throwKeys.add(key);
    }

    async head(key: string): Promise<R2HeadResult | null> {
        this.calls.push(key);
        if (this.throwKeys.has(key)) throw new Error('private stack/path should never leak');
        return this.heads.get(key) ?? null;
    }
}

function makeEnv(bucket: ReadonlyMediaBucket, publicBaseUrl = 'https://img.clxrity.xyz'): Env {
    return {
        MEDIA_BUCKET: bucket,
        PUBLIC_BASE_URL: publicBaseUrl,
    };
}

function request(path: string, method = 'GET'): Request {
    return new Request(`https://attacker.example${path}`, { method });
}

function makeEmbed(record: EmbedRecord): string {
    return encodeEmbedMetadata(record)[EMBED_METADATA_KEY] ?? '';
}

describe('preview worker', () => {
    it('renders a rich image preview and escapes untrusted content', async () => {
        const bucket = new FakeBucket();
        const key = 'a1b2c3.jpg';
        bucket.setHead(key, {
            key,
            httpMetadata: { contentType: 'image/jpeg' },
            customMetadata: {
                [EMBED_METADATA_KEY]: makeEmbed({
                    version: 1,
                    kind: 'image',
                    color: '#FF7F50',
                    title: 'Title <unsafe> "quotes" 你好',
                    description: 'Desc with <b>tag</b> & symbols',
                    width: 640,
                    height: 480,
                }),
                'upload-id': 'secret-source-info',
            },
        });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
        expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(body).toContain('<meta property="og:image" content="https://img.clxrity.xyz/a1b2c3.jpg">');
        expect(body).toContain('<meta property="og:image:type" content="image/jpeg">');
        expect(body).toContain('<meta property="og:image:width" content="640">');
        expect(body).toContain('<meta property="og:image:height" content="480">');
        expect(body).toContain('<meta name="theme-color" content="#FF7F50">');
        expect(body).toContain('Title &lt;unsafe&gt; &quot;quotes&quot; 你好');
        expect(body).toContain('Desc with &lt;b&gt;tag&lt;/b&gt; &amp; symbols');
        expect(body).not.toContain('<script>');
        expect(body).not.toContain('secret-source-info');
    });

    it('renders a rich video preview with poster and OG video tags', async () => {
        const bucket = new FakeBucket();
        const key = 'deadbeef.mp4';
        const posterKey = '_previews/01234567-89ab-cdef-0123-456789abcdef.jpg';
        bucket.setHead(key, {
            key,
            customMetadata: {
                [EMBED_METADATA_KEY]: makeEmbed({
                    version: 1,
                    kind: 'video',
                    color: '#5865F2',
                    title: 'Video preview',
                    description: 'Watch me',
                    width: 1920,
                    height: 1080,
                    duration: 12.3,
                    posterKey,
                }),
            },
        });
        bucket.setHead(posterKey, { key: posterKey, httpMetadata: { contentType: 'image/jpeg' } });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<video src="https://img.clxrity.xyz/deadbeef.mp4" controls playsinline preload="metadata" poster="https://img.clxrity.xyz/_previews/01234567-89ab-cdef-0123-456789abcdef.jpg"></video>');
        expect(body).toContain('<meta property="og:video" content="https://img.clxrity.xyz/deadbeef.mp4">');
        expect(body).toContain('<meta property="og:video:type" content="video/mp4">');
        expect(body).toContain('<meta property="og:video:width" content="1920">');
        expect(body).toContain('<meta property="og:video:height" content="1080">');
        expect(body).toContain('<meta property="og:image" content="https://img.clxrity.xyz/_previews/01234567-89ab-cdef-0123-456789abcdef.jpg">');
        expect(body).toContain('<meta name="twitter:card" content="summary_large_image">');
        expect(bucket.calls).toEqual([key, posterKey]);
    });

    it('omits theme color and OG title/description when metadata has empty text and null color', async () => {
        const bucket = new FakeBucket();
        const key = 'null-style.png';
        bucket.setHead(key, {
            key,
            customMetadata: {
                [EMBED_METADATA_KEY]: makeEmbed({
                    version: 1,
                    kind: 'image',
                    color: null,
                    title: '',
                    description: '',
                    width: 300,
                    height: 200,
                }),
            },
        });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<title>Media preview</title>');
        expect(body).not.toContain('theme-color');
        expect(body).not.toContain('og:title');
        expect(body).not.toContain('og:description');
    });

    it('keeps direct raw routes outside /s/ unhandled as 404', async () => {
        const bucket = new FakeBucket();
        const response = await handleRequest(request('/raw.jpg'), makeEnv(bucket));

        expect(response.status).toBe(404);
        expect(bucket.calls).toEqual([]);
    });

    it('supports legacy image objects with no embed metadata', async () => {
        const bucket = new FakeBucket();
        const key = 'legacy.gif';
        bucket.setHead(key, { key });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<img src="https://img.clxrity.xyz/legacy.gif" alt="">');
        expect(body).toContain('<meta property="og:image" content="https://img.clxrity.xyz/legacy.gif">');
        expect(body).not.toContain('og:title');
        expect(body).not.toContain('og:description');
    });

    it('supports legacy videos with minimal preview when metadata is absent', async () => {
        const bucket = new FakeBucket();
        const key = 'legacy.mp4';
        bucket.setHead(key, { key });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<video src="https://img.clxrity.xyz/legacy.mp4" controls playsinline preload="metadata"></video>');
        expect(body).toContain('<meta property="og:video" content="https://img.clxrity.xyz/legacy.mp4">');
        expect(body).not.toContain(' poster="');
    });

    it('rejects malformed stored metadata with 422', async () => {
        const bucket = new FakeBucket();
        const key = 'bad.jpg';
        bucket.setHead(key, {
            key,
            customMetadata: {
                [EMBED_METADATA_KEY]: '!!!invalid!!!',
            },
        });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(422);
        expect(body).toBe('Unprocessable Metadata');
    });

    it('rejects metadata key/type mismatch with 422', async () => {
        const bucket = new FakeBucket();
        const key = 'mismatch.mp4';
        bucket.setHead(key, {
            key,
            customMetadata: {
                [EMBED_METADATA_KEY]: makeEmbed({
                    version: 1,
                    kind: 'image',
                    color: '#FFFFFF',
                    title: '',
                    description: '',
                    width: 1,
                    height: 1,
                }),
            },
        });

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        expect(response.status).toBe(422);
    });

    it('returns safe 500 responses on unexpected exceptions', async () => {
        const bucket = new FakeBucket();
        const key = 'explode.jpg';
        bucket.throwOnHead(key);

        const response = await handleRequest(request(`/s/${key}`), makeEnv(bucket));
        const body = await response.text();

        expect(response.status).toBe(500);
        expect(body).toBe('Internal Server Error');
        expect(body).not.toContain('private stack/path');
    });

    it('returns GET-equivalent headers for HEAD with an empty body', async () => {
        const bucket = new FakeBucket();
        const key = 'head-check.jpg';
        bucket.setHead(key, { key });

        const getResponse = await handleRequest(request(`/s/${key}`, 'GET'), makeEnv(bucket));
        const headResponse = await handleRequest(request(`/s/${key}`, 'HEAD'), makeEnv(bucket));

        expect(headResponse.status).toBe(getResponse.status);
        expect(headResponse.headers.get('content-type')).toBe(getResponse.headers.get('content-type'));
        expect(headResponse.headers.get('content-security-policy')).toBe(getResponse.headers.get('content-security-policy'));
        expect(await headResponse.text()).toBe('');
    });

    it('returns 405 with Allow header for non-GET/HEAD methods', async () => {
        const bucket = new FakeBucket();
        const response = await handleRequest(request('/s/some.jpg', 'POST'), makeEnv(bucket));

        expect(response.status).toBe(405);
        expect(response.headers.get('allow')).toBe('GET,HEAD');
    });

    it('rejects traversal and encoded slash paths after one decode pass', async () => {
        const bucket = new FakeBucket();
        const response = await handleRequest(request('/s/%2e%2e%2Fsecret.jpg'), makeEnv(bucket));

        expect(response.status).toBe(404);
        expect(bucket.calls).toEqual([]);
    });

    it('returns 500 when PUBLIC_BASE_URL is missing or non-canonical https origin', async () => {
        const bucket = new FakeBucket();
        const key = 'ok.jpg';
        bucket.setHead(key, { key });

        const insecure = await handleRequest(request(`/s/${key}`), makeEnv(bucket, 'http://img.clxrity.xyz'));
        const withPath = await handleRequest(request(`/s/${key}`), makeEnv(bucket, 'https://img.clxrity.xyz/path'));
        const missing = await handleRequest(request(`/s/${key}`), { MEDIA_BUCKET: bucket });

        expect(insecure.status).toBe(500);
        expect(withPath.status).toBe(500);
        expect(missing.status).toBe(500);
    });

    it('returns 404 for invalid or missing keys', async () => {
        const bucket = new FakeBucket();

        const missing = await handleRequest(request('/s/'), makeEnv(bucket));
        const invalid = await handleRequest(request('/s/not-supported.txt'), makeEnv(bucket));
        const absent = await handleRequest(request('/s/absent.jpg'), makeEnv(bucket));

        expect(missing.status).toBe(404);
        expect(invalid.status).toBe(404);
        expect(absent.status).toBe(404);
    });
});