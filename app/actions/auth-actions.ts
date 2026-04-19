"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/infra/db";
import { networkHierarchy, users } from "@/infra/db/schema";

type AuthState = { error?: string } | undefined;

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .trim(),
  email: z.string().email({ message: "Email inválido." }).trim(),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  ref: z.string().uuid().optional(),
});

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email o contraseña incorrectos." };
      }
      return { error: "Error al iniciar sesión. Intenta de nuevo." };
    }
    throw error;
  }
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    ref: formData.get("ref") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, email, password, ref } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let sponsorId: string | null = null;

  console.log("Código de referido proporcionado:", ref);
  if (ref) {
    const sponsor = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, ref))
      .limit(1);
    if (sponsor[0]) sponsorId = sponsor[0].id;
  }

  if (!sponsorId) {
    const corporateEmail =
      process.env.CORPORATE_SPONSOR_EMAIL ?? "admin@misanclub.com";
    const admin = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, corporateEmail))
      .limit(1);
    if (admin[0]) sponsorId = admin[0].id;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      fullName,
      passwordHash,
      role: "member",
      kycStatus: "pending",
    })
    .returning({ id: users.id });

  if (!newUser) {
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  const sponsorNode = sponsorId
    ? await db
        .select({ depth: networkHierarchy.depth })
        .from(networkHierarchy)
        .where(eq(networkHierarchy.memberId, sponsorId))
        .limit(1)
    : [];

  const newDepth = sponsorNode[0] ? sponsorNode[0].depth + 1 : 0;

  await db.insert(networkHierarchy).values({
    memberId: newUser.id,
    sponsorId,
    depth: newDepth,
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
