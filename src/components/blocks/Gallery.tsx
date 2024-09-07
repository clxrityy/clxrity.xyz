"use client";
import { LibraryPlayer, LibraryTrackItem, type Track } from "@clxrity/react-audio";
import { useState } from "react";

interface ExtendedTrack {
    bpm?: number;
    key?: string;
    track: Track;
}

type Props = {
    tracks: ExtendedTrack[];
}

export default function Gallery({ tracks }: Props) {

    const trackList: Track[] = tracks.map(track => track.track);

    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const currentTrack = trackList[currentTrackIndex];

    return <div className="max-w-[400px] invert-[30%]">
        <div className="w-full flex flex-col items-center justify-center">
            <ul className="w-full">
                {trackList.map((track, index) => (
                    <div key={index} className="w-full h-fit max-h-[100px]">
                        <div className="flex flex-row gap-1 items-center w-full">
                            <LibraryTrackItem
                                selected={index === 0}
                                key={index}
                                track={track}
                                trackNumberLabel={`${index}`}
                                onClick={() => setCurrentTrackIndex(index)}
                            />
                        </div>
                    </div>
                ))}
            </ul>
            <div className="w-2/3">
                <LibraryPlayer
                    key={currentTrackIndex}
                    currentTrack={currentTrack}
                    trackCount={trackList.length}
                    trackIndex={currentTrackIndex}
                    onNext={() => setCurrentTrackIndex((i) => i + 1)}
                    onPrevious={() => setCurrentTrackIndex((i) => i - 1)}
                />
            </div>
        </div>
    </div>
}