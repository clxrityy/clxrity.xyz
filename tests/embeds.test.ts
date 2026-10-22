import { describe, expect, it } from 'vitest';

import {
    assertMetadataBudget,
    decodeEmbedMetadata,
    DEFAULT_EMBED_STYLE,
    EMBED_METADATA_KEY,
    encodeEmbedMetadata,
    MAX_METADATA_BYTES,
    normalizeColor,
    resolveEmbedStyle,
    validateEmbedText,
    type EmbedRecord,
} from '../src/embeds.js';
import { UsageError } from '../src/errors.js';

function toBase64UrlJson(value: unknown): string {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function expectDecodeFailure(record: unknown): void {
    const metadata = { [EMBED_METADATA_KEY]: toBase64UrlJson(record) };
    expect(() => decodeEmbedMetadata(metadata)).toThrow(UsageError);
}

describe('normalizeColor', () => {
    it('accepts named CSS colors, blurple alias, hex colors, transparent, and surrounding whitespace', () => {
        expect(normalizeColor(' coral ')).toBe('#FF7F50');
        expect(normalizeColor('BLURPLE')).toBe('#5865F2');
        expect(normalizeColor(' #0fA ')).toBe('#00FFAA');
        expect(normalizeColor(' #aBcDeF ')).toBe('#ABCDEF');
        expect(normalizeColor('transparent')).toBeNull();
        expect(normalizeColor('   ')).toBeNull();
        expect(normalizeColor(null)).toBeNull();
    });

    it.each([
        '__proto__',
        'constructor',
        'rgb(255, 127, 80)',
        'hsl(10, 50%, 50%)',
        'var(--brand-color)',
        'url(javascript:alert(1))',
    ])('rejects unsupported or unsafe color input: %s', (value) => {
        expect(() => normalizeColor(value)).toThrow(UsageError);
    });
});

describe('validateEmbedText', () => {
    it('enforces UTF-8 byte budgets while allowing normal printable content (including HTML-like tags)', () => {
        const title = '🙂'.repeat(64);
        const description = '🙂'.repeat(192);
        expect(new TextEncoder().encode(title).byteLength).toBe(256);
        expect(new TextEncoder().encode(description).byteLength).toBe(768);

        expect(validateEmbedText(title, 'title')).toBe(title);
        expect(validateEmbedText(description, 'description')).toBe(description);
        expect(validateEmbedText('<b>safe for later escaping</b>', 'title')).toBe('<b>safe for later escaping</b>');
    });

    it('rejects text over limits or containing disallowed control characters', () => {
        expect(() => validateEmbedText('🙂'.repeat(65), 'title')).toThrow(/256 UTF-8 bytes or fewer/);
        expect(() => validateEmbedText('🙂'.repeat(193), 'description')).toThrow(/768 UTF-8 bytes or fewer/);
        expect(() => validateEmbedText('ok\u0007bad', 'description')).toThrow(/no control characters/);
    });
});

describe('resolveEmbedStyle', () => {
    it('uses defaults when flags are omitted and does not mutate the defaults object', () => {
        const defaults = { color: 'coral', title: 'Default title', description: 'Default description' };
        const snapshot = { ...defaults };

        expect(resolveEmbedStyle(defaults)).toEqual({
            color: '#FF7F50',
            title: 'Default title',
            description: 'Default description',
        });
        expect(resolveEmbedStyle()).toEqual(DEFAULT_EMBED_STYLE);
        expect(defaults).toEqual(snapshot);
    });

    it('handles bare flags: color=true clears color, title can be empty, description=true clears description', () => {
        const defaults = { color: '#5865F2', title: 'Original title', description: 'Original description' };
        const snapshot = { ...defaults };

        expect(resolveEmbedStyle(defaults, { color: true, title: '', description: true })).toEqual({
            color: null,
            title: '',
            description: '',
        });
        expect(defaults).toEqual(snapshot);
    });
});

describe('embed metadata encoding/decoding', () => {
    const imageRecord: EmbedRecord = {
        version: 1,
        kind: 'image',
        color: '#5865F2',
        title: '晴れ 🌤️ image',
        description: 'Résumé — Δοκιμή',
        width: 1920,
        height: 1080,
    };

    const videoRecord: EmbedRecord = {
        version: 1,
        kind: 'video',
        color: null,
        title: '動画タイトル 🎬',
        description: 'Vídeo com descrição unicode',
        width: 1280,
        height: 720,
        duration: 12.5,
        posterKey: '_previews/01234567-89ab-cdef-0123-456789abcdef.jpg',
    };

    it('round-trips image and video metadata using base64url-safe payloads', () => {
        const imageMetadata = encodeEmbedMetadata(imageRecord);
        const imageEncoded = imageMetadata[EMBED_METADATA_KEY];
        expect(imageEncoded).toBeDefined();
        if (imageEncoded === undefined) throw new Error('Missing embed metadata value for image record');
        expect(imageEncoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(decodeEmbedMetadata(imageMetadata)).toEqual(imageRecord);

        const videoMetadata = encodeEmbedMetadata(videoRecord);
        const videoEncoded = videoMetadata[EMBED_METADATA_KEY];
        expect(videoEncoded).toBeDefined();
        if (videoEncoded === undefined) throw new Error('Missing embed metadata value for video record');
        expect(videoEncoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(decodeEmbedMetadata(videoMetadata)).toEqual(videoRecord);
    });

    it('returns undefined when embed metadata is absent and throws when present but invalid', () => {
        expect(decodeEmbedMetadata(undefined)).toBeUndefined();
        expect(decodeEmbedMetadata({})).toBeUndefined();
        expect(() => decodeEmbedMetadata({ [EMBED_METADATA_KEY]: '***' })).toThrow(UsageError);
    });

    it('rejects malformed records (dimensions/version/kind/extraneous properties/unsafe poster)', () => {
        expectDecodeFailure({ ...imageRecord, version: 2 });
        expectDecodeFailure({ ...imageRecord, kind: 'gif' });
        expectDecodeFailure({ ...imageRecord, width: 0 });
        expectDecodeFailure({ ...imageRecord, height: 100_000_001 });
        expectDecodeFailure({ ...imageRecord, unexpected: true });
        expectDecodeFailure({ ...videoRecord, posterKey: '../unsafe.jpg' });
        expectDecodeFailure({ ...imageRecord, duration: 5, posterKey: videoRecord.posterKey });
    });

    it('enforces aggregate metadata budget and preserves reserved upload-id budget for encoded payloads', () => {
        const exact = { a: 'x'.repeat(MAX_METADATA_BYTES - 1) };
        expect(() => assertMetadataBudget(exact)).not.toThrow();
        expect(() => assertMetadataBudget({ a: 'x'.repeat(MAX_METADATA_BYTES) })).toThrow(/2048-byte safety limit/);

        const metadata = encodeEmbedMetadata(videoRecord);
        expect(() => assertMetadataBudget({
            ...metadata,
            'upload-id': '00000000-0000-0000-0000-000000000000',
        })).not.toThrow();
    });
});