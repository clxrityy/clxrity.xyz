export const runtime = 'edge';

import { z } from 'zod';
import { getEdgeDb } from '@/lib/db/neon';

const CommandSchema = z.object({
  name: z.string().min(1),
  args: z.record(z.string(), z.any()).default({}),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CommandSchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify({ error: z.treeifyError(parsed.error) }), { status: 400 });
  const sql = getEdgeDb();
  const { name, args } = parsed.data;
  const id = crypto.randomUUID();
  const rows = await sql`
    insert into "Event" (id, type, payload, "createdAt")
    values (${id}, 'command', jsonb_build_object('name', ${name}, 'args', ${JSON.stringify(args)}::jsonb), now())
    returning id
  `;
  return Response.json({ accepted: true, id: (rows as unknown as Array<{ id: string }>)[0].id });
}
