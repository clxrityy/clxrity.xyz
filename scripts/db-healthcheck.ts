import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { getEdgeDb } from '../lib/db/neon';

// Load .env.local first if present, then fallback to .env
const cwd = process.cwd();
const localEnv = path.join(cwd, '.env.local');
if (fs.existsSync(localEnv)) loadEnv({ path: localEnv, override: true });
const defaultEnv = path.join(cwd, '.env');
if (fs.existsSync(defaultEnv)) loadEnv({ path: defaultEnv });

async function main() {
    try {
        const sql = getEdgeDb();
        const rows = await sql`select 1 as x`;
        console.log('DB OK:', rows);
        process.exit(0);
    } catch (err) {
        console.error('DB ERROR:', err);
        process.exit(1);
    }
}

main();
