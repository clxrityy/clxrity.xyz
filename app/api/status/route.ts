export const runtime = 'edge';
import { getCoreStatus } from './shared';

export async function GET() {
    // NOTE: Replace guilds/online with real values when bot service available
    const core = getCoreStatus();
    const uptimeMs = Date.now() - core.startedAt; // Backwards compatibility for polling clients
    return Response.json({ ...core, uptimeMs });
}

