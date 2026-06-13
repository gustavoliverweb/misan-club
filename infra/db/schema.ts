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
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const productCategoryEnum = pgEnum("product_category", [
  "standard",
  "proprietary",
  "reduced",
  "membership",
  "service",
]);

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "verified",
  "rejected",
]);
export const roleEnum = pgEnum("role", ["admin", "leader", "member"]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "grace",
  "expired",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
]);
export const kycDocumentTypeEnum = pgEnum("kyc_document_type", [
  "dni_front",
  "dni_back",
  "passport",
  "selfie",
]);
export const kycSubmissionStatusEnum = pgEnum("kyc_submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  role: roleEnum("role").notNull().default("member"),
  phone: varchar("phone", { length: 20 }),
  birthDate: date("birth_date"),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  bio: text("bio"),
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
  graceEndsAt: timestamp("grace_ends_at"),
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
  productCategory: productCategoryEnum("product_category"),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Quarterly pool accumulator: one row per sale. Distribution by rank happens separately.
export const poolContributions = pgTable("pool_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull(),
  category: productCategoryEnum("category"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quarter: varchar("quarter", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const autofacturas = pgTable("autofacturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  commissionId: uuid("commission_id").notNull(),
  emisorId: uuid("emisor_id")
    .notNull()
    .references(() => users.id),
  receptorName: varchar("receptor_name", { length: 255 })
    .notNull()
    .default("MisanClub"),
  concepto: text("concepto")
    .notNull()
    .default("Servicios de intermediación comercial"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  s3Key: varchar("s3_key", { length: 500 }),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const kycSubmissions = pgTable("kyc_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  documentType: kycDocumentTypeEnum("document_type").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  status: kycSubmissionStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// Idempotency guard for external webhook events.
// An external_order_id is written here before processing; duplicate arrivals are discarded.
export const processedExternalOrders = pgTable("processed_external_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalOrderId: varchar("external_order_id", { length: 255 })
    .notNull()
    .unique(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => users.id),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  networkNode: one(networkHierarchy, {
    relationName: "user_as_member",
    fields: [users.id],
    references: [networkHierarchy.memberId],
  }),
  memberships: many(memberships),
  transactions: many(transactions),
  kycSubmissions: many(kycSubmissions, { relationName: "author" }),
  reviewedDocs: many(kycSubmissions, { relationName: "reviewer" }),
}));

export const kycSubmissionsRelations = relations(kycSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [kycSubmissions.userId],
    references: [users.id],
    relationName: "author",
  }),
  reviewer: one(users, {
    fields: [kycSubmissions.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

export const autofacturasRelations = relations(autofacturas, ({ one }) => ({
  emisor: one(users, {
    fields: [autofacturas.emisorId],
    references: [users.id],
  }),
}));

export const networkHierarchyRelations = relations(
  networkHierarchy,
  ({ one }) => ({
    member: one(users, {
      relationName: "user_as_member",
      fields: [networkHierarchy.memberId],
      references: [users.id],
    }),
    sponsor: one(users, {
      relationName: "user_as_sponsor",
      fields: [networkHierarchy.sponsorId],
      references: [users.id],
    }),
  }),
);

// Añade estas definiciones que faltan en tu esquema
export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const processedExternalOrdersRelations = relations(
  processedExternalOrders,
  ({ one }) => ({
    member: one(users, {
      fields: [processedExternalOrders.memberId],
      references: [users.id],
    }),
  }),
);

export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "failed"]);

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }).unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Snapshot of product config at purchase time — commission percentages frozen so future edits don't affect past orders.
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  commissionBase: decimal("commission_base", { precision: 10, scale: 2 }).notNull(),
  isSocioPrice: boolean("is_socio_price").notNull().default(false),
  commissionCategory: productCategoryEnum("commission_category").notNull(),
  porcentajeN1: decimal("porcentaje_n1", { precision: 5, scale: 4 }).notNull(),
  porcentajeN2: decimal("porcentaje_n2", { precision: 5, scale: 4 }).notNull(),
  porcentajeN3: decimal("porcentaje_n3", { precision: 5, scale: 4 }).notNull(),
  porcentajeN4: decimal("porcentaje_n4", { precision: 5, scale: 4 }).notNull(),
  porcentajeN5: decimal("porcentaje_n5", { precision: 5, scale: 4 }).notNull(),
  porcentajePool: decimal("porcentaje_pool", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  subcategoria: varchar("subcategoria", { length: 100 }),
  marca: varchar("marca", { length: 100 }),
  imagen: varchar("imagen", { length: 500 }),
  precioPublico: decimal("precio_publico", { precision: 10, scale: 2 }).notNull(),
  precioSocio: decimal("precio_socio", { precision: 10, scale: 2 }).notNull(),
  commissionCategory: productCategoryEnum("commission_category").notNull().default("standard"),
  porcentajeN1: decimal("porcentaje_n1", { precision: 5, scale: 4 }).notNull().default("0.0500"),
  porcentajeN2: decimal("porcentaje_n2", { precision: 5, scale: 4 }).notNull().default("0.0300"),
  porcentajeN3: decimal("porcentaje_n3", { precision: 5, scale: 4 }).notNull().default("0.0200"),
  porcentajeN4: decimal("porcentaje_n4", { precision: 5, scale: 4 }).notNull().default("0.0100"),
  porcentajeN5: decimal("porcentaje_n5", { precision: 5, scale: 4 }).notNull().default("0.0100"),
  porcentajePool: decimal("porcentaje_pool", { precision: 5, scale: 4 }).notNull().default("0.0500"),
  participaEnPool: boolean("participa_en_pool").notNull().default(true),
  generaAutofactura: boolean("genera_autofactura").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const storeOrders = pgTable("store_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => users.id),
  buyerEmail: varchar("buyer_email", { length: 255 }).notNull().default(""),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }).unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const storeOrderItems = pgTable("store_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  commissionBase: decimal("commission_base", { precision: 10, scale: 2 }).notNull(),
  commissionCategory: productCategoryEnum("commission_category").notNull(),
  porcentajeN1: decimal("porcentaje_n1", { precision: 5, scale: 4 }).notNull(),
  porcentajeN2: decimal("porcentaje_n2", { precision: 5, scale: 4 }).notNull(),
  porcentajeN3: decimal("porcentaje_n3", { precision: 5, scale: 4 }).notNull(),
  porcentajeN4: decimal("porcentaje_n4", { precision: 5, scale: 4 }).notNull(),
  porcentajeN5: decimal("porcentaje_n5", { precision: 5, scale: 4 }).notNull(),
  porcentajePool: decimal("porcentaje_pool", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descripcion: text("descripcion"),
  badge: varchar("badge", { length: 255 }),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  modalidad: varchar("modalidad", { length: 255 }),
  frecuencia: varchar("frecuencia", { length: 255 }),
  duracion: varchar("duracion", { length: 255 }),
  acceso: varchar("acceso", { length: 255 }).default("Solo socios activos"),
  contenido: text("contenido"),
  perfilParticipante: text("perfil_participante"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactRequests = pgTable("contact_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  mensaje: text("mensaje").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseInvoices = pgTable("purchase_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  orderId: uuid("order_id"),
  storeOrderId: uuid("store_order_id"),
  concepto: text("concepto").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one }) => ({
  user: one(users, { fields: [purchaseInvoices.userId], references: [users.id] }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const storeOrdersRelations = relations(storeOrders, ({ one, many }) => ({
  seller: one(users, { fields: [storeOrders.sellerId], references: [users.id] }),
  items: many(storeOrderItems),
}));

export const storeOrderItemsRelations = relations(storeOrderItems, ({ one }) => ({
  order: one(storeOrders, { fields: [storeOrderItems.orderId], references: [storeOrders.id] }),
  product: one(products, { fields: [storeOrderItems.productId], references: [products.id] }),
}));
