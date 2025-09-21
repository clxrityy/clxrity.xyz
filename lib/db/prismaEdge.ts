import { PrismaClient } from '@prisma/client';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';

// Edge-friendly instantiation: avoid global reuse that can leak across requests
// and disable certain features not supported in edge runtimes if needed.
// Using a lightweight client instance per request scope is acceptable given low QPS for interactions.

export function getPrismaEdge() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');
  const adapterFactory = new PrismaNeonHTTP(connectionString, {});
  return new PrismaClient({ adapter: adapterFactory });
}
