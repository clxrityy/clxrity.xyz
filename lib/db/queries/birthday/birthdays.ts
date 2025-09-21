import { getPrismaEdge } from '../../prismaEdge';
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
