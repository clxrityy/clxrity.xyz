import { getEdgeDb } from '../neon';

export type GuildConfigRow = {
    id: string;
    guildId: string;
    adminRoleId: string | null;
    birthdayRoleId: string | null;
    birthdayChannel: string | null;
    birthdayMessage: string | null;
    changeable: boolean;
    createdAt: string;
    updatedAt: string;
};

export async function getGuildConfig(guildId: string): Promise<GuildConfigRow | null> {
    const sql = getEdgeDb();
    const rows = await sql`select * from "GuildConfig" where "guildId" = ${guildId} limit 1`;
    return (rows as any[])[0] || null;
}

export async function upsertGuildConfig(input: Partial<GuildConfigRow> & { guildId: string }): Promise<GuildConfigRow> {
    const sql = getEdgeDb();
    // Track which fields were explicitly provided so we only update those
    const hasAdminRoleId = Object.hasOwn(input, 'adminRoleId');
    const hasBirthdayRoleId = Object.hasOwn(input, 'birthdayRoleId');
    const hasBirthdayChannel = Object.hasOwn(input, 'birthdayChannel');
    const hasBirthdayMessage = Object.hasOwn(input, 'birthdayMessage');
    const hasChangeable = Object.hasOwn(input, 'changeable');
    const rows = await sql`
    insert into "GuildConfig" (id, "guildId", "adminRoleId", "birthdayRoleId", "birthdayChannel", "birthdayMessage", changeable, "createdAt", "updatedAt")
    values (
      gen_random_uuid()::text,
      ${input.guildId},
      ${input.adminRoleId ?? null},
      ${input.birthdayRoleId ?? null},
      ${input.birthdayChannel ?? null},
      ${input.birthdayMessage ?? null},
      coalesce(${input.changeable as any}, false),
      now(),
      now()
    )
    on conflict ("guildId") do update set
      "adminRoleId" = case when ${hasAdminRoleId} then excluded."adminRoleId" else "GuildConfig"."adminRoleId" end,
      "birthdayRoleId" = case when ${hasBirthdayRoleId} then excluded."birthdayRoleId" else "GuildConfig"."birthdayRoleId" end,
      "birthdayChannel" = case when ${hasBirthdayChannel} then excluded."birthdayChannel" else "GuildConfig"."birthdayChannel" end,
      "birthdayMessage" = case when ${hasBirthdayMessage} then excluded."birthdayMessage" else "GuildConfig"."birthdayMessage" end,
      changeable = case when ${hasChangeable} then excluded.changeable else "GuildConfig".changeable end,
      "updatedAt" = now()
    returning *
  `;
    return (rows as any[])[0];
}
