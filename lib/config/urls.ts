// Centralized, env-driven external URLs (client-safe via NEXT_PUBLIC_*)
export const INVITE_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#";
export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || "#";
export const DISCORD_SERVER_URL = process.env.NEXT_PUBLIC_DISCORD_SERVER_URL || "#";
// Optional external dashboard override; fall back to internal route
export const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard";

export function isExternalUrl(url: string) {
    return /^https?:\/\//i.test(url);
}
