import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { getAuthUrlSync } from "@/lib/env";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: DefaultSession["user"] & { id: string };
    }
}

function sanitizeAuthEnv() {
    const keys = ["AUTH_URL", "NEXTAUTH_URL"] as const;
    for (const key of keys) {
        const val = process.env[key];
        if (!val) continue;
        let urlStr = val;
        if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`;
        try {
            const u = new URL(urlStr);
            // Force origin only; drop any path like /api/auth/callback/*
            const origin = u.origin;
            process.env[key] = origin;
        } catch {
            // If invalid, unset to allow Auth.js to infer from request when trustHost is true
            delete process.env[key];
        }
    }
}

sanitizeAuthEnv();

// Derive basePath from AUTH_URL/NEXTAUTH_URL if they include a path, to avoid mismatch warnings.
// function deriveBasePath(): string {
//     // Env URLs are sanitized to origin-only; use default basePath consistently.
//     return "/api/auth";
// }

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            // Request guilds scope to list user guilds on dashboard
            // Force consent to add scopes to existing grant, and request refresh if supported
            authorization: "https://discord.com/oauth2/authorize?scope=identify%20guilds&prompt=consent",
        }),
    ],
    session: { strategy: "database" },
    callbacks: {
        session({ session, user }) {
            if (session.user) (session.user).id = user.id;
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
    // When true, allows NEXTAUTH_URL/AUTH_URL to be omitted and inferred from request
    // We sanitize these envs to origin-only above to avoid path mismatches
    trustHost: true,
    // basePath: deriveBasePath(),
    // Supply origin URL explicitly for server actions context
    //  @ts-expect-error: url is supported by Auth.js, types may lag
    url: getAuthUrlSync(),
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
