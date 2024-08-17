"use server";
import { db } from "@/lib/firebase";
import { AudioUpload } from "@/types/data";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { log } from "./logs";


export async function upload(audioData: AudioUpload): Promise<string | null> {

    try {
        const docRef = await addDoc(collection(db, "audio"), {
            ...audioData,
        });

        try {
            await log({
                docId: docRef.id,
                userId: audioData.userId,
                username: audioData.username,
                timestamp: audioData.timestamp,
                uploadTitle: audioData.title,
                logType: "upload",
            })
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

    try {
        const querySnapshot = await getDocs(collection(db, "audio"));
        querySnapshot.forEach((doc) => {
            uploads.push(doc.data() as AudioUpload & { docId: string });
        });

        return uploads as AudioUpload[] & { docId: string }[];
    } catch (e) {
        console.error("Error getting documents: ", e); // Debugging
        return [];
    }
}

export async function deleteUpload(docId: string, userId: string, title: string): Promise<boolean> {

    const docRef = doc(db, "audio", docId);

    try {
        await deleteDoc(docRef);

        await log({
            docId: docId,
            userId: userId,
            timestamp: Date.now(),
            uploadTitle: title,
            logType: "delete",
        });

        return true;
    } catch (e) {
        console.error("Error deleting document: ", e); // Debugging
        return false;
    }
}