'use client';

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
    children: ReactNode;
    session: Session
}

export default function Provider({ children, session }: Props) {

    return <SessionProvider session={session}>
        {children}
    </SessionProvider>
}