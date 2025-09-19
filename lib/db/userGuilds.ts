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
