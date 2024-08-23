"use client";
import { AudioUpload } from "@/types/data";
import { AudioCategoryIcon, GenreAudioIcons, InstrumentAudioIcons, MoodAudioIcons, KeyAudioIcons } from "@/types/icons";
import { AudioPlayer } from "@clxrity/react-audio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveAs } from 'file-saver';
import { ICONS } from "@/config";

export default function AudioItem({ audio }: { audio: AudioUpload }) {

    const downloadAudio = () => {
        const downloadTitle = `${audio.title} @${audio.username}.wav`;

        return saveAs(audio.file, downloadTitle);
    }

    return <div className="flex flex-col items-center gap-4 justify-start w-full relative rounded-lg px-3 py-2">
        <div className="flex flex-col lg:flex-row items-center justify-center w-full">
            {
                audio.file && <AudioPlayer
                    track={{
                        title: audio.title,
                        src: audio.file,
                        author: { name: audio.username === "clxrityadmin" ? "clxrity" : audio.username! }
                    }}
                />
            }
            <div className="flex flex-col items-center justify-center my-5 px-4 max-w-xs">
                <p className="text-white/75">{audio.description}</p>
            </div>
        </div>
        <div className="flex flex-row gap-2 items-center justify-end py-2 px-5 rounded-lg w-full">
            {
                audio.genre && <AudioIcon categoryIcon={determinIcon("genre", audio.genre.toUpperCase())} />
            }
            {
                audio.mood && <AudioIcon categoryIcon={determinIcon("mood", audio.mood.toUpperCase())} />
            }
            {
                audio.instrument && <AudioIcon categoryIcon={determinIcon("instrument", audio.instrument.toUpperCase())} />
            }
            {
                audio.key && <AudioIcon categoryIcon={determinIcon("key", audio.key)} />
            }
            {
                audio.bpm && <p className="text-white bg-zinc-700/75 px-1 py-1 rounded-lg font-mono text-sm">{audio.bpm} BPM</p>
            }
        </div>
        <div className="absolute top-0 right-0 px-2 py-2">
            <button className="text-gray-400 hover:text-emerald-500 transition-colors" onClick={() => downloadAudio()}>
                {audio && <ICONS.download size={35} onClick={downloadAudio} />}
            </button>
        </div>
    </div>
}

interface AudioIconProps {
    categoryIcon: AudioCategoryIcon;
    size?: number;
}

function AudioIcon({ categoryIcon, size }: AudioIconProps) {
    const { icon: Icon, color, title } = categoryIcon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger aria-label={title}>
                    <Icon className="text-2xl" style={{ color }} size={size ? size : 20} />
                </TooltipTrigger>
                <TooltipContent className="border-none">
                    {title}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function determinIcon(category: "genre" | "mood" | "instrument" | "key", value: string): AudioCategoryIcon {
    switch (category) {
        case "genre":
            switch (value) {
                case "ALTERNATIVE":
                    return GenreAudioIcons.ALTERNATIVE;
                case "AMBIENT":
                    return GenreAudioIcons.AMBIENT;
                case "ELECTRONIC":
                    return GenreAudioIcons.ELECTRONIC;
                case "FOLK":
                    return GenreAudioIcons.FOLK;
                case "POP":
                    return GenreAudioIcons.POP;
                case "ROCK":
                    return GenreAudioIcons.ROCK;
                case "INDIE":
                    return GenreAudioIcons.INDIE;
                case "OTHER":
                    return GenreAudioIcons.OTHER;
                default:
                    return GenreAudioIcons.OTHER;
            }
        case "mood":
            switch (value) {
                case "ANGRY":
                    return MoodAudioIcons.ANGRY;
                case "CHILL":
                    return MoodAudioIcons.CHILL;
                case "HAPPY":
                    return MoodAudioIcons.HAPPY;
                case "SAD":
                    return MoodAudioIcons.SAD;
                case "ENERGETIC":
                    return MoodAudioIcons.ENERGETIC;
                case "HYPER":
                    return MoodAudioIcons.HYPER;
                case "NOSTALGIC":
                    return MoodAudioIcons.NOSTALGIC;
                case "ROMANTIC":
                    return MoodAudioIcons.ROMANTIC;
                default:
                    return GenreAudioIcons.OTHER;

            }
        case "instrument":
            switch (value) {
                case "GUITAR":
                    return InstrumentAudioIcons.GUITAR;
                case "PIANO":
                    return InstrumentAudioIcons.PIANO;
                case "DRUMS":
                    return InstrumentAudioIcons.DRUMS;
                case "BASS":
                    return InstrumentAudioIcons.BASS;
                case "SYNTH":
                    return InstrumentAudioIcons.SYNTH;
                case "STRINGS":
                    return InstrumentAudioIcons.STRINGS;
                case "OTHER":
                    return InstrumentAudioIcons.OTHER;
                default:
                    return InstrumentAudioIcons.OTHER;
            }
        case "key":
            switch (value) {
                case "C":
                    return KeyAudioIcons.C;
                case "C#":
                    return KeyAudioIcons.CSharp;
                case "D":
                    return KeyAudioIcons.D;
                case "D#":
                    return KeyAudioIcons.DSharp;
                case "E":
                    return KeyAudioIcons.E;
                case "F":
                    return KeyAudioIcons.F;
                case "F#":
                    return KeyAudioIcons.FSharp;
                case "G":
                    return KeyAudioIcons.G;
                case "G#":
                    return KeyAudioIcons.GSharp;
                case "A":
                    return KeyAudioIcons.A;
                case "A#":
                    return KeyAudioIcons.ASharp;
                case "B":
                    return KeyAudioIcons.B;
                case "Cm":
                    return KeyAudioIcons.CMinor;
                case "C#m":
                    return KeyAudioIcons.CSharpMinor;
                case "Dm":
                    return KeyAudioIcons.DMinor;
                case "D#m":
                    return KeyAudioIcons.DSharpMinor;
                case "Em":
                    return KeyAudioIcons.EMinor;
                case "Fm":
                    return KeyAudioIcons.FMinor;
                case "F#m":
                    return KeyAudioIcons.FSharpMinor;
                case "Gm":
                    return KeyAudioIcons.GMinor;
                case "G#m":
                    return KeyAudioIcons.GSharpMinor;
                case "Am":
                    return KeyAudioIcons.AMinor;
                case "A#m":
                    return KeyAudioIcons.ASharpMinor;
                case "unknown":
                    return KeyAudioIcons.UNKNOWN;
                default:
                    return KeyAudioIcons.UNKNOWN;
            }
    }

}