"use server";

import { db } from "@/infra/db";
import { contactRequests } from "@/infra/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitProductInquiryAction(data: {
  productId: string;
  productName: string;
  nombre: string;
  email: string;
  mensaje: string;
}): Promise<ActionResult> {
  const { productId, productName, nombre, email, mensaje } = data;

  if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "El correo electrónico no es válido." };
  }

  await db.insert(contactRequests).values({
    productId: productId || null,
    productName,
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    mensaje: mensaje.trim(),
  });

  return { success: true };
}
