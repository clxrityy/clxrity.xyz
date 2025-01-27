import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";


const CopyToCliboardButton = dynamic(() => import("@/components/CopyToClipboard").then((mod) => mod.CopyToClipboardButton), { ssr: false });

export function Header() {
    return (
        <div className="header">
            <Image src={"/apple-touch-icon.png"} alt="mc.clxrity.xyz" width={100} height={100} className="w-24 h-24 2xl:w-32 2xl:h-32 animate-slow-spin filter drop-shadow-2xl" />
            <h1 className="relative">
                <Suspense fallback={<div>Loading...</div>}>
                    <CopyToCliboardButton text="mc.clxrity.xyz" />
                </Suspense>
                mc<span>.</span>clxrity<span>.</span>xyz
            </h1>
        </div>
    )
}