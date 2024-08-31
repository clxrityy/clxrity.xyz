import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Track } from "@clxrity/react-audio";
import { Keys } from "@/types/audio";
import GuitarItem from "../elements/GuitarItem";
import { Suspense } from "react";

interface ExtendedTrack {
    bpm?: number;
    key?: keyof typeof Keys | string;
    track: Track;
}

type Props = {
    tracks: ExtendedTrack[];
}

export default function Awards({ tracks }: Props) {
    return (
        <Carousel className="max-w-[500px] min-w-[120px] h-fit flex items-center">
            <CarouselContent className="w-full h-full">
                {tracks.map((track, index) => (
                    <CarouselItem key={index} className="w-full">
                        <div className="p-3 w-full mx-auto">
                            <Card className="w-full mx-auto">
                                <CardHeader className="px-2 py-1">
                                    <CardTitle>
                                        {track.track.title}
                                    </CardTitle>
                                    <CardDescription>
                                        <div>
                                            <ul className="font-mono">
                                                <li>
                                                    {track.bpm && <span>
                                                        BPM: <span className="font-bold">
                                                            {track.bpm}
                                                        </span>
                                                    </span>}
                                                </li>
                                                <li>
                                                    {track.key && <span>
                                                        Key: <span className="font-bold">
                                                            {track.key}
                                                        </span>
                                                    </span>}
                                                </li>
                                            </ul>
                                        </div>
                                    </CardDescription>
                                </CardHeader>

                                <div className="max-w-[400px] h-[115px] flex items-center justify-center my-auto">
                                    <Suspense fallback={<div className="bg-gray-700 rounded-lg animate-pulse w-full h-full" />}>
                                        <GuitarItem track={{
                                            title: track.track.title,
                                            src: track.track.src,
                                        }}
                                        />
                                    </Suspense>
                                </div>

                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    )
}