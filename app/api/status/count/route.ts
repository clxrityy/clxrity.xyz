export const runtime = 'nodejs';

import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        // Count guilds the bot is configured in; this is our authoritative metric here
        const totalGuilds = await prisma.guildConfig.count();
        return Response.json({ guilds: totalGuilds, source: 'db' });
    } catch (e: any) {
        return Response.json({ guilds: 0, error: e?.message || 'count failed' }, { status: 500 });
    }
}
