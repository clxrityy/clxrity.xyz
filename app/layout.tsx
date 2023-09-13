import Provider from '@/components/Provider';
import Toast from '@/components/Toast';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Session } from 'next-auth';
import type { AppProps } from 'next/app';

import { Inter } from 'next/font/google';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'clxrity',
  description: 'Gain access to vocals and instrumentals recorded by clxrity',
}
export default function RootLayout({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
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
      <Provider session={pageProps.session}>
        <body className={inter.className}>
          <Component {...pageProps} />
          <Toast />
        </body>
      </Provider>
    </html>
  )
}
