import { z } from 'zod';
import type { Embed } from '@/lib/commands/util/types';

const urlField = z.string().trim().refine(v => {
    if (!v) return false;
    try { new URL(v); return true; } catch { return false; }
}, 'Invalid URL');

export const embedArgsSchema = z.object({
    color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().describe('Hex color like #ff0000'),
    title: z.string().min(1).max(256).optional().describe('Embed title (1-256 chars)'),
    description: z.string().min(1).max(2048).optional().describe('Main embed description (1-2048 chars)'),
    url: urlField.optional().describe('Hyperlink for the title'),
    image: urlField.optional().describe('Large image URL'),
    thumbnail: urlField.optional().describe('Thumbnail image URL'),
    footer: z.string().max(2048).optional().describe('Footer text (<=2048 chars)'),
    footer_icon: urlField.optional().describe('Footer icon URL'),
    author: z.string().max(256).optional().describe('Author name (<=256 chars)'),
    author_icon: urlField.optional().describe('Author icon URL'),
    author_url: urlField.optional().describe('Author hyperlink URL'),
});
export type EmbedArgs = z.infer<typeof embedArgsSchema>;

export function parseColor(hex?: string): number | undefined {
    if (!hex) return undefined;
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    return parseInt(clean, 16);
}

export function buildEmbed(args: EmbedArgs): Embed {
    const color = parseColor(args.color);
    const embed: Embed = {};
    if (args.title) embed.title = args.title;
    if (args.description) embed.description = args.description;
    if (args.url) embed.url = args.url;
    if (color !== undefined && !Number.isNaN(color)) embed.color = color;
    if (args.image) embed.image = { url: args.image };
    if (args.thumbnail) embed.thumbnail = { url: args.thumbnail };
    if (args.footer) embed.footer = { text: args.footer, icon_url: args.footer_icon };
    if (args.author) embed.author = { name: args.author, icon_url: args.author_icon, url: args.author_url };
    return embed;
}
