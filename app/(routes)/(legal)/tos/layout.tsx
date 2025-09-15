import { Metadata } from 'next';
import './tos.css';

export const metadata: Metadata = {
    title: 'hbd — Terms of Service & Privacy Policy',
    description: 'Legal information for the hbd Discord bot: Terms of Service and Privacy Policy.',
    robots: { index: false, follow: true, nocache: true }
};

export default async function TosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return <div className='tos-layout'>
        <div className='tos-container'>
            {children}
        </div>
    </div>;
}