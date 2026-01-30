import type { Config } from "drizzle-kit";

const rawUrl = process.env.DATABASE_URL ?? "";
const shouldForceSsl =
  rawUrl &&
  !rawUrl.includes("sslmode=") &&
  !rawUrl.includes("ssl=true") &&
  !rawUrl.includes("localhost") &&
  !rawUrl.includes("127.0.0.1");

const url = shouldForceSsl ? `${rawUrl}?sslmode=require` : rawUrl;

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
} satisfies Config;
