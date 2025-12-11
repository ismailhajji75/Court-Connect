import { PrismaClient } from "@prisma/client";

// Pick the right database file:
// - Honor DATABASE_URL if provided (prod/dev)
// - Fall back to a dedicated test DB when running with `node --test`
// - Otherwise use the default dev database
const isNodeTest = process.argv.some((arg) => arg.includes("--test"));
const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.env.VITEST ||
  isNodeTest;

const dbUrl = isTestEnv
  ? // During tests, never write to the dev/prod DB even if DATABASE_URL is set.
    process.env.DATABASE_URL_TEST || "file:./prisma/test.db"
  : // Normal runtime: use configured URL or fall back to dev.db
    process.env.DATABASE_URL || "file:./prisma/dev.db";

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

export default prisma;
