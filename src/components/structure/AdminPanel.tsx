"use client";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ComponentProps } from "react";
import AddAudioForm from "../forms/AddAudio";

// ICONS
import { PiFileAudioBold } from "react-icons/pi";

/**
 * MAIN COMPONENT
 */

export default function AdminPanel() {
    return (
        <div className="fixed bottom-0 w-screen bg-zinc-950/75 h-20">
            <div className="w-full h-full flex items-center px-8 justify-stretch">
                {PANEL_OPTIONS.map((option, index) => (
                    <PanelOption
                        key={index}
                        {...option}
                        className="flex-1"
                    />
                ))}
            </div>
        </div>
    )
}


/**
 * PANEL OPTIONS
 */

type PanelOptionProps = {
    trigger: React.ReactNode;
    title: string;
    description: string;
    footer: React.ReactNode;
    children: Readonly<React.ReactNode>;
} & ComponentProps<typeof SheetContent>

/**
 * 
 * @param trigger - The trigger element that will open the panel
 * @param title - The title of the panel
 * @param description - The description of the panel
 * @param footer - The footer element of the panel
 * @param children - The content of the panel 
 * 
 * 
 * @see https://ui.shadcn.com/docs/components/sheet
 */

function PanelOption({
    trigger,
    title,
    description,
    footer,
    children,
    ...props
}: PanelOptionProps) {
    return (
        <Sheet {...props}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent side={"bottom"} className="w-2/3 mx-auto flex flex-col gap-4">
                <SheetHeader className="gap-2">
                    <SheetTitle className="text-xl font-semibold">
                        {title}
                    </SheetTitle>
                    <SheetDescription className="text-gray-400">
                        {description}
                    </SheetDescription>
                </SheetHeader>
                    {children}
                <SheetFooter>
                    <SheetClose asChild>
                        {footer}
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

/**
 * PANEL OPTIONS CONSTANTS
 */

const PANEL_OPTIONS: PanelOptionProps[] = [
    {
        trigger: (
            <Button
                variant={"outline"}
                size={"lg"}
                className="rounded-xl focus:ring ring-white"
            >
                <PiFileAudioBold className="inline-block mr-2" size={16} /> Add audio 
            </Button>
        ),
        title: "Add a new sample",
        description: "Upload a new audio sample to be discovered by other users. Only audio files are allowed!",
        footer: (
            <Button
                variant={"outline"}
                className="rounded-lg my-10"
            >
                Close
            </Button>
        ),
        children: (
            <div className="flex items-center">
                <AddAudioForm />
            </div>
        )
    }
]