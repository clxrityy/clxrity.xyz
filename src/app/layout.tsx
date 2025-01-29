import "@/styles/globals.css";
import type { Metadata } from 'next';
import { Kanit, Varela_Round } from 'next/font/google';



const kanit = Kanit({ subsets: ['latin'], weight: ["300", "400", "500", "700"], variable: "--font-kanit", preload: true });
const varela = Varela_Round({ variable: "--font-varela", preload: true, weight: ["400"], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'clxrity',
  description: 'A versatile and dynamic audio library for producers and creators. Completely free, open-source, community-driven, and royalty-free.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
      <html lang="en">
        <head>
          <title>clxrity</title>
          <link rel='icon' href='/favicon.ico' />
          <link rel='manifest' href='/site.webmanifest' />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta property='og:image' content='/apple-touch-icon.png' />
          <meta property="og:title" content="clxrity" />
          <meta property="og:description" content="Vocals and instrumentals" />
          <meta property="twitter:image" content="/apple-touch-icon.png" />
          <meta property="twitter:title" content="clxrity" />
          <meta property="twitter:description" content="Vocals and instrumentals" />
        </head>
        <body className={`${kanit.variable} ${varela.variable} dark`}>
          <div className="w-full h-full my-10 z-10">
            {children}
          </div>
        </body>
      </html>
  )
}
