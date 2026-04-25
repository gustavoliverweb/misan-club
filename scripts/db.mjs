#!/usr/bin/env node
// DB helper — loaded via: node --env-file=.env scripts/db.mjs <command>
// Commands: console | check | migrate:apply

import { execSync, spawnSync } from "child_process";
import { readFileSync } from "fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL not set. Check your .env file.");
  process.exit(1);
}

const cmd = process.argv[2];

function query(sql) {
  execSync(`psql "${url}"`, {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

switch (cmd) {
  case "console":
    spawnSync("psql", [url], { stdio: "inherit" });
    break;

  case "check":
    console.log("\n── Últimas 10 transacciones ──────────────────────────────");
    query(`
      SELECT left(id::text,8) AS id, amount, type, left(description,40) AS description,
             product_category, to_char(created_at,'DD/MM HH24:MI') AS at
      FROM transactions ORDER BY created_at DESC LIMIT 10;
    `);

    console.log("\n── Pool contributions (últimas 5) ────────────────────────");
    query(`
      SELECT left(product_id::text,8) AS product, category, amount, quarter,
             to_char(created_at,'DD/MM HH24:MI') AS at
      FROM pool_contributions ORDER BY created_at DESC LIMIT 5;
    `);

    console.log("\n── Membresías ────────────────────────────────────────────");
    query(`
      SELECT u.email, m.status, m.expires_at::date AS expires
      FROM memberships m JOIN users u ON u.id = m.user_id
      ORDER BY m.created_at DESC LIMIT 10;
    `);

    console.log("\n── Órdenes procesadas (últimas 5) ────────────────────────");
    query(`
      SELECT external_order_id, left(member_id::text,8) AS member,
             to_char(processed_at,'DD/MM HH24:MI') AS at
      FROM processed_external_orders ORDER BY processed_at DESC LIMIT 5;
    `);
    break;

  case "migrate:apply": {
    const sql = readFileSync(
      "infra/db/migrations/0004_spec05.sql",
      "utf8",
    ).replace(/--> statement-breakpoint/g, ";");
    execSync(`psql "${url}"`, {
      input: sql,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log("✓ Migración 0004_spec05 aplicada.");
    break;
  }

  case "activate-member": {
    const email = process.argv[3];
    if (!email) {
      console.error("Usage: db:activate <email>");
      process.exit(1);
    }
    query(`
      INSERT INTO memberships (user_id, status, expires_at, auto_renew)
      SELECT id, 'active', NOW() + INTERVAL '30 days', false
      FROM users WHERE email = '${email}'
      ON CONFLICT DO NOTHING
      RETURNING user_id, status, expires_at;
    `);
    break;
  }

  default:
    console.error(`Comando desconocido: "${cmd}"`);
    console.error(
      "Disponibles: console | check | migrate:apply | activate-member <email>",
    );
    process.exit(1);
}
