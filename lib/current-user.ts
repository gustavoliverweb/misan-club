import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/infra/db";
import { memberships, users } from "@/infra/db/schema";
import { auth } from "@/auth";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  kycStatus: "pending" | "verified" | "rejected";
  role: "admin" | "leader" | "member";
  membership: {
    status: "active" | "grace" | "expired";
    expiresAt: Date;
    graceEndsAt: Date | null;
    autoRenew: boolean;
  } | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      kycStatus: users.kycStatus,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!rows[0]) return null;

  const user = rows[0];
  console.log("Fetched user from DB:", user);

  const membershipRows = await db
    .select({
      status: memberships.status,
      expiresAt: memberships.expiresAt,
      graceEndsAt: memberships.graceEndsAt,
      autoRenew: memberships.autoRenew,
    })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  return { ...user, membership: membershipRows[0] ?? null };
});
