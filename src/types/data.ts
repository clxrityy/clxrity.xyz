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
    audioType?: keyof typeof AudioTypes | string;
    username?: string;
    uuid?: string;
} 

export interface Log {
    docId: string;
    userId: string;
    username?: string;
    timestamp: number | Date | string;
    uploadTitle: string;
    logType: "upload" | "delete" | "edit";
}

export enum AudioTypes {
    YEARRBOOK = "yearbook",
    LOOP = "loop",
    MISC = "misc",
    ONE_SHOT = "one-shot",
}

export interface AuthenticatedUser {
    userId: string;
    username: string;
    avatar: string;
    bio?: string;
    soundcloud?: string;
    spotify?: string;
}