import { extname } from 'node:path';

import { processImage } from './images.js';
import { type ProcessedMedia, type VideoLimits } from './media-types.js';
import { processVideo } from './videos.js';

export async function processMedia(input: string, limits: Partial<VideoLimits> = {}): Promise<ProcessedMedia> {
    const extension = extname(input).toLowerCase();
    if (extension === '.mov' || extension === '.mp4') {
        return processVideo(input, limits);
    }

    const image = await processImage(input);
    return {
        kind: 'image',
        inputPath: image.inputPath,
        outputPath: image.outputPath,
        extension: image.extension,
        contentType: image.contentType,
        size: image.size,
        width: image.width,
        height: image.height,
        warnings: image.warnings,
        cleanup: image.cleanup,
    };
}