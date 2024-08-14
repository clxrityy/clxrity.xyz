"use client";
import { IconType } from "react-icons/lib";
import { FaBookOpen } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { RiLoopRightLine } from "react-icons/ri";
import { BsSoundwave } from "react-icons/bs";
import { LuUndoDot } from "react-icons/lu";


export default function SoundsPanel() {
    return (
        <div className="fixed bottom-0 w-screen bg-zinc-950/75 h-20 flex flex-row justify-between items-center">
            <div className="w-fit h-full flex items-center px-8 justify-between gap-4 md:gap-5 lg:gap-6 xl:gap-8">
                {PANEL_OPTIONS.map((option, index) => (
                    <PanelOption
                        key={index}
                        {...option}
                    />
                ))}
            </div>

        </div>
    )
}

// PANEL OPTIONS

type PanelOptionProps = {
    title: string;
    description: string;
    href: string;
    icon: IconType;
}



function PanelOption({ title, description, href, icon: Icon }: PanelOptionProps) {
    const router = useRouter();

    return <button
        onClick={() => router.push(href)}
        className="border border-white/25 rounded-xl py-3 px-4 hover:border-white/50 transition-opacity duration-300 ease-in-out focus:ring focus:outline-none ring-blue-500 focus:ring-offset-2 z-10">

        <div className="flex flex-col items-center gap-1">
            <div className="flex flex-row items-center gap-2">
                <Icon />
                <h4 className="text-sm md:text-base">{title}</h4>
            </div>
            <p className="hidden sm:block text-xs md:text-sm text-white/60">{description}</p>
        </div>

    </button>
}

const PANEL_OPTIONS: PanelOptionProps[] = [
    {
        title: "Yearbook",
        description: "Yearly sound archives",
        href: "/sounds/yearbook",
        icon: FaBookOpen,
    },
    {
        title: "Loops",
        description: "Sound loops and samples",
        href: "/sounds/loops",
        icon: RiLoopRightLine,
    },
    {
        title: "Miscellaneous",
        description: "Random sounds and effects",
        href: "/sounds/misc",
        icon: BsSoundwave,
    },
    {
        title: "One-Shots",
        description: "Single instrument sounds",
        href: "/sounds/one-shots",
        icon: LuUndoDot,
    }
]

