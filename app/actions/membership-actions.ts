"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { memberships } from "@/infra/db/schema";

type ToggleAutoRenewState = { error?: string; autoRenew?: boolean } | undefined;

export async function toggleAutoRenewAction(
  _prev: ToggleAutoRenewState,
): Promise<ToggleAutoRenewState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };

  const userId = session.user.id;

  const rows = await db
    .select({ id: memberships.id, autoRenew: memberships.autoRenew })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  if (!rows[0]) return { error: "No tienes una membresía activa." };

  const newValue = !rows[0].autoRenew;

  await db
    .update(memberships)
    .set({ autoRenew: newValue })
    .where(eq(memberships.id, rows[0].id));

  revalidatePath("/settings");

  return { autoRenew: newValue };
}
