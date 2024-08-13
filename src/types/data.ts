import { DocumentReference } from "firebase/firestore";
import { Genres, Instruments, Keys, Moods } from "./audio";

export interface AudioUpload {
    title: string;
    description?: string;
    genre?: keyof typeof Genres | string;
    mood?: keyof typeof Moods | string;
    key: keyof typeof Keys | string;
    bpm?: number;
    file: string;
    userId: string;
    instrument: keyof typeof Instruments | string;
    timestamp: number | Date;
    thumbnail?: string;
} 

export interface Log {
    docId: string;
    userId: string;
    timestamp: number | Date | string;
    ref: DocumentReference;
}