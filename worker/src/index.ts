import { decodeEmbedMetadata, EMBED_METADATA_KEY } from '../../src/embeds.js';
import { MEDIA_MIME_TYPES, isMediaKey, isPosterKey, type MediaExtension } from '../../src/media-types.js';

export interface R2HeadResult {
    readonly key: string;
    readonly httpMetadata?: {
        readonly contentType?: string;
    };
    readonly customMetadata?: Readonly<Record<string, string>>;
}

export interface ReadonlyMediaBucket {
    head(key: string): Promise<R2HeadResult | null>;
}

export interface Env {
    readonly MEDIA_BUCKET?: ReadonlyMediaBucket;
    readonly PUBLIC_BASE_URL?: string;
}

interface PreviewData {
    readonly kind: 'image' | 'video';
    readonly color: string | null;
    readonly title: string;
    readonly description: string;
    readonly width?: number;
    readonly height?: number;
    readonly duration?: number;
    readonly posterKey?: string;
}

const SHARE_PREFIX = '/s/';
const ALLOW_HEADER = 'GET,HEAD';
const STATIC_STYLE = [
    ':root { color-scheme: light dark; }',
    '* { box-sizing: border-box; }',
    'body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #0b0d12; color: #f5f7ff; }',
    'main { max-width: 920px; margin: 0 auto; padding: 2rem 1rem 3rem; }',
    'h1 { margin: 0 0 1rem; font-size: 1.4rem; line-height: 1.3; }',
    'p { margin: 0 0 1rem; line-height: 1.5; }',
    'figure { margin: 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05); }',
    'img, video { display: block; width: 100%; max-height: 75vh; object-fit: contain; background: #000; }',
    '.links { margin-top: 1rem; }',
    'a { color: #8ab4ff; }',
    'a:hover { color: #b9d0ff; }',
].join('');

const CONTENT_SECURITY_POLICY = "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export default {
    fetch(request: Request, env: Env): Promise<Response> {
        return handleRequest(request, env);
    },
};

export async function handleRequest(request: Request, env: Env): Promise<Response> {
    const headOnly = request.method === 'HEAD';
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return createTextResponse(405, 'Method Not Allowed', headOnly, { Allow: ALLOW_HEADER });
    }

    const origin = parsePublicBaseUrl(env.PUBLIC_BASE_URL);
    if (!origin) return createTextResponse(500, 'Internal Server Error', headOnly);

    if (!env.MEDIA_BUCKET) return createTextResponse(500, 'Internal Server Error', headOnly);

    const path = new URL(request.url).pathname;
    const key = extractCanonicalKey(path);
    if (!key || !isMediaKey(key)) return createTextResponse(404, 'Not Found', headOnly);

    const mediaKind = kindFromKey(key);

    try {
        const objectHead = await env.MEDIA_BUCKET.head(key);
        if (!objectHead) return createTextResponse(404, 'Not Found', headOnly);

        const hasEmbedMetadata = Object.prototype.hasOwnProperty.call(objectHead.customMetadata ?? {}, EMBED_METADATA_KEY);
        let preview: PreviewData = { kind: mediaKind, color: null, title: '', description: '' };

        if (hasEmbedMetadata) {
            let decoded;
            try {
                decoded = decodeEmbedMetadata(objectHead.customMetadata);
            } catch {
                return createTextResponse(422, 'Unprocessable Metadata', headOnly);
            }

            if (!decoded || decoded.kind !== mediaKind) {
                return createTextResponse(422, 'Unprocessable Metadata', headOnly);
            }

            preview = {
                kind: decoded.kind,
                color: decoded.color,
                title: decoded.title,
                description: decoded.description,
                width: decoded.width,
                height: decoded.height,
                ...(decoded.duration !== undefined ? { duration: decoded.duration } : {}),
                ...(decoded.posterKey !== undefined ? { posterKey: decoded.posterKey } : {}),
            };
        }

        let posterUrl: string | undefined;
        if (preview.kind === 'video' && preview.posterKey && isPosterKey(preview.posterKey)) {
            const posterHead = await env.MEDIA_BUCKET.head(preview.posterKey);
            if (posterHead) posterUrl = `${origin}/${preview.posterKey}`;
        }

        const html = renderPreviewHtml({
            key,
            origin,
            mediaMime: mimeFromKey(key),
            preview,
            ...(posterUrl ? { posterUrl } : {}),
        });

        return createHtmlResponse(200, html, headOnly);
    } catch {
        return createTextResponse(500, 'Internal Server Error', headOnly);
    }
}

function extractCanonicalKey(pathname: string): string | null {
    if (!pathname.startsWith(SHARE_PREFIX)) return null;
    const encoded = pathname.slice(SHARE_PREFIX.length);
    if (!encoded || encoded.includes('/')) return null;

    let decoded: string;
    try {
        decoded = decodeURIComponent(encoded);
    } catch {
        return null;
    }

    if (!decoded || decoded.includes('/') || decoded.includes('\\') || decoded.includes('..')) return null;
    return decoded;
}

function parsePublicBaseUrl(value: string | undefined): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;

    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:') return null;
        if (parsed.username || parsed.password) return null;
        if (parsed.pathname !== '/' && parsed.pathname !== '') return null;
        if (parsed.search || parsed.hash) return null;
        return parsed.origin;
    } catch {
        return null;
    }
}

function kindFromKey(key: string): 'image' | 'video' {
    return key.endsWith('.mp4') ? 'video' : 'image';
}

function mimeFromKey(key: string): string {
    const extension = key.slice(key.lastIndexOf('.') + 1) as MediaExtension;
    return MEDIA_MIME_TYPES[extension] ?? 'application/octet-stream';
}

function renderPreviewHtml(input: {
    key: string;
    origin: string;
    mediaMime: string;
    preview: PreviewData;
    posterUrl?: string;
}): string {
    const rawUrl = `${input.origin}/${input.key}`;
    const shareUrl = `${input.origin}${SHARE_PREFIX}${input.key}`;
    const browserTitle = input.preview.title.trim() !== '' ? input.preview.title : 'Media preview';

    const metadata: string[] = [
        `<meta property="og:url" content="${escapeHtml(shareUrl)}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
    ];

    if (input.preview.color && /^#[A-F0-9]{6}$/.test(input.preview.color)) {
        metadata.push(`<meta name="theme-color" content="${escapeHtml(input.preview.color)}">`);
    }

    if (input.preview.title.trim() !== '') {
        const escapedTitle = escapeHtml(input.preview.title);
        metadata.push(`<meta property="og:title" content="${escapedTitle}">`);
        metadata.push(`<meta name="twitter:title" content="${escapedTitle}">`);
    }

    if (input.preview.description.trim() !== '') {
        const escapedDescription = escapeHtml(input.preview.description);
        metadata.push(`<meta property="og:description" content="${escapedDescription}">`);
        metadata.push(`<meta name="twitter:description" content="${escapedDescription}">`);
    }

    if (input.preview.kind === 'image') {
        metadata.push('<meta property="og:type" content="website">');
        metadata.push(`<meta property="og:image" content="${escapeHtml(rawUrl)}">`);
        metadata.push(`<meta property="og:image:type" content="${escapeHtml(input.mediaMime)}">`);
        metadata.push(`<meta name="twitter:image" content="${escapeHtml(rawUrl)}">`);
        if (input.preview.width && input.preview.height) {
            metadata.push(`<meta property="og:image:width" content="${String(input.preview.width)}">`);
            metadata.push(`<meta property="og:image:height" content="${String(input.preview.height)}">`);
        }
    } else {
        metadata.push('<meta property="og:type" content="video.other">');
        metadata.push(`<meta property="og:video" content="${escapeHtml(rawUrl)}">`);
        metadata.push(`<meta property="og:video:type" content="${escapeHtml(input.mediaMime)}">`);
        if (input.preview.width && input.preview.height) {
            metadata.push(`<meta property="og:video:width" content="${String(input.preview.width)}">`);
            metadata.push(`<meta property="og:video:height" content="${String(input.preview.height)}">`);
        }
        if (input.posterUrl) {
            metadata.push(`<meta property="og:image" content="${escapeHtml(input.posterUrl)}">`);
            metadata.push('<meta property="og:image:type" content="image/jpeg">');
            metadata.push(`<meta name="twitter:image" content="${escapeHtml(input.posterUrl)}">`);
        }
    }

    const mediaElement = input.preview.kind === 'image'
        ? `<img src="${escapeHtml(rawUrl)}" alt="">`
        : `<video src="${escapeHtml(rawUrl)}" controls playsinline preload="metadata"${input.posterUrl ? ` poster="${escapeHtml(input.posterUrl)}"` : ''}></video>`;

    const heading = input.preview.title.trim() !== '' ? `<h1>${escapeHtml(input.preview.title)}</h1>` : '<h1>Media preview</h1>';
    const description = input.preview.description.trim() !== '' ? `<p>${escapeHtml(input.preview.description)}</p>` : '';

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${escapeHtml(browserTitle)}</title>`,
        `<link rel="canonical" href="${escapeHtml(shareUrl)}">`,
        ...metadata,
        `<style>${STATIC_STYLE}${input.preview.color ? `figure { border-color: ${input.preview.color}; }` : ''}</style>`,
        '</head>',
        '<body>',
        '<main>',
        heading,
        description,
        `<figure>${mediaElement}</figure>`,
        '<p class="links">',
        `<a href="${escapeHtml(rawUrl)}">Open raw media</a>`,
        input.posterUrl ? ` · <a href="${escapeHtml(input.posterUrl)}">Open poster</a>` : '',
        '</p>',
        '</main>',
        '</body>',
        '</html>',
    ].join('');
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createHtmlResponse(status: number, html: string, headOnly: boolean): Response {
    return createResponse(status, html, 'text/html; charset=utf-8', headOnly);
}

function createTextResponse(status: number, body: string, headOnly: boolean, extraHeaders?: Readonly<Record<string, string>>): Response {
    return createResponse(status, body, 'text/plain; charset=utf-8', headOnly, extraHeaders);
}

function createResponse(status: number, body: string, contentType: string, headOnly: boolean, extraHeaders?: Readonly<Record<string, string>>): Response {
    const headers = new Headers(extraHeaders);
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    return new Response(headOnly ? null : body, { status, headers });
}