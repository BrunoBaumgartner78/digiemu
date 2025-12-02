// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",        // ← WICHTIG: klassischer Prisma-Engine-Modus
  datasource: {
    url: env("DATABASE_URL"),
  },
});
