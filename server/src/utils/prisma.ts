import { PrismaClient } from '@prisma/client';

// Singleton pattern to prevent multiple PrismaClient instances
// This is especially important in serverless environments like Vercel
// where each function invocation could create a new connection

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
