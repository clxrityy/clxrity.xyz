import { SessionProvider } from 'next-auth/react';
import Toast from '@/components/Toast';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Session } from 'next-auth';
import { getServerSession } from 'next-auth'

import { Inter } from 'next/font/google';
import Head from 'next/head';
import { authOptions } from '@/lib/authOptions';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'clxrity',
  description: 'Gain access to vocals and instrumentals recorded by clxrity',
}


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
  }) {
  
  const session: Session | null = await getServerSession(authOptions);

  return (
    <html lang="en">
      <Head>
        <title>clxrity</title>
        <link rel='icon' href='favicon.ico' />
        <link rel='manifest' href='/site.webmanifest' />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta property='og:image' content='/apple-touch-icon.png' />
      </Head>
      <SessionProvider session={session}>
        <body className={inter.className}>
          {children}
          <Toast />
        </body>
      </SessionProvider>
    </html>
  )
}
