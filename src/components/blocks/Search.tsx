"use client";

import { Genres, Instruments, Keys, Moods } from "@/types/audio";
import { AudioUpload } from "@/types/data";
import { SetStateAction, useState } from "react";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AudioSample from "../elements/AudioSample";

export default function Search({ audioUploads }: { audioUploads: AudioUpload[] }) {

    const [searchByKeyWordField, setSearchByKeyWordField] = useState<string>("");
    const [searchByGenreField, setSearchByGenreField] = useState<keyof typeof Genres>();
    const [searchByMoodField, setSearchByMoodField] = useState<keyof typeof Moods>();
    const [searchByBPMField, setSearchByBPMField] = useState<number>();
    const [searchByInstrumentField, setSearchByInstrumentField] = useState<keyof typeof Instruments>();
    const [searchByKey, setSearchByKey] = useState<keyof typeof Keys>();

    const filteredAudioUploads = audioUploads.filter((audioUpload) => {
        return audioUpload.title.toLowerCase().includes(searchByKeyWordField.toLowerCase()) || audioUpload.description?.toLowerCase().includes(searchByKeyWordField) &&
            (!searchByGenreField || audioUpload.genre === searchByGenreField) &&
            (!searchByMoodField || audioUpload.mood === searchByMoodField) &&
            (!searchByBPMField || audioUpload.bpm === searchByBPMField) &&
            (!searchByInstrumentField || audioUpload.instrument === searchByInstrumentField) &&
            (!searchByKey || audioUpload.key === searchByKey);
    });

    function list({ filteredUploads }: { filteredUploads: AudioUpload[]}) {
        const filtered = filteredUploads.map(upload => <AudioSample audio={upload} />);

        return <div>
            {filtered}
        </div>
    }

    function SearchByKeyWord() {
        return <Input
            placeholder="Search by keyword"
            onChange={(e) => setSearchByKeyWordField(e.target.value)}
            type="text"
        />
    }

    function SearchByGenre() {
        return <Select>
            <SelectTrigger>
                <SelectValue placeholder="Search by genre" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Genres</SelectLabel>
                    {
                        Object.keys(Genres).map((genre, i) =>
                            <SelectItem
                                key={i}
                                onClick={() => setSearchByGenreField(genre as keyof typeof Genres)}
                                value={genre}
                            >
                                {genre}
                            </SelectItem>
                        )
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    }

    function SearchByMood() {
        return <Select>
            <SelectTrigger>
                <SelectValue placeholder="Search by mood" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Moods</SelectLabel>
                    {
                        Object.keys(Moods).map((mood, i) =>
                            <SelectItem
                                key={i}
                                onClick={() => setSearchByMoodField(mood as keyof typeof Moods)}
                                value={mood}
                            >
                                {mood}
                            </SelectItem>
                        )
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    }

    function SearchByBPM() {
        return <Input
            placeholder="Search by BPM"
            onChange={(e) => setSearchByBPMField(parseInt(e.target.value))}
            type="number"
        />
    }

    function SearchByInstrument() {
        return <Select>
            <SelectTrigger>
                <SelectValue placeholder="Search by instrument" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Instruments</SelectLabel>
                    {
                        Object.keys(Instruments).map((instrument, i) =>
                            <SelectItem
                                key={i}
                                onClick={() => setSearchByInstrumentField(instrument as keyof typeof Instruments)}
                                value={instrument}
                            >
                                {instrument}
                            </SelectItem>
                        )
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    }

    function SearchByKey() {
        return <Select>
            <SelectTrigger>
                <SelectValue placeholder="Search by key" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Keys</SelectLabel>
                    {
                        Object.keys(Keys).map((key, i) =>
                            <SelectItem
                                key={i}
                                onClick={() => setSearchByKey(key as keyof typeof Keys)}
                                value={key}
                            >
                                {key}
                            </SelectItem>
                        )
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    }

    return (
        <div>

        </div>
    )
}
