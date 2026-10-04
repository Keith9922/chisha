// Prisma 7 config — DB URL goes here, not in schema.prisma
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// 同时加载 .env.local（Vercel 风格，优先级高于 .env）
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // 迁移走非池化连接（DDL 不能走 pgbouncer）
    seed: undefined,
  },
  datasource: {
    // 运行时用池化（serverless 友好）；优先用 Neon 提供的 PRISMA URL
    url:
      process.env.POSTGRES_PRISMA_URL ??
      process.env.DATABASE_URL,
  },
});
