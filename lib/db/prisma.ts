import { PrismaClient } from "@prisma/client/index";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
	prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error("DATABASE_URL not set");

	// Prisma 7 uses engine type "client" by default, which requires an adapter.
	const adapter = new PrismaNeonHttp(connectionString, {});

	return new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache the instance in dev to survive HMR without leaking connections
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;