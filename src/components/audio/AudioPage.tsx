"use client";

import useScreenSize from "@/hooks/useScreenSize";
import { AudioUpload } from "@/types/data";
import { Waveform } from "@clxrity/react-audio";
import Image from "next/image";
import Link from "next/link";
import { COLORS } from "@/config";
import { useEffect, useState } from "react";

type Props = {
    upload: AudioUpload
};

export default function AudioPage({ upload }: Props) {

    const { width, height } = useScreenSize();

    const [canvasWidth, setCanvasWidth] = useState<number>(width / 1.25);

    useEffect(() => {
        if (width > 1024) {
            setCanvasWidth(width / 2);
        } else if (width > 768) {
            setCanvasWidth(width / 1.25);
        } else if (width > 640) {
            setCanvasWidth(width / 1.5);
        } else { 
            setCanvasWidth(width / 1.75);
        }
    }, [width]);

    return (
        <div className="w-full h-full">
            <div className="flex items-center justify-center flex-col w-full h-full mx-auto gap-12">
                <div className="flex flex-row items-center gap-5">
                    {
                        upload.thumbnail && (
                            <Image
                                src={upload.thumbnail}
                                width={300}
                                height={300}
                                alt={upload.title}
                            />
                        )
                    }
                    <div className="flex flex-col items-center gap-4">
                        <h1>
                            {upload.title}
                        </h1>
                        <div className="flex flex-col lg:flex-col gap-3 items-center">
                            <h5 className="font-semibold text-xl tracking-tigher">
                                Uploaded by: <Link href={`/profile/${upload.userId}`} className="hover:underline transition text-blue-500 hover:text-blue-600">
                                    {upload.username}
                                </Link>
                            </h5>
                            <p className="text-white/75">
                                {upload.description}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="w-full flex items-center justify-center mx-auto my-auto py-10">
                    <Waveform
                        track={{
                            src: upload.file,
                        }}
                        size={{
                            width: canvasWidth,
                            height: height / 4
                        }}
                        canvasStyles={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                            width: canvasWidth,
                            height: height / 4,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}