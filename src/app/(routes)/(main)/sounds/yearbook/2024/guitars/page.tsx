import { ICONS } from "@/config";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Track } from "@clxrity/react-audio";
import { Keys } from "@/types/audio";
import Gallery from "@/components/blocks/Gallery";

const Awards = dynamic(() => import("@/components/blocks/Awards"));

export default async function Page() {

    const awards: {
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
            },
            {
                track: {
                    title: "processed strum",
                    author: {
                        name: "clxrity",
                    },
                    src: "/assets/audio/yearbook/awards/processed-strum-[140].wav",
                },
                bpm: 140,
            }
        ];

    const gallery: {
        track: Track;
        bpm?: number;
        key?: keyof typeof Keys;
    }[] = [
            {
            track: {
                    title: "inner seven",
                    src: "/assets/audio/yearbook/gallery/inner-seven-[88].wav",
                    author: {
                        name: "clxrity"
                    }
            },
            bpm: 88,
            },
            {
                track: {
                    title: "the trees",
                    src: "/assets/audio/yearbook/gallery/the-trees-[93].wav",
                    author: {
                        name: "clxrity"
                    }
                },
                bpm: 93,
        }
    ];

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
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-10 mx-auto h-max px-20 py-4 rounded-md w-full xl:w-4/5">
                {/**
                 * awards (carousel)
                 */}
                <div className="w-full flex flex-col gap-5 items-center justify-center mx-auto border-r border-b border-gray-200/40 rounded-lg shadow-xl">
                    <h3 className="flex flex-row items-start gap-2 font-bold justify-start w-full 2xl:justify-center uppercase font-kanit before:text-gray-300 after:text-gray-200 underline underline-offset-8 animate-pulse text-start">
                        Awards <ICONS.award />
                    </h3>
                    <div className="w-fit">
                        <Suspense fallback={<div className="bg-gray-800/20 rounded-xl animate-pulse w-full h-full py-5" />}>
                            <Awards tracks={awards} />
                        </Suspense>
                    </div>
                </div>
                <div className="w-full flex-col flex gap-5 items-center justify-center mx-auto border-l border-b border-gray-200/40 shadow-xl rounded-lg">
                    <h3 className="flex flex-row items-start gap-2 font-bold justify-end w-full 2xl:justify-center uppercase font-kanit before:text-gray-300 after:text-gray-200 underline underline-offset-8 animate-pulse text-start">
                        Gallery <ICONS.gallery />
                    </h3>
                    <div className="w-full bg-slate-700/30 rounded-xl mb-6 ml-6 flex items-center justify-center">
                        <Suspense fallback={<div className="bg-gray-800/50 rounded-xl animate-pulse w-full h-full py-5" />}>
                            <Gallery tracks={gallery} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}