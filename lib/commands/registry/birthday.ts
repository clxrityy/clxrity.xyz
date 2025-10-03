import { getZodiacSign } from '@/lib/astrology/zodiac';
import type { CommandContext, CommandReply, Embed } from '@/lib/commands/types';
import { errorEmbedFromError } from '@/lib/discord/embed/embed';

// export async function executeBirthdayRoot({ ctx }: { ctx: CommandContext }): Promise<CommandReply> {
//     const guildId = ctx.discord?.guildId;
//     const userId = ctx.discord?.userId;
//     if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };

//     const [{ getBirthday, canChangeBirthday }, { getGuildConfig }] = await Promise.all([
//         import('@/lib/db/queries/birthday/birthdaysEdge'),
//         import('@/lib/db/queries/config')
//     ]);
//     const cfg = await getGuildConfig(guildId);
//     const existing = await getBirthday(guildId, userId);
//     const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
//     const { buildBirthdayRootEmbed, buildBirthdayRootComponents } = await import('@/lib/discord/components/birthday');
//     const embed = buildBirthdayRootEmbed({ hasBirthday: !!existing, changeable, existing });
//     const components = buildBirthdayRootComponents({ hasBirthday: !!existing, changeable });
//     return { embeds: [embed], components, ephemeral: true };
// }

const birthdaySetEmbed = (
    {
        month,
        day
    }: { month: number; day: number }
): Embed => {
    const sign = getZodiacSign(month, day);

    return {
        description: `Your birthday has been set to \`${month}/${day}\`.`,
        color: sign?.color || 0x7289da,
        thumbnail: { url: sign?.thumbnail || '' },
    }
}

export async function executeBirthdaySet({ ctx, args }: { ctx: CommandContext; args: { month: number; day: number } }): Promise<CommandReply> {
    const guildId = ctx.discord?.guildId;
    const userId = ctx.discord?.userId;
    if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };

    // Validate date
    if (args.month < 1 || args.month > 12) {
        return { content: 'Month must be between 1 and 12.', ephemeral: true };
    }
    if (args.day < 1 || args.day > 31) {
        return { content: 'Day must be between 1 and 31.', ephemeral: true };
    }

    // Check for valid date (e.g., February 30th doesn't exist)
    const testDate = new Date(2024, args.month - 1, args.day); // 2024 is a leap year
    if (testDate.getMonth() !== args.month - 1 || testDate.getDate() !== args.day) {
        return { content: 'Invalid date. Please check the month and day combination.', ephemeral: true };
    }

    const [{ getBirthday, canChangeBirthday, setBirthday }, { getGuildConfig }] = await Promise.all([
        import('@/lib/db/queries/birthday/birthdaysEdge'),
        import('@/lib/db/queries/config')
    ]);

    const cfg = await getGuildConfig(guildId);
    const existing = await getBirthday(guildId, userId);

    // Check if user can change their birthday
    if (existing) {
        const changeable = await canChangeBirthday(guildId, userId, !!cfg?.changeable);
        if (!changeable) {
            return {
                content: 'You have already set your birthday and changes are not allowed in this server.',
                ephemeral: true
            };
        }
    }

    try {
        // Set the birthday
        await setBirthday(guildId, userId, args.month, args.day);

        return {
            embeds: [birthdaySetEmbed({ month: args.month, day: args.day })],
            ephemeral: true
        };
    } catch (error) {
        console.error('Error setting birthday:', error);
        return {
            embeds: [errorEmbedFromError(error)],
            ephemeral: true
        }
    }
}

export async function executeBirthdayView({ ctx, args }: { ctx: CommandContext; args: { user?: string } }): Promise<CommandReply> {
    const guildId = ctx.discord?.guildId;
    const userId = ctx.discord?.userId;
    if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };

    const targetUserId = args.user || userId;
    const { getBirthday } = await import('@/lib/db/queries/birthday/birthdaysEdge');
    const birthday = await getBirthday(guildId, targetUserId);

    if (!birthday) {
        const isViewingSelf = targetUserId === userId;
        const message = isViewingSelf
            ? "You haven't set your birthday yet. Use `/birthday set` to set it!"
            : "This user hasn't set their birthday yet.";
        return { content: message, ephemeral: true };
    }

    const { getZodiacSign } = await import('@/lib/astrology/zodiac');
    const zodiac = getZodiacSign(birthday.month, birthday.day);

    const isViewingSelf = targetUserId === userId;
    const userMention = isViewingSelf ? 'Your' : `<@${targetUserId}>'s`;

    const embed = {
        description: `${userMention} birthday: \`${birthday.month}/${birthday.day}\`\n`,
        color: zodiac?.color || 0x7289da,
        thumbnail: zodiac?.thumbnail ? { url: zodiac.thumbnail } : undefined
    };

    return { embeds: [embed], ephemeral: true };
}

export async function executeBirthdayCountdown({ ctx, args }: { ctx: CommandContext; args: { user?: string } }): Promise<CommandReply> {
    const guildId = ctx.discord?.guildId;
    const userId = ctx.discord?.userId;
    if (!guildId || !userId) return { content: 'Must be used in a server.', ephemeral: true };

    const targetUserId = args.user || userId;
    const { getBirthday } = await import('@/lib/db/queries/birthday/birthdaysEdge');
    const birthday = await getBirthday(guildId, targetUserId);

    if (!birthday) {
        const isViewingSelf = targetUserId === userId;
        const message = isViewingSelf
            ? "You haven't set your birthday yet. Use `/birthday set` to set it!"
            : "This user hasn't set their birthday yet.";
        return { content: message, ephemeral: true };
    }

    const now = ctx.now();
    const currentYear = now.getFullYear();
    let nextBirthday = new Date(currentYear, birthday.month - 1, birthday.day);

    // If birthday has passed this year, calculate for next year
    if (nextBirthday < now) {
        nextBirthday = new Date(currentYear + 1, birthday.month - 1, birthday.day);
    }

    const timeDiff = nextBirthday.getTime() - now.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // const isViewingSelf = targetUserId === userId;
    // const userMention = isViewingSelf ? 'Your' : `<@${targetUserId}>'s`;

    let description: string;
    if (daysUntil === 0) {
        description = "🎉 Today! 🎉";
    } else if (daysUntil === 1) {
        description = "🎂 Birthday is tomorrow!";
    } else {
        description = `\`${daysUntil}\` days`;
    }

    const embed = {
        description,
        color: getZodiacSign(birthday.month, birthday.day)?.color || 0x7289da,
        fields: [
            {
                name: 'Birthday',
                value: `${birthday.month}/${birthday.day}`,
                inline: true
            },
            {
                name: 'Next Birthday',
                value: `<t:${Math.floor(nextBirthday.getTime() / 1000)}:D>`,
                inline: true
            },
        ],
        thumbnail: getZodiacSign(birthday.month, birthday.day)?.thumbnail ? { url: getZodiacSign(birthday.month, birthday.day)!.thumbnail } : undefined
    };

    return { embeds: [embed], ephemeral: true };
}
