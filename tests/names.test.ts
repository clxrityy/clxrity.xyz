import { describe, expect, it } from 'vitest';

import { UsageError } from '../src/errors.js';
import {
    buildPublicUrl,
    createGeneratedKey,
    createRandomId,
    isImageKey,
    normalizeExistingKey,
    normalizeOutputExtension,
    normalizeRequestedName,
    resolveIdentifierFromKeys,
    validateIdentifier,
} from '../src/names.js';

describe('name helpers', () => {
    it('normalizes custom names to the final extension', () => {
        expect(normalizeRequestedName('sunset.jpeg', 'png')).toBe('sunset.png');
        expect(normalizeRequestedName('sunset', 'jpg')).toBe('sunset.jpg');
    });

    it('creates a random generated key with the expected extension', () => {
        const key = createGeneratedKey('gif');
        expect(key).toMatch(/^[A-Za-z0-9]{8}\.gif$/);
    });

    it('normalizes an exact filename identifier', () => {
        expect(normalizeExistingKey('photo.jpeg')).toBe('photo.jpg');
    });

    it('resolves a stem to matching output extensions only', () => {
        expect(resolveIdentifierFromKeys('clip', ['clip.gif', 'clip.webp', 'clip.png'])).toEqual(['clip.gif', 'clip.png']);
    });

    it('builds public URLs without double slashes', () => {
        expect(buildPublicUrl('https://img.clxrity.xyz', 'clip.png')).toBe('https://img.clxrity.xyz/clip.png');
    });

    it('generates eight alphanumeric characters by default', () => {
        for (let index = 0; index < 32; index += 1) {
            expect(createRandomId()).toMatch(/^[A-Za-z0-9]{8}$/);
        }
        expect(createRandomId(16)).toMatch(/^[A-Za-z0-9]{16}$/);
    });

    it.each(['jpg', 'png', 'gif'] as const)('matches generated and custom extensions to %s', (extension) => {
        expect(createGeneratedKey(extension)).toMatch(new RegExp(`^[A-Za-z0-9]{8}\\.${extension}$`));
        for (const suffix of ['JPEG', 'png', 'gif', 'WebP', 'avif', 'svg', 'tif', 'heic']) {
            expect(normalizeRequestedName(`Photo_1-test.${suffix}`, extension)).toBe(`Photo_1-test.${extension}`);
        }
    });

    it.each([
        '', ' ', ' padded', 'padded ', 'two words', 'line\nbreak', 'tab\tname',
        '../photo', 'folder/photo', 'folder\\photo', '/photo', '.photo', 'photo.',
        'photo.tar.png', 'photo.txt', 'photo.xyz', 'photo%20', 'photo?', 'photo#',
        'photo:', 'photo&', 'photo!', 'photo@', 'photo\u0000', 'café', 'a'.repeat(121),
    ])('rejects unsafe or unknown custom names: %j', (name) => {
        expect(() => normalizeRequestedName(name, 'png')).toThrow(UsageError);
    });

    it('accepts the custom name length boundary without silently truncating', () => {
        expect(normalizeRequestedName('a'.repeat(120), 'jpg')).toBe(`${'a'.repeat(120)}.jpg`);
    });

    it.each(['', 'photo', '.jpg', 'photo.', 'photo.webp', '../photo.png', 'two words.jpg', 'a.b.png'])('rejects invalid exact identifiers: %j', (key) => {
        expect(() => normalizeExistingKey(key)).toThrow(UsageError);
    });

    it('normalizes supported case and JPEG aliases only', () => {
        expect(normalizeExistingKey('Photo.JPEG')).toBe('Photo.jpg');
        expect(normalizeExistingKey('Photo.PNG')).toBe('Photo.png');
        expect(normalizeOutputExtension('GIF')).toBe('gif');
        expect(() => normalizeOutputExtension('webp')).toThrow(UsageError);
    });

    it('keeps exact matches separate from ambiguous stems and prefix lookalikes', () => {
        const keys = ['clip.gif', 'clip.png', 'clip.jpg', 'clip.webp', 'clip2.png', 'clip.extra.png', 'Clip.png'];
        const original = [...keys];
        expect(resolveIdentifierFromKeys('clip', keys)).toEqual(['clip.gif', 'clip.png', 'clip.jpg']);
        expect(resolveIdentifierFromKeys('clip.JPEG', keys)).toEqual(['clip.jpg']);
        expect(resolveIdentifierFromKeys('clip.png', keys)).toEqual(['clip.png']);
        expect(resolveIdentifierFromKeys('missing', keys)).toEqual([]);
        expect(keys).toEqual(original);
    });

    it.each(['', '../clip', 'clip/path', 'clip%20', 'clip name', 'clip.webp'])('rejects invalid lookup identifiers: %j', (identifier) => {
        expect(() => validateIdentifier(identifier)).toThrow(UsageError);
        expect(() => resolveIdentifierFromKeys(identifier, [])).toThrow(UsageError);
    });

    it('recognizes only safe, canonical hosted image keys', () => {
        for (const key of ['photo.jpg', 'Photo_1-test.png', 'clip.gif']) {
            expect(isImageKey(key)).toBe(true);
            expect(() => validateIdentifier(key)).not.toThrow();
        }
        for (const key of ['photo.jpeg', 'photo.PNG', 'photo.webp', 'folder/photo.png', '.png', 'photo.png?x', 'a.b.png']) {
            expect(isImageKey(key)).toBe(false);
        }
    });

    it('encodes keys as one URL segment with or without a trailing base slash', () => {
        for (const base of ['https://images.example.test', 'https://images.example.test/']) {
            expect(buildPublicUrl(base, 'photo.png')).toBe('https://images.example.test/photo.png');
            expect(buildPublicUrl(base, 'a b/#?%.png')).toBe('https://images.example.test/a%20b%2F%23%3F%25.png');
        }
    });
});
