"use client";
import { AudioUpload } from "@/types/data";
import { useState } from "react";
import { Input } from "../ui/input";
import AudioItem from "../elements/AudioItem";


export default function Search({ audioUploads }: { audioUploads: AudioUpload[] }) {

    const [searchByKeyWordField, setSearchByKeyWordField] = useState<string>("");

    const filteredAudioUploads = audioUploads.filter((audioUpload) => {

        return audioUpload.title.toLowerCase().includes(searchByKeyWordField.toLowerCase()) || audioUpload.description?.toLowerCase().includes(searchByKeyWordField) || audioUpload.username?.toLowerCase().includes(searchByKeyWordField) || audioUpload.genre?.toLowerCase().includes(searchByKeyWordField) || audioUpload.mood?.toLowerCase().includes(searchByKeyWordField) || audioUpload.instrument?.toLowerCase().includes(searchByKeyWordField) || audioUpload.key?.toLowerCase().includes(searchByKeyWordField) || audioUpload.bpm?.toString().includes(searchByKeyWordField);
    });

    return (
        <div className="w-full flex flex-col gap-10 items-center justify-center h-full mx-auto">
            <div className="flex flex-col items-center lg:gap-2 w-2/3 mx-auto">
                <Input
                    key="search"
                    value={searchByKeyWordField}
                    placeholder="Search by keyword"
                    onChange={(e) => setSearchByKeyWordField(e.target.value)}
                    type="text"
                    className="rounded-xl border-white/25 hover:border-white/50 transition-opacity duration-300 ease-in-out placeholder:text-gray-400 hover:placeholder:text-inherit"
                />
            </div>
            <div className="flex flex-col gap-2 items-center border overflow-y-scroll h-[450px] md:h-[400px] lg:h-[400px] rounded-xl shadow-2xl drop-shadow-2xl border-white/25 bg-black/90">
                {filteredAudioUploads.map((audioUpload, idx) => (
                    <div key={idx} className="border-b border-b-white/50">
                        <AudioItem audio={audioUpload} />
                    </div>
                ))}
            </div>
        </div>
    )
}
