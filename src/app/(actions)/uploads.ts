"use server";
import { db } from "@/lib/firebase";
import { AudioUpload } from "@/types/data";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
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

export async function getUploadsByUser(userId: string): Promise<AudioUpload[]> {
    const uploads: AudioUpload[] = [];

    try {
        const querySnapshot = await getDocs(collection(db, "audio"));
        querySnapshot.forEach((doc) => {
            const data = doc.data() as AudioUpload & { docId: string };
            if (data.userId === userId) {
                uploads.push(data);
            }
        });

        return uploads as AudioUpload[] & { docId: string }[];
    } catch (e) {
        console.error("Error getting documents by userId: ", e); // Debugging
        return [];
    }
}

export async function getUpload(uuid: string): Promise<AudioUpload | null> {

    let upload: AudioUpload | null = null;

    try {
        const querySnapshot = await getDocs(collection(db, "audio"));
        querySnapshot.forEach((doc) => {
            const data = doc.data() as AudioUpload;
            if (data.uuid === uuid) {
                upload = data;
            }
        });

        return upload;

    } catch (e) {
        console.error("Error getting document by UUID: ", e); // Debugging
        return null;
    }
}