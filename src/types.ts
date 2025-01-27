export interface ServerData {
    status: string;
    online: boolean;
    motd: string;
    motd_json: {
        extra: [],
        text: string;
    } | null;
    favicon: Blob | null;
    error?: string;
    players: {
        max: number;
        now: number;
        sample: [],
    },
    last_updated: string;
    duration: string;
}