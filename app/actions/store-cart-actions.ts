"use server";

import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/infra/db";
import { products } from "@/infra/db/schema";

const COOKIE_NAME = "store_cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type CartItem = { productId: string; qty: number };
type StoreCookie = { sellerId: string; items: CartItem[] };

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export type StoreCartItem = {
  productId: string;
  qty: number;
  nombre: string;
  imagen: string | null;
  precioPublico: string;
  precioSocio: string;
  commissionCategory: "standard" | "proprietary" | "reduced" | "membership" | "service";
  porcentajeN1: string;
  porcentajeN2: string;
  porcentajeN3: string;
  porcentajeN4: string;
  porcentajeN5: string;
  porcentajePool: string;
};

async function readCart(): Promise<StoreCookie | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoreCookie;
  } catch {
    return null;
  }
}

async function writeCart(data: StoreCookie): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function addToStoreCartAction(
  productId: string,
  sellerId: string,
): Promise<ActionResult> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);

  if (!product) return { success: false, error: "Producto no encontrado." };

  const current = await readCart();

  if (current && current.sellerId !== sellerId) {
    await writeCart({ sellerId, items: [{ productId, qty: 1 }] });
    return { success: true, data: undefined };
  }

  const items = current?.items ?? [];
  const existing = items.find((i) => i.productId === productId);

  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 99);
  } else {
    items.push({ productId, qty: 1 });
  }

  await writeCart({ sellerId, items });
  return { success: true, data: undefined };
}

export async function removeFromStoreCartAction(
  productId: string,
): Promise<ActionResult> {
  const current = await readCart();
  if (!current) return { success: false, error: "Carrito vacío." };

  current.items = current.items.filter((i) => i.productId !== productId);
  await writeCart(current);
  return { success: true, data: undefined };
}

export async function updateStoreCartQtyAction(
  productId: string,
  qty: number,
): Promise<ActionResult> {
  if (qty < 1 || qty > 99) return { success: false, error: "Cantidad inválida." };

  const current = await readCart();
  if (!current) return { success: false, error: "Carrito vacío." };

  const item = current.items.find((i) => i.productId === productId);
  if (!item) return { success: false, error: "Producto no en el carrito." };

  item.qty = qty;
  await writeCart(current);
  return { success: true, data: undefined };
}

export async function getStoreCartAction(sellerId?: string): Promise<{
  sellerId: string;
  items: StoreCartItem[];
} | null> {
  const current = await readCart();
  if (!current || current.items.length === 0) return null;
  if (sellerId && current.sellerId !== sellerId) return null;

  const productIds = current.items.map((i) => i.productId);
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), inArray(products.id, productIds)));

  const items: StoreCartItem[] = [];
  for (const ci of current.items) {
    const product = rows.find((r) => r.id === ci.productId);
    if (product) {
      items.push({
        productId: product.id,
        qty: ci.qty,
        nombre: product.nombre,
        imagen: product.imagen,
        precioPublico: product.precioPublico,
        precioSocio: product.precioSocio,
        commissionCategory: product.commissionCategory,
        porcentajeN1: product.porcentajeN1,
        porcentajeN2: product.porcentajeN2,
        porcentajeN3: product.porcentajeN3,
        porcentajeN4: product.porcentajeN4,
        porcentajeN5: product.porcentajeN5,
        porcentajePool: product.porcentajePool,
      });
    }
  }

  return { sellerId: current.sellerId, items };
}

export async function getStoreCartCountAction(sellerId?: string): Promise<number> {
  const current = await readCart();
  if (!current) return 0;
  if (sellerId && current.sellerId !== sellerId) return 0;
  return current.items.reduce((sum, i) => sum + i.qty, 0);
}

export async function clearStoreCartAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
