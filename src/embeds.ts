import { UsageError } from './errors.js';
import { isPosterKey } from './media-types.js';

export interface EmbedStyle {
    readonly color: string | null;
    readonly title: string;
    readonly description: string;
}

export interface EmbedFlags {
    readonly color?: string | true;
    readonly title?: string;
    readonly description?: string | true;
}

export interface EmbedRecord extends EmbedStyle {
    readonly version: 1;
    readonly kind: 'image' | 'video';
    readonly width: number;
    readonly height: number;
    readonly duration?: number;
    readonly posterKey?: string;
}

export const DEFAULT_EMBED_STYLE: EmbedStyle = { color: '#5865F2', title: '', description: '' };
export const EMBED_METADATA_KEY = 'embed';
export const MAX_METADATA_BYTES = 2048;
const encoder = new TextEncoder();

// Standard CSS named colors, plus the CLI's blurple alias. A fixed map avoids
// accepting arbitrary CSS, which must never reach generated HTML attributes.
const NAMED_COLORS: Record<string, string> = Object.fromEntries(`
aliceblue:F0F8FF antiquewhite:FAEBD7 aqua:00FFFF aquamarine:7FFFD4 azure:F0FFFF
beige:F5F5DC bisque:FFE4C4 black:000000 blanchedalmond:FFEBCD blue:0000FF
blueviolet:8A2BE2 brown:A52A2A burlywood:DEB887 cadetblue:5F9EA0 chartreuse:7FFF00
chocolate:D2691E coral:FF7F50 cornflowerblue:6495ED cornsilk:FFF8DC crimson:DC143C
cyan:00FFFF darkblue:00008B darkcyan:008B8B darkgoldenrod:B8860B darkgray:A9A9A9
darkgreen:006400 darkgrey:A9A9A9 darkkhaki:BDB76B darkmagenta:8B008B darkolivegreen:556B2F
darkorange:FF8C00 darkorchid:9932CC darkred:8B0000 darksalmon:E9967A darkseagreen:8FBC8F
darkslateblue:483D8B darkslategray:2F4F4F darkslategrey:2F4F4F darkturquoise:00CED1
darkviolet:9400D3 deeppink:FF1493 deepskyblue:00BFFF dimgray:696969 dimgrey:696969
dodgerblue:1E90FF firebrick:B22222 floralwhite:FFFAF0 forestgreen:228B22 fuchsia:FF00FF
gainsboro:DCDCDC ghostwhite:F8F8FF gold:FFD700 goldenrod:DAA520 gray:808080 green:008000
greenyellow:ADFF2F grey:808080 honeydew:F0FFF0 hotpink:FF69B4 indianred:CD5C5C
indigo:4B0082 ivory:FFFFF0 khaki:F0E68C lavender:E6E6FA lavenderblush:FFF0F5 lawngreen:7CFC00
lemonchiffon:FFFACD lightblue:ADD8E6 lightcoral:F08080 lightcyan:E0FFFF
lightgoldenrodyellow:FAFAD2 lightgray:D3D3D3 lightgreen:90EE90 lightgrey:D3D3D3 lightpink:FFB6C1
lightsalmon:FFA07A lightseagreen:20B2AA lightskyblue:87CEFA lightslategray:778899
lightslategrey:778899 lightsteelblue:B0C4DE lightyellow:FFFFE0 lime:00FF00 limegreen:32CD32
linen:FAF0E6 magenta:FF00FF maroon:800000 mediumaquamarine:66CDAA mediumblue:0000CD
mediumorchid:BA55D3 mediumpurple:9370DB mediumseagreen:3CB371 mediumslateblue:7B68EE
mediumspringgreen:00FA9A mediumturquoise:48D1CC mediumvioletred:C71585 midnightblue:191970
mintcream:F5FFFA mistyrose:FFE4E1 moccasin:FFE4B5 navajowhite:FFDEAD navy:000080
oldlace:FDF5E6 olive:808000 olivedrab:6B8E23 orange:FFA500 orangered:FF4500 orchid:DA70D6
palegoldenrod:EEE8AA palegreen:98FB98 paleturquoise:AFEEEE palevioletred:DB7093 papayawhip:FFEFD5
peachpuff:FFDAB9 peru:CD853F pink:FFC0CB plum:DDA0DD powderblue:B0E0E6 purple:800080
rebeccapurple:663399 red:FF0000 rosybrown:BC8F8F royalblue:4169E1 saddlebrown:8B4513
salmon:FA8072 sandybrown:F4A460 seagreen:2E8B57 seashell:FFF5EE sienna:A0522D silver:C0C0C0
skyblue:87CEEB slateblue:6A5ACD slategray:708090 slategrey:708090 snow:FFFAFA springgreen:00FF7F
steelblue:4682B4 tan:D2B48C teal:008080 thistle:D8BFD8 tomato:FF6347 turquoise:40E0D0
violet:EE82EE wheat:F5DEB3 white:FFFFFF whitesmoke:F5F5F5 yellow:FFFF00 yellowgreen:9ACD32
blurple:5865F2
`.trim().split(/\s+/).map((entry) => {
    const [name, hex] = entry.split(':');
    return [name!, `#${hex!}`];
}));

export function normalizeColor(value: string | null): string | null {
    if (value === null) return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === '' || normalized === 'transparent') return null;
    if (/^#[a-f0-9]{3}$/.test(normalized)) {
        return `#${normalized.slice(1).split('').map((character) => character.repeat(2)).join('')}`.toUpperCase();
    }
    if (/^#[a-f0-9]{6}$/.test(normalized)) return normalized.toUpperCase();
    if (Object.hasOwn(NAMED_COLORS, normalized)) return NAMED_COLORS[normalized]!;
    throw new UsageError('Color must be a CSS named color, blurple, #RGB, #RRGGBB, or transparent.');
}

export function validateEmbedText(value: string, field: 'title' | 'description'): string {
    const limit = field === 'title' ? 256 : 768;
    if (encoder.encode(value).byteLength > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
        throw new UsageError(`Embed ${field} must be ${limit} UTF-8 bytes or fewer and contain no control characters.`);
    }
    return value;
}

export function resolveEmbedStyle(defaults: EmbedStyle = DEFAULT_EMBED_STYLE, flags: EmbedFlags = {}): EmbedStyle {
    return {
        color: normalizeColor(flags.color === true ? null : flags.color !== undefined ? flags.color : defaults.color),
        title: validateEmbedText(flags.title ?? defaults.title, 'title'),
        description: validateEmbedText(flags.description === true ? '' : flags.description ?? defaults.description, 'description'),
    };
}

export function assertMetadataBudget(metadata: Readonly<Record<string, string>>): void {
    const size = Object.entries(metadata).reduce((total, [key, value]) => total + encoder.encode(key).byteLength + encoder.encode(value).byteLength, 0);
    if (size > MAX_METADATA_BYTES) throw new UsageError(`Upload metadata exceeds the ${MAX_METADATA_BYTES}-byte safety limit. Shorten the title or description.`);
}

export function encodeEmbedMetadata(record: EmbedRecord): Record<string, string> {
    assertRecord(record);
    // Browser/Worker-native encoding also works in Node 24, without Buffer imports.
    const bytes = encoder.encode(JSON.stringify(record));
    const value = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const metadata = { [EMBED_METADATA_KEY]: value };
    assertMetadataBudget({ ...metadata, 'upload-id': '00000000-0000-0000-0000-000000000000' });
    return metadata;
}

export function decodeEmbedMetadata(metadata: Readonly<Record<string, string>> | undefined): EmbedRecord | undefined {
    const value = metadata?.[EMBED_METADATA_KEY];
    if (value === undefined) return undefined;
    try {
        if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > MAX_METADATA_BYTES) throw new Error();
        const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
        assertRecord(parsed);
        return parsed;
    } catch {
        throw new UsageError('Stored embed metadata is invalid or unsupported.');
    }
}

function assertRecord(value: unknown): asserts value is EmbedRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new UsageError('Invalid embed record.');
    const record = value as Record<string, unknown>;
    const allowed = ['version', 'kind', 'color', 'title', 'description', 'width', 'height', 'duration', 'posterKey'];
    if (Object.keys(record).some((key) => !allowed.includes(key)) || record.version !== 1 || !['image', 'video'].includes(String(record.kind))) throw new UsageError('Invalid embed record version or kind.');
    if (record.color !== null && (typeof record.color !== 'string' || !/^#[A-F0-9]{6}$/.test(record.color))) throw new UsageError('Invalid stored embed color.');
    for (const field of ['title', 'description'] as const) {
        if (typeof record[field] !== 'string') throw new UsageError(`Invalid embed ${field}.`);
        validateEmbedText(record[field], field);
    }
    for (const field of ['width', 'height'] as const) {
        if (!Number.isSafeInteger(record[field]) || (record[field] as number) <= 0 || (record[field] as number) > 100_000_000) throw new UsageError('Invalid embed dimensions.');
    }
    if (record.kind === 'video') {
        if (typeof record.duration !== 'number' || !Number.isFinite(record.duration) || record.duration <= 0 || typeof record.posterKey !== 'string' || !isPosterKey(record.posterKey)) throw new UsageError('Video embeds require a duration and a safe poster key.');
    } else if (record.duration !== undefined || record.posterKey !== undefined) {
        throw new UsageError('Image embeds cannot reference video metadata.');
    }
}