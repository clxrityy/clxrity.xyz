import { randomBytes, createCipheriv } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type LogCategory =
    | 'COMMAND'
    | 'INTERACTION'
    | 'CRON'
    | 'DISCORD_API'
    | 'DATABASE'
    | 'AUTH'
    | 'SYSTEM';

function getLogKey(): { key: Buffer; keyId: string } {
    const base64 = process.env.LOG_ENCRYPTION_KEY || '';
    const keyId = process.env.LOG_ENCRYPTION_KEY_ID || 'default';
    if (!base64) throw new Error('LOG_ENCRYPTION_KEY missing');
    let key: Buffer;
    try {
        key = Buffer.from(base64, 'base64');
    } catch {
        throw new Error('LOG_ENCRYPTION_KEY must be base64-encoded');
    }
    if (key.length !== 32) throw new Error('LOG_ENCRYPTION_KEY must decode to 32 bytes (AES-256)');
    return { key, keyId };
}

// AES-256-GCM: returns iv(12) || ciphertext || authTag(16)
function encryptAes256Gcm(plaintext: string, key: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, enc, tag]);
}

export type GuildLogInput = {
    guildId: string;
    level: LogLevel;
    category: LogCategory;
    summary?: string | null;
    command?: string | null;
    action?: string | null;
    userId?: string | null;
    success?: boolean | null;
    latencyMs?: number | null;
    message?: string | null; // sensitive -> encrypted
    details?: string | object | null; // sensitive -> encrypted (object will be JSON.stringified)
};

export async function writeGuildLog(input: GuildLogInput) {
    const { guildId, level, category, summary, command, action, userId, success, latencyMs } = input;
    let messageCiphertext: Buffer | undefined;
    let detailsCiphertext: Buffer | undefined;
    let keyId: string | undefined;

    if (input.message != null || input.details != null) {
        const { key, keyId: kid } = getLogKey();
        keyId = kid;
        if (input.message != null) {
            messageCiphertext = encryptAes256Gcm(String(input.message), key);
        }
        if (input.details != null) {
            const text = typeof input.details === 'string' ? input.details : JSON.stringify(input.details);
            detailsCiphertext = encryptAes256Gcm(text, key);
        }
    }

    return (prisma).guildLog.create({
        data: {
            guildId,
            level,
            category,
            summary: summary ?? null,
            command: command ?? null,
            action: action ?? null,
            userId: userId ?? null,
            success: success ?? null,
            latencyMs: latencyMs ?? null,
            messageCiphertext,
            detailsCiphertext,
            keyId: keyId ?? null,
            encVer: 1,
        }
    });
}
