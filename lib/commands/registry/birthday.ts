import type { CommandContext, CommandReply } from '@/lib/commands/types';

export async function executeBirthdayRoot({ ctx }: { ctx: CommandContext }): Promise<CommandReply> {
    const guildId = ctx.discord?.guildId;
    const userId = ctx.discord?.userId;
    if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };

    const [{ getBirthday, canChangeBirthday }, { getGuildConfig }] = await Promise.all([
        import('@/lib/db/birthdaysEdge'),
        import('@/lib/db/config')
    ]);
    const cfg = await getGuildConfig(guildId);
    const existing = await getBirthday(guildId, userId);
    const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
    const { buildBirthdayRootEmbed, buildBirthdayRootComponents } = await import('@/lib/discord/birthdayComponents');
    const embed = buildBirthdayRootEmbed({ hasBirthday: !!existing, changeable, existing });
    const components = buildBirthdayRootComponents({ hasBirthday: !!existing, changeable });
    return { embeds: [embed], components, ephemeral: true };
}
