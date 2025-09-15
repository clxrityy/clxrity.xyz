import { auth, signIn, signOut } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) {
        return (
            <main>
                <h1>Sign in required</h1>
                <form action={async () => { 'use server'; await signIn('discord'); }}>
                    <button>Sign in with Discord</button>
                </form>
            </main>
        );
    }
    return (
        <main>
            <h1>Dashboard</h1>
            <p>Welcome, {session.user.name ?? session.user.email ?? session.user.id}</p>
            <form action={async () => { 'use server'; await signOut(); }}>
                <button>Sign out</button>
            </form>
        </main>
    );
}
