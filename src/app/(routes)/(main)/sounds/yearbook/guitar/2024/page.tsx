import { ICONS } from "@/config";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Track } from "@clxrity/react-audio";
import { Keys } from "@/types/audio";

const Awards = dynamic(() => import("@/components/blocks/Awards"));

export default async function Page() {

    const tracks: {
        track: Track;
        bpm?: number;
        key?: keyof typeof Keys;
    }[] = [
        {
            track: {
                title: "bring it in",
                author: {
                    name: "clxrity",
                },
                src: "/assets/audio/yearbook/awards/bring-it-in-[87].wav",
            },
            bpm: 87,
            },
            {
                track: {
                    title: "morning coffee",
                    author: {
                        name: "clxrity",
                    },
                    src: "/assets/audio/yearbook/awards/morning-coffee-[B-105].wav",
                },
                bpm: 105,
                key: "B",
            }
    ]

    return (
        <div className="w-full h-full flex flex-col gap-10 items-center justify-center">
            <div className="flex flex-col items-center text-center border-b w-1/3 pb-2 border-b-white/25">
                <h1 className="flex flex-row items-center gap-2">
                    Guitars <ICONS.guitar />
                </h1>
                <h4 className="font-mono">
                    2024
                </h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mx-auto bg-gradient-to-r from-black/50 to-slate-950/50 h-max px-20 py-4 rounded-md w-1/2">
                {/**
                 * awards (carousel)
                 */}
                <div className="w-full flex flex-col gap-2 items-center justify-center mx-auto">
                    <h3 className="font-mono uppercase flex flex-row items-center gap-1">
                        Awards <ICONS.award />
                    </h3>
                    <div className="w-fit">
                        <Suspense fallback={<div className="bg-gray-700 rounded-lg animate-pulse w-full h-full" />}>
                            <Awards tracks={tracks} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}