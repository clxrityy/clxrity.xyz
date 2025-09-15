import { getPrismaEdge } from '../prismaEdge';
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

type PrismaClientLike = ReturnType<typeof getPrismaEdge>;

export async function getBirthday(guildId: string, userId: string, prisma?: PrismaClientLike): Promise<BirthdayRow | null> {
    const client = prisma ?? getPrismaEdge();
    const own = !prisma;
    try {
        return await client.birthday.findUnique({ where: { userId_guildId: { userId, guildId } } });
    } finally {
        if (own) await client.$disconnect().catch(() => { });
    }
}

export async function setBirthday(guildId: string, userId: string, month: number, day: number, prisma?: PrismaClientLike): Promise<BirthdayRow> {
    if (!isValidMonthDay(month, day)) throw new Error('Invalid date');
    const client = prisma ?? getPrismaEdge();
    const own = !prisma;
    try {
        return await client.birthday.upsert({
            where: { userId_guildId: { userId, guildId } },
            update: { month, day },
            create: { userId, guildId, month, day },
        });
    } finally {
        if (own) await client.$disconnect().catch(() => { });
    }
}

export async function listTodayBirthdays(guildId: string, refDate = new Date(), prisma?: PrismaClientLike): Promise<BirthdayRow[]> {
    const month = refDate.getUTCMonth() + 1;
    const day = refDate.getUTCDate();
    const client = prisma ?? getPrismaEdge();
    const own = !prisma;
    try {
        return await client.birthday.findMany({ where: { guildId, month, day } });
    } finally {
        if (own) await client.$disconnect().catch(() => { });
    }
}

// Fetch all birthdays (all guilds) that match today's UTC month/day in a single SQL query (for announcements)
export async function listTodaysBirthdaysAllGuilds(refDate = new Date()): Promise<BirthdayRow[]> {
    const month = refDate.getUTCMonth() + 1;
    const day = refDate.getUTCDate();
    const sql = getEdgeDb();
    const rows = await sql`select * from "Birthday" where month = ${month} and day = ${day}`;
    return rows as any as BirthdayRow[];
}

export async function canChangeBirthday(guildId: string, userId: string, changeable: boolean, prisma?: PrismaClientLike): Promise<boolean> {
    if (changeable) return true;
    const existing = await getBirthday(guildId, userId, prisma);
    return !existing; // only allow if not set yet
}

export async function listGuildBirthdays(guildId: string, prisma?: PrismaClientLike): Promise<BirthdayRow[]> {
    const client = prisma ?? getPrismaEdge();
    const own = !prisma;
    try {
        return await client.birthday.findMany({ where: { guildId } });
    } finally {
        if (own) await client.$disconnect().catch(() => { });
    }
}
