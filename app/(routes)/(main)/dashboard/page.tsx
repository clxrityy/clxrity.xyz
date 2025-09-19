import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUrlSync } from "@/lib/env";
import { Button, Card, Badge, Grid, Skeleton, EmptyState } from "@/components/ui";
import UserMenu from "@/components/dashboard/UserMenu";
import GuildCard from "@/components/dashboard/GuildCard";
import { INVITE_URL } from "@/lib/config/urls";
import IconCake from "@/components/icons/IconCake";
import IconDashboard from "@/components/icons/IconDashboard";
import "./dashboard.css";
import { syncUserGuilds } from "@/lib/db/userGuilds";

export const dynamic = 'force-dynamic';

type DiscordPartialGuild = {
    id: string;
    name: string;
    icon?: string | null;
    owner: boolean;
    permissions: number;
};

export default async function Page() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="stack-lg">
                <h1>Sign in required</h1>
                <Link href={`/api/auth/signin?provider=discord&callbackUrl=${encodeURIComponent(getAuthUrlSync())}`} className="no-underline">
                    <Button leftIcon={<span className="icon">🔐</span>}>Sign in with Discord</Button>
                </Link>
            </main>
        );
    }

    // Fetch user's Discord guilds via access token (requires guilds scope)
    let loading = false;
    let guilds: DiscordPartialGuild[] = [];
    let needsReauth = false;
    try {
        // Get latest Discord account for this user to read their access token
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "discord" },
            orderBy: [
                { expires_at: "desc" },
                { id: "desc" },
            ],
        });
        const accessToken = account?.access_token;
        if (accessToken) {
            const res = await fetch("https://discord.com/api/users/@me/guilds", {
                headers: { Authorization: `Bearer ${accessToken}` },
                // Server-side fetch; avoid caching to reflect current membership
                cache: "no-store",
            });
            if (res.ok) {
                guilds = (await res.json()) as DiscordPartialGuild[];
                // Store user-guild memberships for later queries
                try { await syncUserGuilds(session.user.id, guilds); } catch { /* ignore */ }
            } else if (res.status === 401 || res.status === 403) {
                // Token missing required scope, expired, or revoked
                needsReauth = true;
            }
        } else {
            // No access token available; prompt reauthorization
            needsReauth = true;
        }
    } catch {
        // ignore and show empty state
    }
    // Bot-wide stats (real data)
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const [totalGuilds, birthdaysTodayCount, totalBirthdays, guildsWithChannel] = await Promise.all([
        prisma.guildConfig.count(),
        prisma.birthday.count({ where: { month, day } }),
        prisma.birthday.count(),
        prisma.guildConfig.findMany({ where: { birthdayChannel: { not: null } }, select: { guildId: true } }),
    ]);
    // Scheduled announcements today = number of guilds with a birthday channel AND at least one birthday today
    const channelGuildSet = new Set((guildsWithChannel as { guildId: string }[]).map((g) => g.guildId));
    const todaysBirthdays = (await prisma.birthday.findMany({ where: { month, day }, select: { guildId: true } })) as { guildId: string }[];
    const scheduledGuildsToday = new Set(
        todaysBirthdays.filter((b) => channelGuildSet.has(b.guildId)).map((b) => b.guildId)
    ).size;

    // Preload config and counts for the user's guilds to power per-card details
    const userGuildIds = guilds.map((g) => g.id);
    const [userConfigs, userCounts] = await Promise.all([
        userGuildIds.length
            ? prisma.guildConfig.findMany({ where: { guildId: { in: userGuildIds } }, select: { guildId: true, birthdayChannel: true, birthdayRoleId: true } })
            : Promise.resolve([] as { guildId: string; birthdayChannel: string | null; birthdayRoleId: string | null }[]),
        userGuildIds.length
            ? prisma.birthday.groupBy({ by: ["guildId"], where: { guildId: { in: userGuildIds } }, _count: { _all: true } })
            : Promise.resolve([] as { guildId: string; _count: { _all: number } }[]),
    ]) as [
            { guildId: string; birthdayChannel: string | null; birthdayRoleId: string | null }[],
            { guildId: string; _count: { _all: number } }[]
        ];
    // Map for quick lookup
    const cfgMap = new Map(userConfigs.map((c) => [c.guildId, c] as const));
    const countMap = new Map(userCounts.map((c) => [c.guildId, c._count._all] as const));

    const stats = {
        totalGuilds,
        birthdaysToday: birthdaysTodayCount,
        scheduledAnnouncements: scheduledGuildsToday,
        totalBirthdays,
    } as const;

    // Derive avatar (Discord CDN) fallback to first letter of name
    const avatarUrl = (session.user as any)?.image || null;
    const displayName = session.user?.name || "User";
    // Client-side menu hydration wrapper
    return (
        <main className="stack-xl container dashboard">
            <header className="row between center page-header">
                <div className="stack">
                    <nav className="breadcrumb small muted">
                        <span className="crumb">Home</span>
                        <span className="sep">/</span>
                        <span className="crumb current">Dashboard</span>
                    </nav>
                    <h1 className="m-0">Dashboard</h1>
                    <p className="muted m-0">Manage your servers, birthday announcements, and roles.</p>
                </div>
                {/* Right side: quick action + avatar menu */}
                <div className="row">
                    <Link href={INVITE_URL} className="no-underline">
                        <Button variant="primary" size="sm" leftIcon={<span>➕</span>}>Invite Bot</Button>
                    </Link>
                    <UserMenu inviteUrl={INVITE_URL} avatarUrl={avatarUrl} name={displayName} />
                </div>
            </header>

            <section className="stack">
                <Card header={<h2 className="m-0">Overview</h2>}>
                    <div className="grid stats-grid gap-4">
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle"><IconDashboard size={16} /></span><strong className="ml-2">Guilds</strong></div>}>
                            <div className="text-3xl font-bold">{stats.totalGuilds}</div>
                            <div className="small muted">Servers using the bot</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle"><IconCake size={16} /></span><strong className="ml-2">Birthdays Today</strong></div>}>
                            <div className="text-3xl font-bold">{stats.birthdaysToday}</div>
                            <div className="small muted">Across all servers</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">⏰</span><strong className="ml-2">Scheduled</strong></div>}>
                            <div className="text-3xl font-bold">{stats.scheduledAnnouncements}</div>
                            <div className="small muted">Guilds sending today</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">📚</span><strong className="ml-2">Total Birthdays</strong></div>}>
                            <div className="text-3xl font-bold">{stats.totalBirthdays}</div>
                            <div className="small muted">Records stored</div>
                        </Card>
                    </div>
                </Card>
            </section>

            <section className="stack">
                <Card header={
                    <div className="row">
                        <h2 className="m-0">Your Guilds</h2>
                        <Badge variant="accent">Beta</Badge>
                    </div>
                }>
                    {loading && (
                        <Grid cols={3} gap="md" className="grid-auto">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </Grid>
                    )}
                    {!loading && guilds.length === 0 && (
                        <div className="stack">
                            {needsReauth ? (
                                <>
                                    <EmptyState
                                        title="We need permission to list your servers"
                                        description="Please re-authorize with Discord and grant the Guilds permission so we can show the servers you manage."
                                    />
                                    <div className="mt-2">
                                        <Link href={`/api/auth/discord/redirect?callback=/dashboard`} className="no-underline">
                                            <Button leftIcon={<span className="icon">🔐</span>}>Re-authorize with Discord</Button>
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <EmptyState
                                        title="No servers yet"
                                        description="Invite the bot to a server you manage to get started."
                                        actionText="Invite bot"
                                    />
                                    <div className="mt-2">
                                        <Link href={INVITE_URL} className="no-underline">
                                            <Button leftIcon={<span>➕</span>}>Invite Bot</Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {!loading && guilds.length > 0 && (
                        <div className="grid gap-4 guilds-grid">
                            {guilds.map((g) => {
                                const iconHash = g.icon ?? undefined;
                                let iconUrl: string | undefined = undefined;
                                if (iconHash) {
                                    const ext = iconHash.startsWith('a_') ? 'gif' : 'png';
                                    iconUrl = `https://cdn.discordapp.com/icons/${g.id}/${iconHash}.${ext}?size=64`;
                                }
                                const cfg = cfgMap.get(g.id);
                                const birthdayCount = countMap.get(g.id) || 0;
                                const hasChannel = !!cfg?.birthdayChannel;
                                const hasRole = !!cfg?.birthdayRoleId;
                                let status: "connected" | "partial" | "disconnected" = "disconnected";
                                if (cfg) status = hasChannel ? "connected" : "partial";
                                return (
                                    <GuildCard
                                        key={g.id}
                                        id={g.id}
                                        name={g.name}
                                        iconUrl={iconUrl}
                                        status={status}
                                        stats={{ birthdayCount, hasChannel, hasRole }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </Card>
            </section>
        </main>
    );
}