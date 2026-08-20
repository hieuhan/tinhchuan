import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 bắt buộc dùng driver adapter thay vì để Prisma tự quản lý connection pool
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export * from '../generated/client';
