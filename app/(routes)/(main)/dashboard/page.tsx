import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, Badge, Grid, Skeleton, EmptyState } from "@/components/ui";
import UserMenu from "@/components/dashboard/UserMenu";
import GuildCard from "@/components/dashboard/GuildCard";
import { INVITE_URL } from "@/lib/config/urls";
import IconCake from "@/components/icons/IconCake";
import IconDashboard from "@/components/icons/IconDashboard";
import "./dashboard.css";

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
                <form action={async () => { "use server"; await signIn("discord"); }}>
                    <Button leftIcon={<span className="icon">🔐</span>}>Sign in with Discord</Button>
                </form>
            </main>
        );
    }

    // Fetch user's Discord guilds via access token (requires guilds scope)
    let loading = false;
    let guilds: DiscordPartialGuild[] = [];
    try {
        // Get latest Discord account for this user to read their access token
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "discord" },
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
            }
        }
    } catch {
        // ignore and show empty state
    }
    const stats = {
        guildCount: guilds.length,
        birthdaysToday: 0,
        scheduledAnnouncements: 0,
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
                            <div className="text-3xl font-bold">{stats.guildCount}</div>
                            <div className="small muted">Connected</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle"><IconCake size={16} /></span><strong className="ml-2">Birthdays Today</strong></div>}>
                            <div className="text-3xl font-bold">{stats.birthdaysToday}</div>
                            <div className="small muted">Across all servers</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">⏰</span><strong className="ml-2">Scheduled</strong></div>}>
                            <div className="text-3xl font-bold">{stats.scheduledAnnouncements}</div>
                            <div className="small muted">Announcements queued</div>
                        </Card>
                        <Card className="stat-card elevated" size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">📈</span><strong className="ml-2">Uptime</strong></div>}>
                            <div className="text-3xl font-bold">99.9%</div>
                            <div className="small muted">Last 30 days</div>
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
                                return (
                                    <GuildCard
                                        key={g.id}
                                        id={g.id}
                                        name={g.name}
                                        iconUrl={iconUrl}
                                        status="connected"
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