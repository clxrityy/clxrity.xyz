import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { getAuthUrl } from "@/lib/env";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: DefaultSession["user"] & { id: string };
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
    session: { strategy: "database" },
    callbacks: {
        session({ session, user }) {
            if (session.user) (session.user).id = user.id;
            return session;
        },
    },
    trustHost: true,
    basePath: "/api/auth",
    // Dynamically provide base URL for callbacks based on env/platform/tunnel
    // NextAuth v5 reads from AUTH_URL by default; we supply a getter via URL
    // to ensure consistent behavior during dev with tunnels.
    // @ts-expect-error: NextAuth v5 supports `experimental`/`url` configuration paths that may be unstable across betas.
    url: getAuthUrl(),
    secret: process.env.AUTH_SECRET,
});
