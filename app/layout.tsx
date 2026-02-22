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
        ],
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
		authors: [
			{
				name: "MJ Anglin",
				url: "https://mjanglin.com",
			},
			{
				name: "clxrity",
				url: "https://github.com/clxrityy",
			}
		],
		creator: "MJ Anglin",
		publisher: "clxrity",
		metadataBase: new URL("https://clxrity.xyz"),
		manifest: "https://clxrity.xyz/site.webmanifest",
		appleWebApp: {
			statusBarStyle: "black-translucent",
			capable: true,
		},
		description: "Hub for clxrity networks.",
		keywords: ["clxrity", "mjanglin", "portfolio", "developer", "designer", "blog", "projects", "github", "apps", "software", "technology", "music", "art", "writing", "clxrity.xyz", "mjanglin.com", "os", "retro desktop", "web apps"],
		applicationName: "clxrity.xyz",
		abstract: "Hub for clxrity networks.",
		robots: {
			index: true,
			follow: true,
		},
		category: "technology",
		classification: "hub",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
