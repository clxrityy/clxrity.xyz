import { headers as nextHeaders } from "next/headers";

type GetBaseUrlOptions = {
    headers?: Headers | null;
};

export function getNodeEnv() {
    return process.env.NODE_ENV ?? "development";
}

export async function getBaseUrl(opts: GetBaseUrlOptions = {}) {
    // 1) Prefer explicit tunnel or configured public URL
    const cf = process.env.CF_TUNNEL_URL; // e.g., https://random-subdomain.trycloudflare.com
    if (cf) return stripTrailingSlash(cf);

    const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (authUrl) return stripTrailingSlash(authUrl);

    // 2) Platform specific envs
    if (process.env.VERCEL_URL) return `https://${stripTrailingSlash(process.env.VERCEL_URL)}`;
    if (process.env.RENDER_EXTERNAL_URL) return stripTrailingSlash(process.env.RENDER_EXTERNAL_URL);

    // 3) Infer from headers if available (in route handlers/server components)
    const hdrs = opts.headers ?? await tryGetNextHeaders();
    if (hdrs) {
        const proto = hdrs.get("x-forwarded-proto") || "https";
        const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
        if (host) return `${proto}://${stripTrailingSlash(host)}`;
    }

    // 4) Fallback to localhost in dev
    return getNodeEnv() === "production" ? "https://localhost" : "http://localhost:3000";
}

export async function getAuthUrl(opts: GetBaseUrlOptions = {}) {
    // Allow explicit override via AUTH_URL first
    if (process.env.AUTH_URL) return stripTrailingSlash(process.env.AUTH_URL);
    return await getBaseUrl(opts);
}

export async function absoluteUrl(path = "/", opts: GetBaseUrlOptions = {}) {
    const base = await getBaseUrl(opts);
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
}

async function tryGetNextHeaders(): Promise<Headers | null> {
    try {
        // At build time or outside request context this can throw
        return await nextHeaders();
    } catch {
        return null;
    }
}

function stripTrailingSlash(s: string) {
    return s.replace(/\/$/, "");
}
