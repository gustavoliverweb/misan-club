import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  integer,
  boolean,
  timestamp,
  decimal,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "verified",
  "rejected",
]);
export const roleEnum = pgEnum("role", ["admin", "leader", "member"]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "expired",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stores the direct sponsor relationship only.
// The 5-level upline is resolved at query time via Recursive CTE.
export const networkHierarchy = pgTable("network_hierarchy", {
  memberId: uuid("member_id")
    .notNull()
    .references(() => users.id)
    .primaryKey(),
  sponsorId: uuid("sponsor_id").references(() => users.id),
  depth: integer("depth").notNull().default(0),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  status: membershipStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ledger: balance is NEVER stored — always computed as SUM(credits) - SUM(debits).
// Each row has a sha256 checksum chaining it to the previous entry for tamper detection.
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  referenceId: uuid("reference_id"),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const autofacturas = pgTable("autofacturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  commissionId: uuid("commission_id").notNull(),
  emisorId: uuid("emisor_id")
    .notNull()
    .references(() => users.id),
  receptorName: varchar("receptor_name", { length: 255 }).notNull().default("MisanClub"),
  concepto: text("concepto").notNull().default("Servicios de intermediación comercial"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  s3Key: varchar("s3_key", { length: 500 }),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

// Idempotency guard for external webhook events.
// An external_order_id is written here before processing; duplicate arrivals are discarded.
export const processedExternalOrders = pgTable("processed_external_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalOrderId: varchar("external_order_id", { length: 255 }).notNull().unique(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => users.id),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  networkNode: one(networkHierarchy, {
    fields: [users.id],
    references: [networkHierarchy.memberId],
  }),
  memberships: many(memberships),
  transactions: many(transactions),
}));

export const networkHierarchyRelations = relations(
  networkHierarchy,
  ({ one }) => ({
    member: one(users, {
      fields: [networkHierarchy.memberId],
      references: [users.id],
    }),
    sponsor: one(users, {
      fields: [networkHierarchy.sponsorId],
      references: [users.id],
    }),
  })
);
