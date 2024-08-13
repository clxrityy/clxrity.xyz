"use client";
import { type Track, AudioLibrary } from "@clxrityy/react-audio";
import { ComponentProps } from "react";

interface Props extends ComponentProps<"div"> {
    tracks: Track[];
}

export default function AudioList({ tracks, ...props }: Props) { 
    return (
        <div {...props} className="w-2/3">
            <AudioLibrary tracks={tracks} style={{
                border: "none"
            }} />
        </div>
    );
}