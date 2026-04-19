import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../../infra/db/schema";
import { getUpline, getActiveUpline } from "../../infra/db/queries/upline";

// Requires a real PostgreSQL instance via DATABASE_URL.
// Run: DATABASE_URL=postgres://... npx vitest run tests/integration

const connectionString = process.env.DATABASE_URL;
const shouldRun = !!connectionString;

describe.skipIf(!shouldRun)("Upline Recursive CTE", () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  // IDs for a 6-node chain: root → L1 → L2 → L3 → L4 → L5 → target
  const ids = {
    root: "00000000-0000-0000-0000-000000000001",
    l1: "00000000-0000-0000-0000-000000000002",
    l2: "00000000-0000-0000-0000-000000000003",
    l3: "00000000-0000-0000-0000-000000000004",
    l4: "00000000-0000-0000-0000-000000000005",
    l5: "00000000-0000-0000-0000-000000000006",
    target: "00000000-0000-0000-0000-000000000007",
  };

  beforeAll(async () => {
    client = postgres(connectionString!);
    db = drizzle(client, { schema });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        kyc_status kyc_status NOT NULL DEFAULT 'pending',
        role role NOT NULL DEFAULT 'member',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS network_hierarchy (
        member_id UUID PRIMARY KEY REFERENCES users(id),
        sponsor_id UUID REFERENCES users(id),
        depth INT NOT NULL DEFAULT 0
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        status membership_status NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const nodes = Object.entries(ids);
    for (const [name, id] of nodes) {
      await db.execute(sql`
        INSERT INTO users (id, email, full_name) VALUES (${id}, ${`${name}@test.com`}, ${name})
        ON CONFLICT DO NOTHING
      `);
    }

    const chain = [
      { memberId: ids.l1, sponsorId: ids.root },
      { memberId: ids.l2, sponsorId: ids.l1 },
      { memberId: ids.l3, sponsorId: ids.l2 },
      { memberId: ids.l4, sponsorId: ids.l3 },
      { memberId: ids.l5, sponsorId: ids.l4 },
      { memberId: ids.target, sponsorId: ids.l5 },
    ];
    for (const { memberId, sponsorId } of chain) {
      await db.execute(sql`
        INSERT INTO network_hierarchy (member_id, sponsor_id, depth) VALUES (${memberId}, ${sponsorId}, 0)
        ON CONFLICT DO NOTHING
      `);
    }

    // L1, L3, L5 are active; L2 and L4 are inactive
    for (const userId of [ids.l1, ids.l3, ids.l5]) {
      await db.execute(sql`
        INSERT INTO memberships (user_id, status, expires_at)
        VALUES (${userId}, 'active', NOW() + INTERVAL '30 days')
        ON CONFLICT DO NOTHING
      `);
    }
  });

  afterAll(async () => {
    // Clean up test fixtures
    await db.execute(
      sql`DELETE FROM memberships WHERE user_id IN (${ids.root}, ${ids.l1}, ${ids.l2}, ${ids.l3}, ${ids.l4}, ${ids.l5}, ${ids.target})`
    );
    await db.execute(
      sql`DELETE FROM network_hierarchy WHERE member_id IN (${ids.root}, ${ids.l1}, ${ids.l2}, ${ids.l3}, ${ids.l4}, ${ids.l5}, ${ids.target})`
    );
    await db.execute(
      sql`DELETE FROM users WHERE id IN (${ids.root}, ${ids.l1}, ${ids.l2}, ${ids.l3}, ${ids.l4}, ${ids.l5}, ${ids.target})`
    );
    await client.end();
  });

  it("returns exactly 5 upline levels, not 6", async () => {
    const upline = await getUpline(db as any, ids.target);
    expect(upline).toHaveLength(5);
  });

  it("upline levels are ordered 1 to 5 (closest sponsor first)", async () => {
    const upline = await getUpline(db as any, ids.target);
    expect(upline.map((u) => u.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it("level 1 is the direct sponsor", async () => {
    const upline = await getUpline(db as any, ids.target);
    expect(upline[0].memberId).toBe(ids.l5);
  });

  it("getActiveUpline filters out inactive members", async () => {
    const active = await getActiveUpline(db as any, ids.target);
    // L5 (level 1), L3 (level 3), L1 (level 5) are active; L4 and L2 are not
    expect(active).toHaveLength(3);
    expect(active.map((u) => u.memberId)).toContain(ids.l5);
    expect(active.map((u) => u.memberId)).toContain(ids.l3);
    expect(active.map((u) => u.memberId)).toContain(ids.l1);
  });

  it("a member with fewer than 5 sponsors returns only what exists", async () => {
    // L2 only has L1 and root above it (root has no sponsor)
    const upline = await getUpline(db as any, ids.l2);
    expect(upline.length).toBeLessThanOrEqual(5);
    expect(upline[0].memberId).toBe(ids.l1);
  });
});
