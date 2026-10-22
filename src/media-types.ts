// Runtime-neutral contracts shared by the Node CLI and the preview Worker.
export const IMAGE_EXTENSIONS = ['jpg', 'png', 'gif'] as const;
export const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, 'mp4'] as const;
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];
export type MediaExtension = (typeof MEDIA_EXTENSIONS)[number];

export const MEDIA_MIME_TYPES: Record<MediaExtension, string> = {
    jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', mp4: 'video/mp4',
};

export function isMediaKey(key: string): boolean {
    return /^[A-Za-z0-9_-]+\.(jpg|png|gif|mp4)$/.test(key) && key.length <= 124;
}

export function isPosterKey(key: string): boolean {
    return /^_previews\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.jpg$/.test(key);
}

export interface VideoLimits {
    readonly maxBytes: number;
    readonly maxDurationSeconds: number;
    readonly timeoutSeconds: number;
}

export const DEFAULT_VIDEO_LIMITS: VideoLimits = {
    maxBytes: 100 * 1024 * 1024,
    maxDurationSeconds: 600,
    timeoutSeconds: 600,
};

export interface ProcessedMedia {
    readonly kind: 'image' | 'video';
    readonly inputPath: string;
    readonly outputPath: string;
    readonly extension: MediaExtension;
    readonly contentType: string;
    readonly size: number;
    readonly width: number;
    readonly height: number;
    readonly warnings: readonly string[];
    readonly cleanup: () => Promise<void>;
    readonly duration?: number;
    readonly poster?: {
        readonly outputPath: string;
        readonly size: number;
        readonly width: number;
        readonly height: number;
    };
}