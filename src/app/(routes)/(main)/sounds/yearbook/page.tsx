import { ICONS } from "@/config";
import Link from "next/link";

export default async function Page() {
    return (
        <div className="flex flex-col gap-10 items-center justify-center">
            <div className="flex flex-col items-start gap-3">
                <h1 className="flex flex-row items-center gap-2">
                    Yearbook <ICONS.book />
                </h1>
                <p>
                    Noteable sounds from across the years
                </p>
            </div>
            {/**
             * GUITARS & VOCALS 2024
             */}
            <div className="flex flex-row items-center text-center w-1/3 gap-5 justify-end">
                <Link href={"/sounds/yearbook/2024/guitars"} className="hover:underline underline-offset-4">
                    <h3 className="flex flex-row items-center gap-2">
                        Guitars <ICONS.guitar />
                    </h3>
                </Link>
                <hr className="border-white/75 border w-2" />
                <h4 className="font-mono tracking-wide opacity-80">
                    (2024)
                </h4>
            </div>
            <div className="flex flex-row items-center text-center w-1/3 gap-5 justify-end">
                <Link href={"/sounds/yearbook/2024/vocals"} className="hover:underline underline-offset-4">
                    <h3 className="flex flex-row items-center gap-2">
                        Vocals <ICONS.microphone />
                    </h3>
                </Link>
                <hr className="border-white/75 border w-2" />
                <h4 className="font-mono tracking-wide opacity-80">
                    (2024)
                </h4>
            </div>
        </div>
    )
}