import { getEdgeDb } from '../neon';

// Ensures a table exists to track daily announcement runs per guild.
// Uses (guildId, runDate) composite uniqueness to allow safe concurrent inserts.

export async function ensureRunMarkerTable() {
    const sql = getEdgeDb();
    await sql`create table if not exists "BirthdayRunMarker" (
    id uuid primary key default gen_random_uuid(),
    "guildId" text not null,
    "runDate" date not null,
    created_at timestamptz not null default now(),
    unique ("guildId", "runDate")
  )`;
}

export async function markGuildRunIfAbsent(guildId: string, date: Date): Promise<boolean> {
    const sql = getEdgeDb();
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const dateStr = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    try {
        const rows = await sql`insert into "BirthdayRunMarker" ("guildId", "runDate") values (${guildId}, ${dateStr}::date) on conflict do nothing returning id`;
        return (rows as any[]).length > 0; // true if inserted (first run), false if exists
    } catch (e: any) {
        // If a race condition or other insert issue happens, log once and treat as already existing.
        console.warn('[runMarkers] markGuildRunIfAbsent insert failed', e?.message || e);
        return false;
    }
}

export async function hasGuildRun(guildId: string, date: Date): Promise<boolean> {
    const sql = getEdgeDb();
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const dateStr = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const rows = await sql`select 1 from "BirthdayRunMarker" where "guildId" = ${guildId} and "runDate" = ${dateStr}::date limit 1`;
    return (rows as any[]).length > 0;
}
