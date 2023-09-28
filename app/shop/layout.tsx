import Login from '@/components/Login';
import config from '@/config';
import type { Metadata } from 'next';
import { FaShoppingCart } from 'react-icons/fa';

export const metadata: Metadata = {
    title: 'clxrity | Shop',
    description: 'Purchase exclusive rights to music',
    themeColor: config.colors.complimentary,
}

export default async function ShopLayout({
    children
}: { children: React.ReactNode }) {
    
    return (
        <div className=''>
            <Login />
            {children}
        </div>
    )
}