export const runtime = 'edge';
let startedAt = Date.now();

export async function GET() {
    // NOTE: Replace guilds with real value when bot service available
    const uptimeMs = Date.now() - startedAt;
    const guilds = 0;
    return Response.json({ online: true, uptimeMs, guilds });
}
