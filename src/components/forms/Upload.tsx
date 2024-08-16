"use client";
import { maxBytes } from "@/config";
import { useState } from "react";
import toast from "react-hot-toast";
import UploadBox from "../svg/UploadBox";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { formSchema } from "./AddAudio";
import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { app } from "@/lib/firebase";

type Props = {
    formData: UseFormReturn<z.infer<typeof formSchema>>;
    userId: string;
}

export default function UploadForm({ formData, userId }: Props) {
    const [file, setFile] = useState<File>();
    // const [progress, setProgress] = useState<number>(0);

    const storage = getStorage(app);

    const onFileSelect = async (fileSelected: File) => {
        if (fileSelected.type !== "audio/mpeg" && fileSelected.type !== "audio/wav") {
            toast.error("Invalid file type.\nOnly audio files are allowed", {
                icon: "🚫",
                style: {
                    color: "red"
                }
            })
            return;
        }

        if (fileSelected.size > maxBytes) {
            toast.error("File is too large.\nMax size is 25MB", {
                icon: "🚫",
                style: {
                    color: "red"
                }
            })
            return;
        }

        setFile(file);

        const metadata = {
            contentType: fileSelected.type,
        }
        // users/${userId}/audio/${fileSelected.name}
        const storageRef = ref(storage, `audio/${fileSelected.name}`);
        await uploadBytes(storageRef, fileSelected, metadata).then((snapshot) => {

            const toastId = toast.loading("Uploading file...");

            getDownloadURL(snapshot.ref).then((url) => {
                console.log("File available at", url);
                formData.setValue("file", url);
            }).catch((error) => {
                console.error(error);
                toast.error("An error occurred while uploading the file", {
                    id: toastId
                });
            }).finally(() => {
                setTimeout(() => {
                    toast.dismiss(toastId);
                }, 2000);
            })
        })

        // uploadTask.on("state_changed", (snapshot) => {
        //     const prog = (snapshot.bytesTransferred / snapshot.totalBytes * 100);
        //     setProgress(prog);

        //     prog == 100 && getDownloadURL(snapshot.ref)
        //         .then((url) => {
        //             console.log("File available at", url);
        //             formData.setValue("file", url);
        //             toast.success("File uploaded!", {
        //                 id: toastId
        //             });
        //         }).catch((error) => {
        //             console.error(error);
        //             toast.error("An error occurred while uploading the file", {
        //                 id: toastId
        //             })
        //         }).finally(() => {
        //             toast.dismiss(toastId);
        //         })
        // })


    }


    return (
        <UploadBox>
            <input id="dropzone-file" type="file" className="hidden" onChange={(e) => onFileSelect(e.target.files![0])} />
        </UploadBox>
    );

}