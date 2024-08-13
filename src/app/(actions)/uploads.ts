"use server";
import { db } from "@/lib/firebase";
import { AudioUpload } from "@/types/data";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { log } from "./logs";

export async function upload(audioData: AudioUpload): Promise<string | null> {

    console.log("Uploading audio data", audioData) // Debugging

    try {
        const docRef = await addDoc(collection(db, "audio"), {
            ...audioData,
        });

        try {
            await log({
                docId: docRef.id,
                userId: audioData.userId,
                timestamp: audioData.timestamp,
                ref: docRef,
            })
            console.log("Document logged with ID: ", docRef.id); // Debugging
        } catch (e: any) {
            console.error("Error logging document: ", e.message); // Debugging
        }

        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e); // Debugging
        return null;
    }
}

export async function getUploads(): Promise<AudioUpload[]> {
    const uploads: AudioUpload[] = [];

    const querySnapshot = await getDocs(collection(db, "audio"));
    querySnapshot.forEach((doc) => {
        uploads.push(doc.data() as AudioUpload);
    });

    return uploads;
}