import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString, {
  ssl: "require",
  max: 1, // Para migraciones y Studio, limita a 1 conexión para evitar bloqueos
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
export type DB = typeof db;
