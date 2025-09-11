import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "hbd.clxrity.xyz",
    description: "Refined app with Neon, Edge API routes, and OAuth dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
