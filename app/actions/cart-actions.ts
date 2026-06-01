"use server";

import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { carts, cartItems, products } from "@/infra/db/schema";
import { getCurrentUser } from "@/lib/current-user";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CartItemWithProduct = {
  id: string;
  quantity: number;
  product: {
    id: string;
    nombre: string;
    imagen: string | null;
    precioPublico: string;
    precioSocio: string;
    commissionCategory: string;
    categoria: string;
    porcentajeN1: string;
    porcentajeN2: string;
    porcentajeN3: string;
    porcentajeN4: string;
    porcentajeN5: string;
    porcentajePool: string;
  };
};

export type CartData = {
  id: string;
  items: CartItemWithProduct[];
  isSocioActivo: boolean;
};

async function getOrCreateCart(userId: string): Promise<string> {
  const existing = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [newCart] = await db
    .insert(carts)
    .values({ userId })
    .returning({ id: carts.id });

  return newCart.id;
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<ActionResult<{ cartItemId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);

  if (!product) return { success: false, error: "Producto no encontrado." };

  const cartId = await getOrCreateCart(session.user.id);

  const existing = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
    return { success: true, data: { cartItemId: existing[0].id } };
  }

  const [item] = await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .returning({ id: cartItems.id });

  return { success: true, data: { cartItemId: item.id } };
}

export async function removeFromCartAction(cartItemId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const [item] = await db
    .select({ id: cartItems.id, cartId: cartItems.cartId })
    .from(cartItems)
    .where(eq(cartItems.id, cartItemId))
    .limit(1);

  if (!item) return { success: false, error: "Item no encontrado." };

  const [cart] = await db
    .select({ userId: carts.userId })
    .from(carts)
    .where(eq(carts.id, item.cartId))
    .limit(1);

  if (!cart || cart.userId !== session.user.id) {
    return { success: false, error: "Sin permisos." };
  }

  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  return { success: true, data: undefined };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  if (quantity < 1 || quantity > 99) {
    return { success: false, error: "Cantidad inválida." };
  }

  const [item] = await db
    .select({ id: cartItems.id, cartId: cartItems.cartId })
    .from(cartItems)
    .where(eq(cartItems.id, cartItemId))
    .limit(1);

  if (!item) return { success: false, error: "Item no encontrado." };

  const [cart] = await db
    .select({ userId: carts.userId })
    .from(carts)
    .where(eq(carts.id, item.cartId))
    .limit(1);

  if (!cart || cart.userId !== session.user.id) {
    return { success: false, error: "Sin permisos." };
  }

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  return { success: true, data: undefined };
}

export async function getCartAction(): Promise<CartData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await getCurrentUser();
  const isSocioActivo = user?.membership?.status === "active" || user?.membership?.status === "grace";

  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, session.user.id))
    .limit(1);

  if (!cart) return { id: "", items: [], isSocioActivo };

  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      productId: products.id,
      nombre: products.nombre,
      imagen: products.imagen,
      precioPublico: products.precioPublico,
      precioSocio: products.precioSocio,
      commissionCategory: products.commissionCategory,
      categoria: products.categoria,
      porcentajeN1: products.porcentajeN1,
      porcentajeN2: products.porcentajeN2,
      porcentajeN3: products.porcentajeN3,
      porcentajeN4: products.porcentajeN4,
      porcentajeN5: products.porcentajeN5,
      porcentajePool: products.porcentajePool,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(and(eq(cartItems.cartId, cart.id), eq(products.active, true)));

  return {
    id: cart.id,
    isSocioActivo,
    items: rows.map((row) => ({
      id: row.id,
      quantity: row.quantity,
      product: {
        id: row.productId,
        nombre: row.nombre,
        imagen: row.imagen,
        precioPublico: row.precioPublico,
        precioSocio: row.precioSocio,
        commissionCategory: row.commissionCategory,
        categoria: row.categoria,
        porcentajeN1: row.porcentajeN1,
        porcentajeN2: row.porcentajeN2,
        porcentajeN3: row.porcentajeN3,
        porcentajeN4: row.porcentajeN4,
        porcentajeN5: row.porcentajeN5,
        porcentajePool: row.porcentajePool,
      },
    })),
  };
}

export async function getCartItemCountAction(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, session.user.id))
    .limit(1);

  if (!cart) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));

  return Number(result?.count ?? 0);
}

export async function clearCartAction(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}
