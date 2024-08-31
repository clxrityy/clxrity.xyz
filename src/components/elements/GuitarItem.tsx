"use client";

import useScreenSize from "@/hooks/useScreenSize";
import { Keys } from "@/types/audio";
import { type Track, Waveform, JustPlayer } from "@clxrity/react-audio";

type Props = {
    track: Track;
    bpm?: number;
    key?: keyof typeof Keys;
}

export default function GuitarItem({ track }: Props) {

    const { width } = useScreenSize();

    if (width < 768) {
        return <div className="w-full h-full flex items-center justify-center mx-auto">
            <JustPlayer
                track={track}
                style={{
                    backgroundColor: "#007bff",
                    paddingTop: "0.5rem",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    paddingLeft: "0.5rem",
                    paddingRight: "0.5rem",
                    paddingBottom: "-0.5rem",
                    fontSize: "2rem"
                }}
            />
        </div>
    } else {
        return <div className="w-full h-full flex items-center justify-center mx-auto">
        <Waveform
            track={track}
            size={{
                width: 300,
                height: 100
            }}
            color="#ffffff"
            style={{
                width: "100%",
                height: 100
            }}
            canvasStyles={{
                width: "100%",
                height: 100
            }}
        />
    </div>
    }
}