import { Toaster } from 'react-hot-toast';

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full">
            <Toaster position='top-right' />
            {children}
        </div>
    )
 }