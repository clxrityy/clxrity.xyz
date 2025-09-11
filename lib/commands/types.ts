import { z } from "zod";

// Base payload coming into the API
export const BaseCommandPayload = z.object({
    name: z.string().min(1),
    args: z.unknown().default({}),
});
export type BaseCommandPayload = z.infer<typeof BaseCommandPayload>;

// Context available to command handlers (edge-safe)
export type CommandContext = {
    req: Request;
    headers: Headers;
    ip?: string | null;
    now: () => Date; // useful for consistent timestamps in tests
};

// A type-safe command definition: args schema + execute handler
export interface CommandDefinition<
    TArgsSchema extends z.ZodTypeAny = z.ZodObject<any>,
    TResult = unknown
> {
    name: string;
    description?: string;
    schema: TArgsSchema;
    // Optional authorization hook before execute
    authorize?: (input: { ctx: CommandContext; args: z.infer<TArgsSchema> }) => boolean | Promise<boolean>;
    // Execute the command
    execute: (input: { ctx: CommandContext; args: z.infer<TArgsSchema> }) => Promise<TResult> | TResult;
}

export type RegisteredCommand = CommandDefinition<any, any>;

export interface CommandRegistry {
    list: () => RegisteredCommand[];
    get: (name: string) => RegisteredCommand | undefined;
}

export class CommandNotFoundError extends Error {
    constructor(public readonly name: string) {
        super(`Command not found: ${name}`);
        this.name = "CommandNotFoundError";
    }
}

export class CommandUnauthorizedError extends Error {
    constructor(public readonly name: string) {
        super(`Unauthorized to execute command: ${name}`);
        this.name = "CommandUnauthorizedError";
    }
}

export class CommandValidationError extends Error {
    constructor(public readonly issues: z.ZodIssue[]) {
        super("Invalid command arguments");
        this.name = "CommandValidationError";
    }
}

export function createRegistry(commands: RegisteredCommand[]): CommandRegistry {
    const map = new Map<string, RegisteredCommand>();
    for (const c of commands) map.set(c.name, c);
    return {
        list: () => Array.from(map.values()),
        get: (name: string) => map.get(name),
    };
}

// Dispatch a command by name with raw args (validates via schema, auth, then executes)
export async function dispatch<TResult = unknown>(
    registry: CommandRegistry,
    ctx: CommandContext,
    name: string,
    rawArgs: unknown
): Promise<TResult> {
    const def = registry.get(name);
    if (!def) throw new CommandNotFoundError(name);

    const parsed = def.schema.safeParse(rawArgs);
    if (!parsed.success) throw new CommandValidationError(parsed.error.issues);

    if (def.authorize) {
        const ok = await def.authorize({ ctx, args: parsed.data });
        if (!ok) throw new CommandUnauthorizedError(name);
    }

    const result = await def.execute({ ctx, args: parsed.data });
    return result as TResult;
}

// Discord-like rich response types (kept generic to avoid SDK coupling)
export type Embed = {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    timestamp?: string;
    footer?: { text: string; icon_url?: string };
    image?: { url: string };
    thumbnail?: { url: string };
    author?: { name: string; url?: string; icon_url?: string };
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

export type Component = {
    type: number; // Discord component type (1 action row, 2 button, 3 select, etc.)
    [key: string]: any;
};

export type Attachment = {
    id?: string | number;
    filename: string;
    description?: string;
    contentType?: string;
    data?: Uint8Array | ArrayBuffer; // optional raw data if you plan to upload elsewhere first
    url?: string; // pre-hosted URL if applicable
};

export type AllowedMentions = {
    parse?: Array<'roles' | 'users' | 'everyone'>;
    users?: string[];
    roles?: string[];
    replied_user?: boolean;
};

// Flexible reply for commands. 'raw' lets a handler fully control the interaction data shape.
export type CommandReply =
    | string
    | {
        content?: string;
        embeds?: Embed[];
        components?: Component[];
        attachments?: Attachment[];
        allowedMentions?: AllowedMentions;
        // Discord interaction response flags (e.g., 64 for ephemeral)
        flags?: number;
        // Convenience: set ephemeral=true to apply Discord flag 64
        ephemeral?: boolean;
        // If provided, pass this object directly as Discord interaction callback 'data'
        raw?: Record<string, any>;
    };

// Convenience helper to coerce a basic reply into a Discord interaction callback data payload
export function replyToInteractionData(reply: CommandReply): Record<string, any> {
    if (typeof reply === 'string') return { content: reply };
    if (reply.raw) return reply.raw;
    const { content, embeds, components, attachments, allowedMentions, flags, ephemeral } = reply;
    const data: Record<string, any> = {};
    if (content) data.content = content;
    if (embeds) data.embeds = embeds;
    if (components) data.components = components;
    if (attachments) data.attachments = attachments;
    if (allowedMentions) data.allowed_mentions = allowedMentions;
    let computedFlags = typeof flags === 'number' ? flags : 0;
    if (ephemeral) computedFlags |= 1 << 6; // 64
    if (computedFlags) data.flags = computedFlags;
    return data;
}
