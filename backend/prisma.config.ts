import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path:
    process.env.DOTENV_CONFIG_PATH ??
    path.join(__dirname, "config", ".env.development"),
});

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Set DOTENV_CONFIG_PATH or use config/.env.development.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.js",
  },
  datasource: {
    url: databaseUrl,
  },
});
