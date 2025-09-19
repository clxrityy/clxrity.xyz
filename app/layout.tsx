import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "‎",
    openGraph: {
        images: [
            {
                url: "https://clxrity.xyz/favicon.ico",
                alt: "clxrity.xyz",
            }
        ]
    },
    twitter: {
        card: "summary",
        title: "",
        description: "",
        images: [
            {
                url: "https://clxrity.xyz/favicon.ico",
                alt: "clxrity.xyz",
            }
        ]
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
        other: [
            { rel: "apple-touch-icon", url: "https://clxrity.xyz/apple-touch-icon.png" },
            { rel: "android-chrome-192x192", url: "https://clxrity.xyz/android-chrome-192x192.png" },
            { rel: "android-chrome-512x512", url: "https://clxrity.xyz/android-chrome-512x512.png" },
        ],
    },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
