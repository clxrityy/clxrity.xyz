import { prisma } from "@/lib/prisma";

export type DiscordPartialGuild = {
    id: string;
    name: string;
    icon?: string | null;
    owner: boolean;
    permissions: number; // fits into BigInt
};

// ADMINISTRATOR bit in Discord permissions
const ADMINISTRATOR = 1n << 3n; // 0x00000008

export async function syncUserGuilds(userId: string, guilds: DiscordPartialGuild[]) {
    if (!userId || !Array.isArray(guilds) || guilds.length === 0) return;
    const ops = guilds.map((g) => {
        const perms = BigInt(g.permissions ?? 0);
        const adminPerm = (perms & ADMINISTRATOR) === ADMINISTRATOR;
        const isAdmin = adminPerm || g.owner;
        return prisma.userGuild.upsert({
            where: { userId_guildId: { userId, guildId: g.id } },
            update: {
                name: g.name,
                icon: g.icon ?? null,
                owner: g.owner,
                permissions: perms,
                adminPerm,
                isAdmin,
            },
            create: {
                userId,
                guildId: g.id,
                name: g.name,
                icon: g.icon ?? null,
                owner: g.owner,
                permissions: perms,
                adminPerm,
                isAdmin,
            },
        });
    });
    // Best-effort: run in parallel; if many, consider batching
    await Promise.allSettled(ops);
}

// Upsert membership from an interaction payload, with optional enrichment using the Bot token
export async function upsertUserGuildFromInteraction(
    userId: string,
    guildId: string,
    memberPermissions?: string | number,
    opts: { enrich?: boolean } = { enrich: true },
) {
    if (!userId || !guildId) return;
    let name: string | undefined;
    let icon: string | undefined;
    let owner = false;

    // Try enrichment via Bot token to get guild name/icon and owner_id
    if (opts.enrich && process.env.DISCORD_BOT_TOKEN) {
        try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
                headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
                cache: 'no-store',
                signal: controller.signal,
            }).finally(() => clearTimeout(t));
            if (res.ok) {
                const g = await res.json();
                name = g?.name;
                icon = g?.icon ?? undefined;
                owner = g?.owner_id === userId;
            }
        } catch { /* ignore enrichment errors */ }
    }

    // Compute admin flag from member permissions bitfield
    let perms = 0n;
    try {
        if (memberPermissions !== undefined) perms = BigInt(memberPermissions as any);
    } catch { perms = 0n; }
    const adminPerm = (perms & ADMINISTRATOR) === ADMINISTRATOR;
    const isAdmin = owner || adminPerm;

    await prisma.userGuild.upsert({
        where: { userId_guildId: { userId, guildId } },
        update: {
            name: name ?? undefined,
            icon: icon ?? undefined,
            owner,
            permissions: perms,
            adminPerm,
            isAdmin,
        },
        create: {
            userId,
            guildId,
            name: name ?? guildId, // fallback name not ideal but not empty
            icon: icon ?? null,
            owner,
            permissions: perms,
            adminPerm,
            isAdmin,
        },
    });
}
