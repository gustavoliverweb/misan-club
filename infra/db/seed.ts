/**
 * Seed: genera la red MLM de demostración para MisanClub.
 *
 * Estructura resultante:
 *   Admin (sin red)
 *   Líder L0         (depth 0, sin sponsor)
 *   ├── Socio L1-A   (depth 1)
 *   │   ├── Socio L2-A1
 *   │   └── Socio L2-A2
 *   ├── Socio L1-B   (depth 1)
 *   │   ├── Socio L2-B1
 *   │   └── Socio L2-B2
 *   └── Socio L1-C   (depth 1)
 *       ├── Socio L2-C1
 *       └── Socio L2-C2
 *
 * Todos tienen membresía ACTIVE con vencimiento en 30 días.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, networkHierarchy, memberships } from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const EXPIRES_AT = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

async function seed() {
  console.log("🌱 Iniciando seed...\n");

  // ─── 1. Usuarios ──────────────────────────────────────────────���─────────────
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@misanclub.com",
      fullName: "Admin MisanClub",
      kycStatus: "verified",
      role: "admin",
    })
    .returning();

  const [leader] = await db
    .insert(users)
    .values({
      email: "leader@misanclub.com",
      fullName: "Líder Principal",
      kycStatus: "verified",
      role: "leader",
    })
    .returning();

  const level1 = await db
    .insert(users)
    .values([
      { email: "l1a@misanclub.com", fullName: "Socio L1-A", kycStatus: "verified", role: "member" },
      { email: "l1b@misanclub.com", fullName: "Socio L1-B", kycStatus: "verified", role: "member" },
      { email: "l1c@misanclub.com", fullName: "Socio L1-C", kycStatus: "verified", role: "member" },
    ])
    .returning();

  const [l1a, l1b, l1c] = level1;

  const level2 = await db
    .insert(users)
    .values([
      { email: "l2a1@misanclub.com", fullName: "Socio L2-A1", kycStatus: "verified", role: "member" },
      { email: "l2a2@misanclub.com", fullName: "Socio L2-A2", kycStatus: "verified", role: "member" },
      { email: "l2b1@misanclub.com", fullName: "Socio L2-B1", kycStatus: "verified", role: "member" },
      { email: "l2b2@misanclub.com", fullName: "Socio L2-B2", kycStatus: "verified", role: "member" },
      { email: "l2c1@misanclub.com", fullName: "Socio L2-C1", kycStatus: "verified", role: "member" },
      { email: "l2c2@misanclub.com", fullName: "Socio L2-C2", kycStatus: "verified", role: "member" },
    ])
    .returning();

  const [l2a1, l2a2, l2b1, l2b2, l2c1, l2c2] = level2;

  console.log(`✅ Usuarios creados: 1 admin, 1 líder, 3 nivel-1, 6 nivel-2`);

  // ─── 2. Red jerárquica ───────────────────────────────────────────────────────
  // El líder no tiene sponsor (raíz de la red).
  await db.insert(networkHierarchy).values([
    { memberId: leader.id, sponsorId: null,      depth: 0 },
    { memberId: l1a.id,    sponsorId: leader.id, depth: 1 },
    { memberId: l1b.id,    sponsorId: leader.id, depth: 1 },
    { memberId: l1c.id,    sponsorId: leader.id, depth: 1 },
    { memberId: l2a1.id,   sponsorId: l1a.id,    depth: 2 },
    { memberId: l2a2.id,   sponsorId: l1a.id,    depth: 2 },
    { memberId: l2b1.id,   sponsorId: l1b.id,    depth: 2 },
    { memberId: l2b2.id,   sponsorId: l1b.id,    depth: 2 },
    { memberId: l2c1.id,   sponsorId: l1c.id,    depth: 2 },
    { memberId: l2c2.id,   sponsorId: l1c.id,    depth: 2 },
  ]);

  console.log(`✅ Red jerárquica creada (líder → 3 L1 → 6 L2)`);

  // ─── 3. Membresías ACTIVE ────────────────────────────────────────────────────
  // El admin no tiene membresía de socio.
  const memberIds = [leader, ...level1, ...level2].map((u) => u.id);
  await db.insert(memberships).values(
    memberIds.map((userId) => ({
      userId,
      status: "active" as const,
      expiresAt: EXPIRES_AT,
      autoRenew: true,
    }))
  );

  console.log(`✅ Membresías ACTIVE asignadas a ${memberIds.length} socios`);

  // ─── Resumen ─────────────────────────────────────────────────────────────────
  console.log("\n📊 Red generada:");
  console.log(`   Admin:   ${admin.email}`);
  console.log(`   Líder:   ${leader.email}  (id: ${leader.id})`);
  console.log(`   L1:      ${level1.map((u) => u.email).join(", ")}`);
  console.log(`   L2:      ${level2.map((u) => u.email).join(", ")}`);
  console.log("\n✅ Seed completado.\n");
}

seed()
  .catch((err) => {
    console.error("❌ Seed falló:", err);
    process.exit(1);
  })
  .finally(() => client.end());
