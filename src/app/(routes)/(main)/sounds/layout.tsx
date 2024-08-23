import SoundsPanel from "@/components/structure/SoundsPanel";
import { Suspense } from "react";

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {

    return (
        <div className="relative min-h-screen min-w-screen">
            <Suspense fallback={<div className="fixed bottom-0 w-screen h-20 bg-zinc-950 animate-pulse" />}>
                <SoundsPanel />
            </Suspense>
            {children}
        </div>
    )
}