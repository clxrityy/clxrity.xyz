import { getEdgeDb } from '../neon';

export type BirthdayRow = {
    id: string;
    userId: string;
    guildId: string;
    month: number;
    day: number;
    createdAt: string;
    updatedAt: string;
};

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidMonthDay(month: number, day: number): boolean {
    if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (month < 1 || month > 12) return false;
    const maxDay = MONTH_LENGTHS[month - 1];
    if (day < 1 || day > maxDay) return false;
    return true;
}

export function daysUntil(month: number, day: number, refDate = new Date()): number {
    const year = refDate.getUTCFullYear();
    const targetThisYear = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    const nowUtc = Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate(), 0, 0, 0, 0);
    if (targetThisYear >= nowUtc) {
        return Math.round((targetThisYear - nowUtc) / 86400000);
    }
    const nextYear = Date.UTC(year + 1, month - 1, day, 0, 0, 0, 0);
    return Math.round((nextYear - nowUtc) / 86400000);
}

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
