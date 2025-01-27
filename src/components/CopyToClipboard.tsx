"use client";

import { Check, Copy, CopyCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function CopyToClipboardButton({ text }: { text: string }) {


    const [copiedText, setCopiedText] = useState<string>("");

    async function copy(txt: string) {
        const toastId = toast.success("Copied to clipboard!", {
            icon: <CopyCheck className="" />,
            iconTheme: {
                primary: "#10B981",
                secondary: "#888",
            },
            style: {
                backgroundColor: "#93c4fd",
                color: "#1e3a81",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                boxShadow: "0 0 0.5rem rgba(0, 0, 0, 0.1)",
            }
        });

        await navigator.clipboard.writeText(txt);
        setCopiedText(txt);
        setTimeout(() => {
            setCopiedText("");
            toast.dismiss(toastId);
        }, 2000);
    }

    return (
        <button className="absolute right-1 top-1 lg:top-0 lg:right-0 xl:-right-[0.4rem] xl:-top-[0.4rem] p-[0.6rem] rounded-2xl" onClick={async () => {
            await copy(text);
        }}>
            {copiedText === text ? <Check size={16} className="text-emerald-500/75 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8" /> : <Copy size={16} className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-zinc-400 hover:text-blue-400/65 transition-colors duration-100 ease-in-out" />}
        </button>
    )
}