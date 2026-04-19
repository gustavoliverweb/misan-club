import type { Config } from "drizzle-kit";

export default {
  schema: "./infra/db/schema.ts",
  out: "./infra/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
