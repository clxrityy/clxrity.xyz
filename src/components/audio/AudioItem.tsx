"use client";
import { AudioUpload } from "@/types/data";
import { AudioCategoryIcon, GenreAudioIcons, InstrumentAudioIcons, MoodAudioIcons, KeyAudioIcons } from "@/types/icons";
import { Waveform, JustPlayer } from "@clxrity/react-audio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveAs } from 'file-saver';
import { COLORS, ICONS } from "@/config";
import Link from "next/link";
import useScreenSize from "@/hooks/useScreenSize";

export const downloadAudio = ({ title, username, file }: {
    title: string;
    username: string;
    file: string;
}) => {
    const downloadTitle = `${title} @${username}.wav`;

    return saveAs(file, downloadTitle);
}

export default function AudioItem({ audio }: { audio: AudioUpload }) {

    const { width } = useScreenSize();



    return <div className="flex flex-col items-center gap-3 justify-start w-full relative rounded-lg py-2">
        <div className="flex flex-col items-center justify-around w-full">
            <div className="flex flex-col items-center justify-center my-5 px-4 max-w-lg gap-3">
                <div className="flex flex-row gap-5 items-center">
                    <Link href={`/sounds/${audio.uuid}`} className="hover:underline transition hover:text-[#007bff]">
                        <h4 className="font-extrabold tracking-wide text-xl md:text-2xl lg:text-3xl">
                            {audio.title}
                        </h4>
                    </Link>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger aria-label="Download">
                                <button className={`text-[#58acec] hover:text-[#007bff] hover:scale-105 transition-all`} onClick={() => downloadAudio({ title: audio.title, file: audio.file, username: audio.username! })}>
                                    {audio && <ICONS.download size={35} />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="font-bold border-none">
                                Download
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {
                    audio.description && <div className="flex items-center justify-start w-full">
                        <p className="text-gray-200/75 text-sm md:text-base">
                        {audio.description}
                    </p>
                    </div>
                }
                <div className="flex items-center justify-start w-5/6 border-l-2 border-l-white/40">
                    <p className="text-gray-400 text-xs md:text-sm ml-2">
                        by <Link href={`/profile/${audio.userId}`} className="text-[#58acec] hover:text-[#007bff] hover:underline transition">
                            {audio.username === "clxrityadmin" ? "clxrity" : audio.username}
                        </Link>
                    </p>
                </div>
                {
                audio.file && <div className="w-full h-fit flex items-center justify-center">
                    {
                        width > 768 ? <Waveform
                            track={{
                                title: audio.title,
                                src: audio.file,
                                author: {
                                    name: audio.username === "clxrityadmin" ? "clxrity" : audio.username!,
                                    url: `/profile/${audio.userId}`
                                },
                            }}
                            size={{
                                width: 300,
                                height: 100
                            }}
                            color="#ffffff"
                            style={{
                                width: "100%",
                                height: 100
                            }}
                        /> : <JustPlayer track={{
                            title: audio.title,
                            src: audio.file,
                        }}
                            style={{
                                fontSize: "2rem",
                                backgroundColor: COLORS.blue,
                                paddingTop: "0.65rem",
                                borderRadius: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                paddingLeft: "1rem",
                                paddingRight: "1rem",
                            }}
                        />
                    }
                </div>
            }
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
                audio.bpm && <p className="text-white bg-zinc-700/50 px-[2.5px] py-1 rounded-lg font-mono text-sm text-center font-extrabold">{audio.bpm} BPM</p>
            }
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

export function determinIcon(category: "genre" | "mood" | "instrument" | "key", value: string): AudioCategoryIcon {
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