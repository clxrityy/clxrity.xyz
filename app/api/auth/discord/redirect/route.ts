import { NextResponse } from "next/server";
import { getAuthUrlSync } from "@/lib/env";

// Redirect helper that forwards to NextAuth's Discord sign-in with an absolute callback URL
export async function GET(req: Request) {
    const url = new URL(req.url);
    const callback = url.searchParams.get("callback") || "/dashboard";

    const base = getAuthUrlSync(); // origin-only, e.g. https://hbd-dev.clxrity.xyz
    let callbackAbs: string;
    if (callback.startsWith("http")) {
        callbackAbs = callback;
    } else {
        const normalized = callback.startsWith("/") ? callback : `/${callback}`;
        callbackAbs = `${base}${normalized}`;
    }

    const signInUrl = `${base}/api/auth/signin?provider=discord&callbackUrl=${encodeURIComponent(callbackAbs)}`;
    return NextResponse.redirect(signInUrl, { status: 302 });
}
