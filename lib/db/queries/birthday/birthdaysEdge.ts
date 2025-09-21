import { getEdgeDb } from '../../neon';
import { isValidMonthDay } from './birthdayUtils';

export type BirthdayRow = {
    id: string;
    userId: string;
    guildId: string;
    month: number;
    day: number;
    createdAt: string;
    updatedAt: string;
};

// date helpers provided by ./birthdayUtils

export async function getBirthday(guildId: string, userId: string): Promise<BirthdayRow | null> {
    const sql = getEdgeDb();
    const rows = await sql`select * from "Birthday" where "guildId" = ${guildId} and "userId" = ${userId} limit 1`;
    return (rows as any[])[0] || null;
}

export async function setBirthday(guildId: string, userId: string, month: number, day: number): Promise<BirthdayRow> {
    if (!isValidMonthDay(month, day)) throw new Error('Invalid date');
    const sql = getEdgeDb();
    const rows = await sql`
    insert into "Birthday" (id, "userId", "guildId", month, day, "createdAt", "updatedAt")
    values (gen_random_uuid()::text, ${userId}, ${guildId}, ${month}, ${day}, now(), now())
    on conflict ("userId", "guildId") do update set month = excluded.month, day = excluded.day, "updatedAt" = now()
    returning *
  `;
    return (rows as any[])[0];
}

export async function listTodayBirthdays(guildId: string, refDate = new Date()): Promise<BirthdayRow[]> {
    const month = refDate.getUTCMonth() + 1;
    const day = refDate.getUTCDate();
    const sql = getEdgeDb();
    const rows = await sql`select * from "Birthday" where "guildId" = ${guildId} and month = ${month} and day = ${day}`;
    return rows as any as BirthdayRow[];
}

export async function listTodaysBirthdaysAllGuilds(refDate = new Date()): Promise<BirthdayRow[]> {
    const month = refDate.getUTCMonth() + 1;
    const day = refDate.getUTCDate();
    const sql = getEdgeDb();
    const rows = await sql`select * from "Birthday" where month = ${month} and day = ${day}`;
    return rows as any as BirthdayRow[];
}

export async function canChangeBirthday(guildId: string, userId: string, changeable: boolean): Promise<boolean> {
    if (changeable) return true;
    const existing = await getBirthday(guildId, userId);
    return !existing;
}

export async function listGuildBirthdays(guildId: string): Promise<BirthdayRow[]> {
    const sql = getEdgeDb();
    const rows = await sql`select * from "Birthday" where "guildId" = ${guildId}`;
    return rows as any as BirthdayRow[];
}
