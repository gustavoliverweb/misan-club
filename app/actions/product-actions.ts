"use server";

import { and, eq } from "drizzle-orm";
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

export async function getAllProductsAction(): Promise<ProductRow[]> {
  return db.select().from(products);
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