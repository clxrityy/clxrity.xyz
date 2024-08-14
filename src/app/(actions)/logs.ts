"use server";

import { db } from "@/lib/firebase";
import { Log } from "@/types/data";
import { DocumentReference, addDoc, collection, getDoc, getDocs } from "firebase/firestore";

export async function log(data: Log) {
    try {

        const docRef = await addDoc(collection(db, "logs"), {
            ...data,
        })

        // console.log("Document written with ID: ", docRef.id); // Debugging

        return docRef;

    } catch (e: any) {
        console.error("Error adding document: ", e);
        return null;
    }
}

export async function getAllLogs() {
    const logs = await getDocs(collection(db, "logs"));

    console.log("Logs: ", logs); // Debugging

    return logs;
}

export async function getLog(ref: DocumentReference) {
    const log = await getDoc(ref);

    console.log("Log: ", log); // Debugging

    return log;
}