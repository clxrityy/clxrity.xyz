import type { RegisteredCommand, Embed, Component } from './types';
import { z } from 'zod';

function describeSchema(schema: z.ZodTypeAny): string[] {
    if (!schema || typeof schema !== 'object') return [];
    const unwrap = (s: any): any => {
        for (let i = 0; i < 15; i++) {
            const tn = s?._def?.typeName;
            if (tn === 'ZodOptional' || tn === 'ZodDefault' || tn === 'ZodNullable' || tn === 'ZodEffects') {
                const inner = s?._def?.innerType || s?._def?.schema || s?._def?.effect?.schema;
                if (!inner || inner === s) break;
                s = inner;
                continue;
            }
            break;
        }
        return s;
    };
    if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        const rows = Object.keys(shape).map(key => {
            const original: any = (shape as any)[key];
            let isOpt = !!(original?.isOptional?.());
            // Walk wrappers to detect optional-ness
            let cursor = original;
            for (let i = 0; i < 10; i++) {
                const tn = cursor?._def?.typeName;
                if (tn === 'ZodOptional' || tn === 'ZodDefault' || tn === 'ZodNullable') isOpt = true;
                const next = cursor?._def?.innerType || cursor?._def?.schema || cursor?._def?.effect?.schema;
                if (!next || next === cursor) break;
                cursor = next;
            }
            const unwrapped = unwrap(original);
            const descText = unwrapped?._def?.description || original?._def?.description;
            const tn = unwrapped?._def?.typeName?.replace(/^Zod/, '').toLowerCase();
            const typeLabel = tn === 'string' || tn === 'number' || tn === 'boolean' ? tn : (tn || 'value');
            return { token: isOpt ? `(${key})` : `<${key}>`, desc: descText, typeLabel };
        });
        // If we detected any real key tokens, suppress generic '(value)' duplicates.
        const tokens = rows.map(r => r.token);
        const hasGeneric = tokens.includes('(value)') || tokens.includes('<value>');
        const filtered = rows.filter(r => !(hasGeneric && ['(value)', '<value>'].includes(r.token)));
        // Deduplicate tokens preserving first occurrence
        const seen = new Set<string>();
        const finalRows = filtered.filter(r => {
            if (seen.has(r.token)) return false;
            seen.add(r.token);
            return true;
        });
        return finalRows.map(r => {
            const suffix = r.desc ? ` — ${r.desc}` : '';
            return `${r.token}${suffix}`; // omit type label from help detail now for brevity
        });
    }
    return [];
}

// Build usage string from command schema
function buildUsage(cmd: RegisteredCommand): string {
    const args = describeSchema(cmd.schema).map(line => line.split(' ')[0]); // take only the token
    const usageSuffix = args.join(' ');
    return `/${cmd.name}${usageSuffix ? ' ' + usageSuffix : ''}`;
}

// Legacy helper kept (single list -> multiple embeds) but now delegates to paging builder
export function buildHelpListEmbed(commands: RegisteredCommand[]): Embed[] {
    return buildHelpPages(commands).map(p => p.embed);
}

export interface HelpPage {
    page: number; // 1-based
    total: number;
    embed: Embed;
}

// Build paginated help pages, each embed groups categories until ~5500 chars soft limit
export function buildHelpPages(commands: RegisteredCommand[]): HelpPage[] {
    const groups = new Map<string, RegisteredCommand[]>();
    for (const c of commands) {
        const cat = c.category || 'Other';
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(c);
    }
    // Sort categories alphabetically, commands inside alphabetically
    const ordered = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cat, list]) => {
            const sortedList = [...list].sort((a, b) => a.name.localeCompare(b.name));
            return [cat, sortedList] as [string, RegisteredCommand[]];
        });

    const pages: HelpPage[] = [];
    let current: Embed = { title: 'Help' };
    let descParts: string[] = [];
    let charCount = (current.title?.length || 0);
    const pushCurrent = () => {
        pages.push({ page: pages.length + 1, total: 0, embed: { ...current, description: descParts.join('\n\n') } });
        current = { title: 'Help (cont.)' };
        descParts = [];
        charCount = (current.title?.length || 0);
    };

    for (const [cat, list] of ordered) {
        const section = [`**${cat}**`, ...list.map(c => `• \`/${c.name}\` — ${c.description || '—'}`)].join('\n');
        if (charCount + section.length + 2 > 5500 && descParts.length) {
            pushCurrent();
        }
        descParts.push(section);
        charCount += section.length + 2;
    }
    if (descParts.length) pushCurrent();
    // Update total
    for (const p of pages) p.total = pages.length;
    return pages;
}

export function buildHelpPageComponents(page: number, total: number): Component[] {
    if (total <= 1) return [];
    const prevDisabled = page <= 1;
    const nextDisabled = page >= total;
    return [
        {
            type: 1, // action row
            components: [
                {
                    type: 2, style: 2, label: 'Prev', custom_id: `help:page:${page - 1}`,
                    disabled: prevDisabled
                },
                {
                    type: 2, style: 2, label: `${page}/${total}`, custom_id: 'help:page:noop', disabled: true
                },
                {
                    type: 2, style: 2, label: 'Next', custom_id: `help:page:${page + 1}`,
                    disabled: nextDisabled
                }
            ]
        }
    ];
}

export function buildHelpPageResponse(commands: RegisteredCommand[], page = 1): { embeds: Embed[]; components?: Component[]; ephemeral: true } {
    const pages = buildHelpPages(commands);
    const target = pages[Math.max(0, Math.min(pages.length - 1, page - 1))];
    const components = buildHelpPageComponents(target.page, target.total);
    // Add a footer-like page indicator using fields if multiple pages
    if (target.embed) {
        target.embed.footer = { text: `Page ${target.page}/${target.total}` };
    }
    return { embeds: [target.embed], components, ephemeral: true };
}

export function buildHelpDetailEmbed(cmd: RegisteredCommand): Embed {
    const argLines = describeSchema(cmd.schema);
    const usage = buildUsage(cmd);
    return {
        title: '/' + cmd.name,
        description: cmd.description || '—',
        fields: [
            { name: 'Usage', value: usage },
            argLines.length ? { name: 'Arguments', value: argLines.join('\n') } : undefined,
        ].filter(Boolean) as Embed['fields'],
    };
}
