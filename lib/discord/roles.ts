// Discord role assignment helpers with simulation fallback when DISCORD_BOT_TOKEN is absent.

export type RoleOpResult = { userId: string; ok: boolean; status: number; simulated?: boolean; error?: string };

function getToken() {
    return process.env.DISCORD_BOT_TOKEN;
}

async function doFetch(url: string, method: string): Promise<{ ok: boolean; status: number; error?: string; simulated?: boolean }> {
    const token = getToken();
    if (!token) {
        console.log(`[roles][simulate:no-token] ${method} ${url}`);
        return { ok: true, status: 299, simulated: true };
    }
    try {
        const res = await fetch(url, { method, headers: { 'Authorization': `Bot ${token}` } });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { ok: false, status: res.status, error: text.slice(0, 300) };
        }
        return { ok: true, status: res.status };
    } catch (e: any) {
        return { ok: false, status: 0, error: e?.message || String(e) };
    }
}

export async function addRole(guildId: string, userId: string, roleId: string): Promise<RoleOpResult> {
    const r = await doFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, 'PUT');
    return { userId, ...r };
}

export async function removeRole(guildId: string, userId: string, roleId: string): Promise<RoleOpResult> {
    const r = await doFetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, 'DELETE');
    return { userId, ...r };
}

export async function syncBirthdayRole(
    guildId: string,
    roleId: string,
    birthdayTodayUserIds: string[],
    existingRoleHolders: string[]
) {
    // Determine adds (users who have birthday today but don't yet have role) and removals (have role but not today)
    const todaySet = new Set(birthdayTodayUserIds);
    const currentSet = new Set(existingRoleHolders);
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    for (const uid of birthdayTodayUserIds) if (!currentSet.has(uid)) toAdd.push(uid);
    for (const uid of existingRoleHolders) if (!todaySet.has(uid)) toRemove.push(uid);
    const addResults: RoleOpResult[] = [];
    const removeResults: RoleOpResult[] = [];
    // Run sequentially to avoid flooding; could batch with Promise.all at small scale
    for (const uid of toAdd) addResults.push(await addRole(guildId, uid, roleId));
    for (const uid of toRemove) removeResults.push(await removeRole(guildId, uid, roleId));
    return { addResults, removeResults };
}
