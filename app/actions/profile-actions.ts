"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { users } from "@/infra/db/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  phone: z.string().max(20).optional(),
  birthDate: z.string().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

export type UpdateProfileState = { success?: boolean; error?: string } | undefined;

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };

  const raw = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    bio: formData.get("bio") || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Datos inválidos." };
  }

  const { fullName, phone, birthDate, address, city, country, postalCode, bio } =
    parsed.data;

  await db
    .update(users)
    .set({
      fullName,
      phone: phone ?? null,
      birthDate: birthDate ?? null,
      address: address ?? null,
      city: city ?? null,
      country: country ?? null,
      postalCode: postalCode ?? null,
      bio: bio ?? null,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");

  return { success: true };
}
