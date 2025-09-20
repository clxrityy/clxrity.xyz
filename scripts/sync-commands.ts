#!/usr/bin/env -S node
// Sync Discord slash commands from our typed registry and zod schemas.
// Usage:
//   pnpm sync:discord --dry-run            # print JSON only
//   pnpm sync:discord --write              # write manifest file (default)
//   pnpm sync:discord --guild <GUILD_ID>   # sync to a guild (faster propagation)
//   pnpm sync:discord                      # sync globally (slower propagation)
//   Env required to sync:
//   DISCORD_APP_ID, DISCORD_BOT_TOKEN

import { registry } from '../lib/commands/registry';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

function loadEnv() {
    const cwd = process.cwd();
    const candidates = [
        path.join(cwd, '.env.production'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) dotenv.config({ path: p });
    }
}

loadEnv();

type DiscordCommand = {
    name: string;
    description: string;
    type?: number; // 1 = CHAT_INPUT
    options?: any[];
    dm_permission?: boolean;
};

const OptionType = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11,
} as const;

function getDef(schema: z.ZodTypeAny): any {
    return (schema as any)?._def ?? {};
}

function getDescription(schema: z.ZodTypeAny, fallback: string): string {
    const d = getDef(schema)?.description as string | undefined;
    return d?.trim() || fallback;
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
    // peel Optional/Default/Nullable/Effects
    const t = (schema as any)?._def?.typeName as string | undefined;
    if (!t) return schema;
    // ZodFirstPartyTypeKind names
    if (t === 'ZodOptional' || t === 'ZodNullable' || t === 'ZodDefault' || t === 'ZodEffects') {
        const anyDef = (schema as any)._def;
        return unwrap(anyDef.innerType ?? anyDef.schema ?? anyDef.effect?.schema ?? schema);
    }
    return schema;
}

function numberIsInt(schema: z.ZodNumber): boolean {
    const def: any = (schema as any)._def;
    const checks: any[] = def?.checks || [];
    return checks.some((c) => c?.kind === 'int');
}

function handleStringSchema(name: string, schema: z.ZodString, required: boolean) {
    const def: any = getDef(schema);
    const checks: any[] = def?.checks || [];
    const min = checks.find((c) => c?.kind === 'min')?.value;
    const max = checks.find((c) => c?.kind === 'max')?.value;
    const opt: any = { name, type: OptionType.STRING, description: getDescription(schema, 'string'), required };
    if (typeof min === 'number') opt.min_length = Math.max(0, Math.min(6000, Math.floor(min)));
    if (typeof max === 'number') opt.max_length = Math.max(1, Math.min(6000, Math.floor(max)));
    return opt;
}

function handleNumberSchema(name: string, schema: z.ZodNumber, required: boolean) {
    const type = numberIsInt(schema) ? OptionType.INTEGER : OptionType.NUMBER;
    const def: any = getDef(schema);
    const checks: any[] = def?.checks || [];
    const min = checks.find((c) => c?.kind === 'min')?.value;
    const max = checks.find((c) => c?.kind === 'max')?.value;
    const opt: any = { name, type, description: getDescription(schema, type === OptionType.INTEGER ? 'integer' : 'number'), required };
    if (typeof min === 'number') opt.min_value = min;
    if (typeof max === 'number') opt.max_value = max;
    return opt;
}

function handleEnumSchema(name: string, schema: z.ZodEnum<any>, required: boolean) {
    return {
        name,
        type: OptionType.STRING,
        description: getDescription(schema, 'enum'),
        required,
        choices: (schema.options || []).slice(0, 25).map((v: string) => ({ name: String(v).slice(0, 100), value: v })),
    };
}

function handleLiteralSchema(name: string, schema: z.ZodLiteral<any>, required: boolean) {
    const lit = schema.value;
    if (typeof lit === 'boolean') return { name, type: OptionType.BOOLEAN, description: getDescription(schema, 'boolean'), required };
    if (typeof lit === 'number') return { name, type: OptionType.NUMBER, description: getDescription(schema, 'number'), required };
    return { name, type: OptionType.STRING, description: getDescription(schema, 'string'), required, choices: [{ name: String(lit), value: lit }] };
}

function optionFromSchema(name: string, schema: z.ZodTypeAny, required: boolean) {
    const s = unwrap(schema);

    if (s instanceof z.ZodString) {
        return handleStringSchema(name, s, required);
    }

    if (s instanceof z.ZodNumber) {
        return handleNumberSchema(name, s, required);
    }

    if (s instanceof z.ZodBoolean) {
        return { name, type: OptionType.BOOLEAN, description: getDescription(s, 'boolean'), required };
    }

    if (s instanceof z.ZodEnum) {
        return handleEnumSchema(name, s, required);
    }

    if (s instanceof z.nativeEnum) {
        const values = Object.values((s as any)._def.values).filter((v) => typeof v === 'string');
        return {
            name,
            type: OptionType.STRING,
            description: getDescription(s, 'enum'),
            required,
            choices: values.slice(0, 25).map((v) => ({ name: v.slice(0, 100), value: v })),
        };
    }

    if (s instanceof z.ZodLiteral) {
        return handleLiteralSchema(name, s, required);
    }

    // Fallback: stringify or accept as string
    return { name, type: OptionType.STRING, description: getDescription(s, 'value'), required };
}

function schemaToOptions(schema: z.ZodTypeAny | undefined): any[] | undefined {
    if (!schema) return undefined;
    const s = unwrap(schema);
    if (s instanceof z.ZodObject) {
        const shape: Record<string, z.ZodTypeAny> = (s as any).shape;
        const opts: any[] = [];
        for (const [key, value] of Object.entries(shape)) {
            const { inner, required } = unwrapAndDetectRequired(value);
            const opt = optionFromSchema(key, inner, required);
            opts.push(opt);
        }
        return opts.length ? opts : undefined;
    }
    // Primitive arg schemas: expose a single option named 'value'
    if (s instanceof z.ZodString || s instanceof z.ZodNumber || s instanceof z.ZodBoolean || s instanceof z.ZodEnum || s instanceof z.nativeEnum || s instanceof z.ZodLiteral) {
        return [optionFromSchema('value', s, true)];
    }
    return undefined;
}

function unwrapAndDetectRequired(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; required: boolean } {
    let cur: z.ZodTypeAny = schema;
    let required = true;
    const seen = new Set<any>();
    const isOptLike = (s: any) => !!(s?.isOptional?.() || ['ZodOptional', 'ZodDefault', 'ZodNullable'].includes(s?._def?.typeName));
    for (let i = 0; i < 15; i++) {
        if (seen.has(cur)) break;
        seen.add(cur);
        if (isOptLike(cur)) required = false;
        const def: any = (cur as any)?._def;
        const next = def?.innerType || def?.schema || def?.inner || def?.type || null;
        if (!next || next === cur) break;
        cur = next;
    }
    return { inner: cur, required };
}

// Type definition moved outside the function
type SubDef = { name: string; description: string; options?: any[] };
type ParentMap = Map<string, { standalone?: SubDef; subs: SubDef[]; groups: Map<string, SubDef[]> }>;

function ensureParent(p: string, parents: ParentMap): { standalone?: SubDef; subs: SubDef[]; groups: Map<string, SubDef[]> } {
    if (!parents.has(p)) parents.set(p, { subs: [], groups: new Map() });
    return parents.get(p)!;
}

function processCommandDefinition(def: any, parents: ParentMap): void {
    const description = (def.description || `${def.name} command`).slice(0, 100);
    const options = schemaToOptions(def.schema);
    const tokens = def.name.trim().split(/\s+/);

    if (tokens.length === 1) {
        const parent = ensureParent(tokens[0], parents);
        parent.standalone = { name: tokens[0], description, options };
        return;
    }

    if (tokens.length === 2) {
        const [p, sub] = tokens;
        const parent = ensureParent(p, parents);
        parent.subs.push({ name: sub, description, options });
        return;
    }

    // 3+ tokens -> treat as group + sub
    const p = tokens[0];
    const group = tokens[1];
    const sub = tokens.slice(2).join('-');
    const parent = ensureParent(p, parents);
    const list = parent.groups.get(group) ?? [];
    list.push({ name: sub, description, options });
    parent.groups.set(group, list);
}

function createSubcommandOptions(data: { subs: SubDef[]; groups: Map<string, SubDef[]> }, parentName: string): any[] {
    const options: any[] = [];

    // Add subcommands
    for (const s of data.subs) {
        options.push({
            type: OptionType.SUB_COMMAND,
            name: s.name,
            description: s.description,
            options: s.options
        });
    }

    // Add subcommand groups
    for (const [gname, subs] of data.groups) {
        options.push({
            type: OptionType.SUB_COMMAND_GROUP,
            name: gname,
            description: `${parentName} ${gname}`.slice(0, 100),
            options: subs.map((s) => ({
                type: OptionType.SUB_COMMAND,
                name: s.name,
                description: s.description,
                options: s.options
            })),
        });
    }

    return options;
}

function buildCommandsFromParentMap(parents: ParentMap): DiscordCommand[] {
    const out: DiscordCommand[] = [];

    for (const [name, data] of parents) {
        // If there are any subs/groups, produce a parent command with subcommands/groups
        if (data.subs.length || data.groups.size) {
            const options = createSubcommandOptions(data, name);
            out.push({
                name,
                description: data.standalone?.description || `${name} command`,
                type: 1,
                options,
                dm_permission: true
            });
        }
        // Otherwise standalone simple command
        else if (data.standalone) {
            out.push({
                name,
                description: data.standalone.description,
                type: 1,
                options: data.standalone.options,
                dm_permission: true
            });
        }
    }

    return out;
}

function buildCommands(): DiscordCommand[] {
    const defs = registry.list();
    const parents: ParentMap = new Map();

    // Process each command definition
    for (const def of defs) {
        processCommandDefinition(def, parents);
    }

    // Build the final command array
    const built = buildCommandsFromParentMap(parents);
    // Post-process: add choices to help command's single 'command' option (if present)
    const help = built.find(c => c.name === 'help');
    if (help && Array.isArray(help.options)) {
        const opt = help.options.find((o: any) => o.name === 'command' && o.type === 3);
        if (opt) {
            const commandNames = defs.map(d => d.name).filter(n => n !== 'help');
            opt.choices = commandNames.slice(0, 25).map(n => ({ name: n.slice(0, 100), value: n }));
        }
    }
    return built;
}

async function main() {
    const args = new Set(process.argv.slice(2));
    const dryRun = args.has('--dry-run');
    const noWrite = args.has('--no-write');
    const write = args.has('--write') || !noWrite;
    const guildIndex = process.argv.findIndex((a) => a === '--guild');
    const guildId = guildIndex !== -1 ? process.argv[guildIndex + 1] : undefined;

    const appId = process.env.DISCORD_APP_ID!;
    const token = process.env.DISCORD_BOT_TOKEN!;

    const commands = buildCommands();
    const manifestPath = path.resolve(__dirname, '../lib/commands/manifest.json');

    if (write) {
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, JSON.stringify(commands, null, 2) + '\n');
        console.log(`Wrote manifest: ${path.relative(process.cwd(), manifestPath)}`);
    }

    if (dryRun || !appId || !token) {
        if (!appId || !token) {
            console.log('Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN. Printing JSON only.');
        }
        console.log(JSON.stringify(commands, null, 2));
        return;
    }

    const base = guildId
        ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
        : `https://discord.com/api/v10/applications/${appId}/commands`;

    const res = await fetch(base, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${token}`,
        },
        body: JSON.stringify(commands),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Failed to sync commands:', res.status, text);
        process.exit(1);
    }
    const json = await res.json();
    console.log('Synced', Array.isArray(json) ? json.length : 0, 'commands', guildId ? `to guild ${guildId}` : 'globally');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
