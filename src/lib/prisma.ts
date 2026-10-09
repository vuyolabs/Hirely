import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

/*
 * In development the client is cached on globalThis so hot reloads don't
 * open a new connection pool each time. The cache also remembers which
 * generated PrismaClient class built it: after `prisma generate` the class
 * is a new one, so the stale instance (which doesn't know new fields) is
 * replaced instead of reused.
 */
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
    prismaClass?: typeof PrismaClient;
};

function createClient() {
    return new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
    });
}

const cached =
    globalForPrisma.prismaClass === PrismaClient ? globalForPrisma.prisma : undefined;

if (!cached && globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => {});
}

export const prisma = cached ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaClass = PrismaClient;
}
