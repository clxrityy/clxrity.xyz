import { neon } from "@neondatabase/serverless";

export function getEdgeDb() {
    // Prefer the primary DATABASE_URL; fallback to NEON_DATABASE_URL if explicitly used
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (!connectionString) throw new Error("Missing NEON_DATABASE_URL/DATABASE_URL");
    return neon(connectionString);
}
