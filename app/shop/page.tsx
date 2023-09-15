'use client';
import { useSession } from "next-auth/react"

export default function ShopHome() {

    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <p>Loading</p>;
    }

    if (status === 'unauthenticated') {
        return <p>LOGIN TO ACCESS</p>
    }

    return (
        <div>
            
        </div>
    )
}