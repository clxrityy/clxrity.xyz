import { neon } from "@neondatabase/serverless";

export function getEdgeDb() {
    const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Missing NEON_DATABASE_URL/DATABASE_URL");
    return neon(connectionString);
}
