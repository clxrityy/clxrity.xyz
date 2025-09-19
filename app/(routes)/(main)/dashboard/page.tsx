import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthUrlSync } from "@/lib/env";
import { Button, Card, Badge, EmptyState } from "@/components/ui";
import UserMenu from "@/components/dashboard/UserMenu";
import { INVITE_URL } from "@/lib/config/urls";
import IconCake from "@/components/icons/IconCake";
import IconDashboard from "@/components/icons/IconDashboard";
import "./dashboard.css";
import styles from "./dashboard.module.css";

export const dynamic = 'force-dynamic';

// Guild management UI is under construction; coming soon.

export default async function Page() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className={styles.dashboardContainer}>
                <div className={styles.dashboardInner}>
                    <h1>Sign in required</h1>
                    <Link href={`/api/auth/signin?provider=discord&callbackUrl=${encodeURIComponent(getAuthUrlSync())}`} className="no-underline">
                        <Button leftIcon={<span className="icon">🔐</span>}>Sign in with Discord</Button>
                    </Link>
                </div>
            </main>
        );
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

    // Guild management section is simplified until the full UI ships.

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
        <main className={styles.dashboardContainer}>
            <div className={styles.dashboardInner}>
                <header className={"row between center " + styles.pageHeader}>
                    <div className="stack">
                        <nav className={"breadcrumb small muted " + styles.breadcrumb}>
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
                        <div className="dashboard-overview-grid">
                            <Card className={`${styles.statCard} elevated`} size="sm" variant="soft" header={<div className="row center"><span className="icon-circle"><IconDashboard size={16} /></span><strong className="ml-2">Guilds</strong></div>}>
                                <div className="text-3xl font-bold">{stats.totalGuilds}</div>
                                <div className="small muted">Servers using the bot</div>
                            </Card>
                        </div>
                    </Card>
                    <Card
                        className={`${styles.statCard} elevated`} size="sm" variant="soft" header={<div className="row center"><span className="icon-circle"><IconCake size={16} /></span><strong className="ml-2">Birthdays Today</strong></div>}>
                        <div className="text-3xl font-bold">{stats.birthdaysToday}</div>
                        <div className="small muted">Across all servers</div>
                    </Card>
                    <Card className={`${styles.statCard} elevated`} size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">⏰</span><strong className="ml-2">Scheduled</strong></div>}>
                        <div className="text-3xl font-bold">{stats.scheduledAnnouncements}</div>
                        <div className="small muted">Guilds sending today</div>
                    </Card>
                    <Card className={`${styles.statCard} elevated`} size="sm" variant="soft" header={<div className="row center"><span className="icon-circle">📚</span><strong className="ml-2">Total Birthdays</strong></div>}>
                        <div className="text-3xl font-bold">{stats.totalBirthdays}</div>
                        <div className="small muted">Records stored</div>
                    </Card>
                </section>


                <section className="stack">
                    <Card header={
                        <div className="row">
                            <h2 className="m-0">Manage Guilds</h2>
                            <Badge variant="accent">Coming soon</Badge>
                        </div>
                    }>
                        <div className="stack">
                            <EmptyState
                                title="Guild management is coming soon"
                                description="Soon you’ll manage per‑guild configurations (channels, roles, messages) and review bot logs for your servers from here."
                            />
                        </div>
                    </Card>
                </section>
            </div>
        </main>
    );
}