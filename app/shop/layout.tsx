import config from '@/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'clxrity | Shop',
    description: 'Purchase exclusive rights to music',
    themeColor: config.colors.complimentary,
}

export default async function ShopLayout({
    children
}: { children: React.ReactNode }) {
    
    return (
        <div>
            {children}
        </div>
    )
}