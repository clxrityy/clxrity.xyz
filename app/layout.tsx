import type { Metadata } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/contexts/session";
import { Suspense } from "react";
import Loading from "./loading";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
  weight: ["300", "400", "500", "700"],
  preload: true,
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  variable: "--font-ubuntu-mono",
  display: "swap",
  weight: ["400", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: "clxOS",
  description: "A minimalistic OS for the web",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=6.0"
        />
        <link rel="icon" href="/favicon.ico" as="icon" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
          as="image"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
          as="image"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
          as="image"
        />
        {/* <link rel="manifest" href="/manifest.json" /> */}
      </head>
      <body className={`${ubuntu.variable} ${ubuntuMono.variable}`}>
        <Suspense fallback={<Loading />}>
          <SessionProvider>{children}</SessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
