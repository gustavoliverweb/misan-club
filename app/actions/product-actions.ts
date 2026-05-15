"use server";

import { and, eq, like, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { products } from "@/infra/db/schema";
import { createProductSchema } from "@/lib/validations/actions";
import { getCurrentUser } from "@/lib/current-user";
import { processSaleAction } from "./business-actions";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ProductRow = typeof products.$inferSelect;

export async function createProductAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { success: false, error: "Sin permisos." };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const [row] = await db
    .insert(products)
    .values({
      nombre: d.nombre,
      descripcion: d.descripcion,
      categoria: d.categoria,
      subcategoria: d.subcategoria,
      marca: d.marca,
      imagen: d.imagen,
      precioPublico: d.precioPublico.toString(),
      precioSocio: d.precioSocio.toString(),
      commissionCategory: d.commissionCategory,
      porcentajeN1: d.porcentajeN1.toString(),
      porcentajeN2: d.porcentajeN2.toString(),
      porcentajeN3: d.porcentajeN3.toString(),
      porcentajeN4: d.porcentajeN4.toString(),
      porcentajeN5: d.porcentajeN5.toString(),
      porcentajePool: d.porcentajePool.toString(),
      participaEnPool: d.participaEnPool,
      generaAutofactura: d.generaAutofactura,
    })
    .returning({ id: products.id });

  return { success: true, data: { id: row.id } };
}

export async function getProductsBySlugAction(
  categoria: string,
  subcategoria: string,
): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.categoria, categoria),
        eq(products.subcategoria, subcategoria),
        eq(products.active, true),
      ),
    );
}

export async function getCountsByCategoriesAction(): Promise<
  { categoria: string; count: number }[]
> {
  const rows = await db
    .select({
      categoria: products.categoria,
      total: sql<number>`count(*)`.as("total"),
    })
    .from(products)
    .where(eq(products.active, true))
    .groupBy(products.categoria);

  return rows
    .filter((r) => r.categoria !== null)
    .map((r) => ({ categoria: r.categoria!, count: Number(r.total) }));
}

export async function getTopLevelSubcategoriesAction(
  categoria: string,
): Promise<{ slug: string; count: number }[]> {
  const rows = await db
    .select({
      topLevel: sql<string>`SPLIT_PART(${products.subcategoria}, '/', 1)`.as("top_level"),
      total: sql<number>`count(*)`.as("total"),
    })
    .from(products)
    .where(and(eq(products.categoria, categoria), eq(products.active, true)))
    .groupBy(sql`SPLIT_PART(${products.subcategoria}, '/', 1)`);

  return rows
    .filter((r) => r.topLevel)
    .map((r) => ({ slug: r.topLevel, count: Number(r.total) }));
}

export async function getSubcategoriesAction(
  categoria: string,
  prefijo: string,
): Promise<{ slug: string; count: number }[]> {
  const rows = await db
    .select({
      subcategoria: products.subcategoria,
      total: sql<number>`count(*)`.as("total"),
    })
    .from(products)
    .where(
      and(
        eq(products.categoria, categoria),
        like(products.subcategoria, `${prefijo}/%`),
        eq(products.active, true),
      ),
    )
    .groupBy(products.subcategoria);

  return rows
    .filter((r) => r.subcategoria !== null)
    .map((r) => ({
      slug: r.subcategoria!.split("/").at(-1)!,
      count: Number(r.total),
    }));
}

export async function getAllProductsAction(): Promise<ProductRow[]> {
  return db.select().from(products);
}

export async function getProductByIdAdminAction(id: string): Promise<ProductRow | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function updateProductAction(
  id: string,
  input: unknown,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { success: false, error: "Sin permisos." };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  await db
    .update(products)
    .set({
      nombre: d.nombre,
      descripcion: d.descripcion,
      categoria: d.categoria,
      subcategoria: d.subcategoria,
      marca: d.marca,
      imagen: d.imagen,
      precioPublico: d.precioPublico.toString(),
      precioSocio: d.precioSocio.toString(),
      commissionCategory: d.commissionCategory,
      porcentajeN1: d.porcentajeN1.toString(),
      porcentajeN2: d.porcentajeN2.toString(),
      porcentajeN3: d.porcentajeN3.toString(),
      porcentajeN4: d.porcentajeN4.toString(),
      porcentajeN5: d.porcentajeN5.toString(),
      porcentajePool: d.porcentajePool.toString(),
      participaEnPool: d.participaEnPool,
      generaAutofactura: d.generaAutofactura,
    })
    .where(eq(products.id, id));

  return { success: true, data: undefined };
}

export async function toggleProductActiveAction(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { success: false, error: "Sin permisos." };

  const [product] = await db
    .select({ active: products.active })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) return { success: false, error: "Producto no encontrado." };

  await db.update(products).set({ active: !product.active }).where(eq(products.id, id));
  return { success: true, data: undefined };
}

export async function getProductByIdAction(
  id: string,
): Promise<ProductRow | null> {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.active, true)))
    .limit(1);
  return row ?? null;
}

export async function buyProductAction(
  productId: string,
): Promise<ActionResult<{ transactionIds: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Usuario no encontrado." };
  if (user.membership?.status !== "active") {
    return {
      success: false,
      error: "Necesitas membresía activa para procesar la compra.",
    };
  }

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);

  if (!product) return { success: false, error: "Producto no encontrado." };

  const customLevelPercentages: [number, number, number, number, number] = [
    parseFloat(product.porcentajeN1),
    parseFloat(product.porcentajeN2),
    parseFloat(product.porcentajeN3),
    parseFloat(product.porcentajeN4),
    parseFloat(product.porcentajeN5),
  ];

  return processSaleAction({
    memberId: session.user.id,
    productId: product.id,
    category: product.commissionCategory,
    saleAmountNet: parseFloat(product.precioSocio),
    isPublicSale: false,
    customLevelPercentages,
    customPoolRate: parseFloat(product.porcentajePool),
  });
}