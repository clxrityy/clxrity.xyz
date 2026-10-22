import { randomInt } from 'node:crypto';

import { UsageError } from './errors.js';
import { isPosterKey, MEDIA_EXTENSIONS, type MediaExtension } from './media-types.js';

export const OUTPUT_EXTENSIONS = ['jpg', 'png', 'gif'] as const;
export type OutputExtension = (typeof OUTPUT_EXTENSIONS)[number];

export const MIME_TYPES: Record<OutputExtension, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
};

const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SAFE_STEM_PATTERN = /^[A-Za-z0-9_-]+$/;
const INPUT_EXTENSIONS = /^(jpe?g|png|gif|webp|avif|svg|tiff?|hei[cf]|bmp|ico|psd|raw|mov|mp4)$/i;

export function normalizeOutputExtension(value: string): OutputExtension {
    const lower = value.toLowerCase();
    if (lower === 'jpeg' || lower === 'jpg') {
        return 'jpg';
    }

    if (lower === 'png' || lower === 'gif') {
        return lower;
    }

    throw new UsageError(`Unsupported output extension \"${value}\".`);
}

export function createRandomId(length = 8): string {
    let output = '';
    for (let index = 0; index < length; index += 1) {
        output += RANDOM_ALPHABET[randomInt(RANDOM_ALPHABET.length)];
    }
    return output;
}

export function createGeneratedKey(extension: MediaExtension): string {
    return `${createRandomId()}.${extension}`;
}

export function normalizeRequestedName(requestedName: string, outputExtension: MediaExtension): string {
    if (requestedName.trim() !== requestedName || requestedName.length === 0) {
        throw new UsageError('Media names cannot be empty or padded with whitespace.');
    }

    if (requestedName.length > 120) {
        throw new UsageError('Media names must be 120 characters or fewer.');
    }

    if (/[\\/\s%?#:&]/.test(requestedName)) {
        throw new UsageError('Media names may only contain letters, numbers, underscores, hyphens, and an optional extension.');
    }

    const lastDot = requestedName.lastIndexOf('.');
    const stem = lastDot === -1 ? requestedName : requestedName.slice(0, lastDot);

    if (lastDot !== -1 && !INPUT_EXTENSIONS.test(requestedName.slice(lastDot + 1))) {
        throw new UsageError('A custom filename must have a recognized image/video extension, or no extension.');
    }

    if (!SAFE_STEM_PATTERN.test(stem)) {
        throw new UsageError('Media names may only contain letters, numbers, underscores, and hyphens.');
    }

    return `${stem}.${outputExtension}`;
}

export function normalizeExistingKey(key: string): string {
    const lastDot = key.lastIndexOf('.');
    if (lastDot <= 0 || lastDot === key.length - 1) {
        throw new UsageError('Media identifiers must include a filename extension such as .jpg, .png, .gif, or .mp4.');
    }

    const stem = key.slice(0, lastDot);
    const extension = key.slice(lastDot + 1);

    if (!SAFE_STEM_PATTERN.test(stem)) {
        throw new UsageError('Media identifiers may only contain letters, numbers, underscores, and hyphens.');
    }

    return `${stem}.${extension.toLowerCase() === 'mp4' ? 'mp4' : normalizeOutputExtension(extension)}`;
}

export function buildPublicUrl(baseUrl: string, key: string): string {
    const path = isPosterKey(key) ? key.split('/').map(encodeURIComponent).join('/') : encodeURIComponent(key);
    return new URL(path, `${baseUrl.replace(/\/$/, '')}/`).toString();
}

export function buildShareUrl(baseUrl: string, key: string): string {
    return new URL(`s/${encodeURIComponent(key)}`, `${baseUrl.replace(/\/$/, '')}/`).toString();
}

export function isImageKey(key: string): boolean {
    return /^[A-Za-z0-9_-]+\.(jpg|png|gif)$/.test(key);
}

export function validateIdentifier(identifier: string): void {
    if (identifier.includes('.')) {
        normalizeExistingKey(identifier);
    } else if (!SAFE_STEM_PATTERN.test(identifier)) {
        throw new UsageError('Media IDs may only contain letters, numbers, underscores, and hyphens.');
    }
}

export function resolveIdentifierFromKeys(identifier: string, keys: string[]): string[] {
    if (identifier.includes('.')) {
        const normalized = normalizeExistingKey(identifier);
        return keys.filter((key) => key === normalized);
    }

    if (!SAFE_STEM_PATTERN.test(identifier)) {
        throw new UsageError('Media IDs may only contain letters, numbers, underscores, and hyphens.');
    }

    return keys.filter((key) => key.startsWith(`${identifier}.`) && MEDIA_EXTENSIONS.some((extension) => key === `${identifier}.${extension}`));
}
