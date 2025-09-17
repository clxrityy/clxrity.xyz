import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { Button, Card, Badge, Grid, Skeleton, EmptyState } from "@/components/ui";
import UserMenu from "@/components/dashboard/UserMenu";
import { INVITE_URL } from "@/lib/config/urls";

export const dynamic = 'force-dynamic';

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

    // Example guilds grid and stats (replace with real data)
    const loading = false;
    const guilds = loading ? [] : [{ id: "1", name: "My Guild" }];
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
        <main className="stack-lg">
            <header className="row">
                <div className="stack">
                    <h1 className="m-0">Dashboard</h1>
                    <p className="muted m-0">Manage your servers, birthday announcements, and roles.</p>
                </div>
                {/* Avatar menu (client) */}
                <UserMenu inviteUrl={INVITE_URL} avatarUrl={avatarUrl} name={displayName} />
            </header>

            <section className="stack">
                <h2 className="m-0">Overview</h2>
                <Grid cols={3} gap="md">
                    <Card header={<strong>Guilds</strong>}>
                        <div className="text-2xl font-bold">{stats.guildCount}</div>
                        <div className="small muted">Connected</div>
                    </Card>
                    <Card header={<strong>Birthdays Today</strong>}>
                        <div className="text-2xl font-bold">{stats.birthdaysToday}</div>
                        <div className="small muted">Across all servers</div>
                    </Card>
                    <Card header={<strong>Scheduled</strong>}>
                        <div className="text-2xl font-bold">{stats.scheduledAnnouncements}</div>
                        <div className="small muted">Announcements queued</div>
                    </Card>
                </Grid>
            </section>

            <section className="stack">
                <div className="row">
                    <h2 className="m-0">Your Guilds</h2>
                    <Badge variant="accent">Beta</Badge>
                </div>

                {loading && (
                    <Grid cols={3} gap="md">
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                    </Grid>
                )}
                {!loading && guilds.length === 0 && (
                    <div>
                        <EmptyState
                            title="No servers yet"
                            description="Invite the bot to a server you manage to get started."
                            actionText="Invite bot"
                        />
                        <div className="mt-3">
                            <Link href={INVITE_URL} className="no-underline">
                                <Button leftIcon={<span>➕</span>}>Invite Bot</Button>
                            </Link>
                        </div>
                    </div>
                )}
                {!loading && guilds.length > 0 && (
                    <Grid cols={3} gap="md">
                        {guilds.map(g => (
                            <Card
                                key={g.id}
                                clickable
                                header={<strong>{g.name}</strong>}
                                footer="Manage announcements and roles"
                            >
                                <div className="row">
                                    <span className="small muted">ID: {g.id}</span>
                                    <Badge size="sm" variant="neutral">Connected</Badge>
                                </div>
                            </Card>
                        ))}
                    </Grid>
                )}
            </section>
        </main>
    );
}