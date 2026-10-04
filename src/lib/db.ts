import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

// 用 Neon serverless adapter — Vercel 上零冷启
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export class DbNotConfiguredError extends Error {
  code = "DB_NOT_CONFIGURED";
  constructor() {
    super("数据库未配置：缺少 POSTGRES_PRISMA_URL");
  }
}

export function isDbConfigured(): boolean {
  return !!(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);
}

function makeClient() {
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new DbNotConfiguredError();
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
