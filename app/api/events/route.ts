export const runtime = 'edge';

import { z } from 'zod';
import { getEdgeDb } from '@/lib/neon';

const EventSchema = z.object({
    type: z.string().min(1),
    payload: z.any(),
});

export async function POST(req: Request) {
    const json = await req.json().catch(() => null);
    const parsed = EventSchema.safeParse(json);
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 });
    const sql = getEdgeDb();
    const { type, payload } = parsed.data;
    const id = crypto.randomUUID();
    const rows = await sql`
    insert into "Event" (id, type, payload, "createdAt")
    values (${id}, ${type}, ${JSON.stringify(payload)}::jsonb, now())
    returning id, "createdAt"
  `;
    return Response.json({ id: (rows as Array<{ id: string; createdAt: string }>)[0].id, createdAt: (rows as Array<{ id: string; createdAt: string }>)[0].createdAt });
}

export async function GET() {
    const sql = getEdgeDb();
    const rows = await sql`
    select id, type, payload, "createdAt" from "Event" order by "createdAt" desc limit 20
  `;
    return Response.json({ events: rows as Array<{ id: string; type: string; payload: unknown; createdAt: string }> });
}
