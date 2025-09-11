import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "hbd",
    description: "A Discord birthday bot",
    manifest: "/site.webmanifest",
    icons: [
        { rel: "icon", url: "/favicon.ico" },
        { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        {
            rel: "icon", url: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
        },
        {
            rel: "icon", url: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
        },
    ],
    keywords: ["discord", "bot", "birthday", "birthdays", "reminder", "role", "channel", "celebration", "fun", "announcement", "track"],
    category: "discord bot",
    twitter: {
        title: "hbd",
        description: "A Discord birthday bot",
        card: "summary",
        creator: "@yourclxrity",
        images: [
            {
                url: "/android-chrome-192x192.png",
                width: 192,
                height: 192,
                alt: "hbd logo",
            },
            { url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "hbd logo" },
            {
                url: "/favicon-32x32.png",
                width: 32,
                height: 32,
                alt: "hbd logo",
            },
            {
                url: "/favicon-16x16.png",
                width: 16,
                height: 16,
                alt: "hbd logo",
            }
        ]
    },
    openGraph: {
        title: "hbd",
        description: "A Discord birthday bot",
        url: "https://hbd.clxrity.xyz",
        siteName: "hbd",
        images: [
            {
                url: "/android-chrome-192x192.png",
                width: 192,
                height: 192,
                alt: "hbd logo",
            },
            { url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "hbd logo" },
            {
                url: "/favicon-32x32.png",
                width: 32,
                height: 32,
                alt: "hbd logo",
            },
            {
                url: "/favicon-16x16.png",
                width: 16,
                height: 16,
                alt: "hbd logo",
            }
        ],
        locale: "en-US",
        type: "website",
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
