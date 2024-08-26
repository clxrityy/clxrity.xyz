import { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "clxrity | Sounds",
        description: "Listen and download sounds for free.",
    }
}

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {

    return (
        <div className="relative min-h-screen min-w-screen">
            <Suspense fallback={<div className="fixed bottom-0 w-screen h-20 bg-zinc-950 animate-pulse" />}>
                
            </Suspense>
            {children}
        </div>
    )
}