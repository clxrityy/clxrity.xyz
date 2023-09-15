import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'clxrity | Privacy Policy'
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
    }) {
    
    return (
        <div>
            {children}
        </div>
    )
}