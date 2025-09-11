// Utilities for Discord permission bitfields and role checks

// Discord permission bits (subset)
const ADMINISTRATOR = 1n << 3n; // 8
const MANAGE_GUILD = 1n << 5n; // 32

export function hasAdminPermission(bitfield?: string): boolean {
    if (!bitfield) return false;
    try {
        const v = BigInt(bitfield);
        return (v & ADMINISTRATOR) !== 0n || (v & MANAGE_GUILD) !== 0n;
    } catch {
        return false;
    }
}

export function hasRole(memberRoleIds: string[] | undefined, roleId: string | null | undefined): boolean {
    if (!memberRoleIds || !roleId) return false;
    return memberRoleIds.includes(roleId);
}
