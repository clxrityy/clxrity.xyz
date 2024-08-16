"use client";
import { AudioUpload } from "@/types/data";
import { type Track, LibraryTrackItem, LibraryPlayer } from "@clxrityy/react-audio";
import { ComponentProps, useState } from "react";
import { ICONS } from "@/config";
import { Button } from "../ui/button";
import { deleteUpload } from "@/app/(actions)/uploads";
import { toast } from "react-hot-toast";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";



interface Props extends ComponentProps<"div"> {
    uploads: AudioUpload[] & { docId: string }[];
}

export default function AudioList({ uploads, ...props }: Props) {

    const tracks: Track[] = uploads.map((upload) => ({
        title: upload.title,
        src: upload.file,
        thumbnail: upload.thumbnail,
        author: {
            name: upload.username!
        }
    }));

    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const currentTrack = tracks[currentTrackIndex];

    return (
        <div {...props} className="w-2/3 flex items-center justify-center">
            <div className="w-full flex flex-col items-center justify-center">
                <ul className="w-full">
                    {tracks.map((track, index) => (
                        <ScrollArea key={index} className="w-full h-fit max-h-[100px]">
                            <div className="flex flex-row gap-1 items-center w-full">
                                <LibraryTrackItem
                                    key={index}
                                    track={track}
                                    trackNumberLabel={`${index}`}
                                    selected={index === currentTrackIndex}
                                    onClick={() => setCurrentTrackIndex(index)}
                                />
                                <Separator className="w-1 mx-4 bg-zinc-700 h-8" />
                                <ManageUpload upload={uploads[index]} />
                            </div>
                        </ScrollArea>
                    ))}
                </ul>
                <LibraryPlayer
                    key={currentTrackIndex}
                    currentTrack={currentTrack}
                    trackCount={tracks.length}
                    trackIndex={currentTrackIndex}
                    onNext={() => setCurrentTrackIndex((i) => i + 1)}
                    onPrevious={() => setCurrentTrackIndex((i) => i - 1)}
                />
            </div>
        </div>
    );
}

interface ManageUploadProps {
    upload: AudioUpload & { docId: string };
}

function ManageUpload({ upload }: ManageUploadProps) {

    const hardRefresh = () => {
        window.location.reload();
    }


    async function deleteDoc(docId: string) {

        const toastId = toast.loading("Deleting upload...");

        try {
            await deleteUpload(docId, upload.userId, upload.title).then(() => {
                toast.success("Upload deleted successfully", {
                    id: toastId
                });
            });
        } catch (e) {
            toast.error("An error occurred while deleting the upload", {
                id: toastId
            })
            console.error("Error deleting document: ", e); // Debugging
        } finally {
            
            setTimeout(() => {
                hardRefresh();
                toast.dismiss(toastId);
            }, 5000);
        }
    }

    return (
        <div className="flex flex-row gap-1 items-center">
            <Button
                className="rounded-xl"
                variant={"destructive"}
                onClick={() => deleteDoc(upload.docId)}
            >
                <ICONS.delete />
            </Button>
            <HoverCard>
                <HoverCardTrigger>
                    <Button
                        className="rounded-xl"
                        variant={"outline"}
                    >
                        <ICONS.more />
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="bg-zinc-950/80 max-w-fit border-none">
                    <div className="flex flex-col items-start gap-2 w-fit">
                        <p className="flex flex-col">
                            <span className="font-bold">TITLE: </span>
                            <span className="text-sm text-gray-400">
                                {upload.title}
                            </span>
                        </p>
                        {upload.description && (
                            <p className="flex flex-col">
                                <span className="font-bold">DESCRIPTION: </span>
                                <span className="text-sm text-gray-400 max-w-lg">
                                    {upload.description}
                                </span>
                            </p>
                        )}
                        <p className="flex flex-col">
                            <span className="font-bold">UPLOADED BY: </span>
                            <span className="text-xs text-gray-400">
                                {upload.username}
                            </span>
                        </p>
                        <p className="flex flex-col">
                            <span className="font-bold">TIMESTAMP: </span>
                            <span className="text-xs text-gray-400">
                                {new Date(upload.timestamp).toLocaleString()}
                            </span>
                        </p>
                        {upload.audioType && (
                            <p className="flex flex-col">
                                <span className="font-bold">
                                    AUDIO TYPE:
                                </span>
                                <span className="text-sm text-gray-400">
                                    {upload.audioType}
                                </span>
                            </p>
                        )}
                    </div>
                </HoverCardContent>
            </HoverCard>
        </div>
    )
}