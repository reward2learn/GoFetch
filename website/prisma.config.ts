import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "zenstack/prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx scripts/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
