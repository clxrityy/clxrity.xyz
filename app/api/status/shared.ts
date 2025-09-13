export const startedAt = Date.now();

export type CoreStatus = {
    online: boolean;
    guilds: number;
    startedAt: number;
};

// Placeholder: in future wire real guild count & online detection.
export function getCoreStatus(): CoreStatus {
    return {
        online: true,
        guilds: 0,
        startedAt,
    };
}
