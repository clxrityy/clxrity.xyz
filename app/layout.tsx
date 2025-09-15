import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE_NAME, SITE_TAGLINE, SITE_TWITTER } from "@/lib/config/site";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-quicksand",
    display: "swap",
});

export const metadata: Metadata = {
    title: SITE_NAME,
    description: SITE_TAGLINE,
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
        title: SITE_NAME,
        description: SITE_TAGLINE,
        card: "summary",
        creator: SITE_TWITTER,
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
        title: SITE_NAME,
        description: SITE_TAGLINE,
        url: new URL("https://hbd.clxrity.xyz"),
        siteName: SITE_NAME,
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${quicksand.variable}`}>
                <script
                    // Inline no-FOUC theme bootstrap
                    dangerouslySetInnerHTML={{
                        __html: `(()=>{try{const LS_KEY='theme';var t=localStorage.getItem(LS_KEY);if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
                    }}
                />
                <ThemeProvider>
                    <Header />
                    {children}
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
