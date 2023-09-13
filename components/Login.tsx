'use client';
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoIosLogIn, IoIosLogOut } from 'react-icons/io';

const Login = () => {

    const { data: session, status } = useSession();

    if (status === 'authenticated') {
        return (
            <div className="flex flex-row items-center justify-center space-x-3 fixed top-0 right-0 px-6 py-8">
                <div className="flex flex-row justify-center space-x-2">
                    <div className="flex items-center justify-center">
                        <Image src={session.user!.image as string} alt={session.user!.name as string} width={40} height={40} />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h4 className="lowercase font-semibold">
                            {session.user!.name}
                        </h4>
                        <p className="text-xs hidden lg:block">
                            {session.user!.email}
                        </p>
                    </div>
                </div>
                <div>
                    <button className="hover:scale-105 transition-all" onClick={() => signOut()}>
                        <IoIosLogOut size={45} className="mt-1" />
                    </button>
                </div>
            </div>
        )
    }

    if (status === 'loading') return <AiOutlineLoading3Quarters size={40} className="animate-spin fixed right-0 top-0 px-6 py-8" />

    return (
        <button onClick={() => signIn('google')} className="flex items-center justify-center rounded-md px-6 py-8 hover:scale-110 transition-all fixed top-0 right-0">
            <IoIosLogIn size={45} />
        </button>
    )
}

export default Login;