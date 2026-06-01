"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/infra/db";
import { courses } from "@/infra/db/schema";

export type CourseRow = typeof courses.$inferSelect;

type CoursePayload = {
  titulo: string;
  slug: string;
  descripcion?: string;
  badge?: string;
  categoria: string;
  modalidad?: string;
  frecuencia?: string;
  duracion?: string;
  acceso?: string;
  contenido?: string;
  perfilParticipante?: string;
};

export async function getAllCoursesAction(): Promise<CourseRow[]> {
  return db.select().from(courses).orderBy(courses.createdAt);
}

export async function getCourseByIdAction(id: string): Promise<CourseRow | null> {
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCourseAction(
  payload: CoursePayload,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const [row] = await db
      .insert(courses)
      .values({
        titulo: payload.titulo,
        slug: payload.slug,
        descripcion: payload.descripcion ?? null,
        badge: payload.badge ?? null,
        categoria: payload.categoria,
        modalidad: payload.modalidad ?? null,
        frecuencia: payload.frecuencia ?? null,
        duracion: payload.duracion ?? null,
        acceso: payload.acceso ?? "Solo socios activos",
        contenido: payload.contenido ?? null,
        perfilParticipante: payload.perfilParticipante ?? null,
      })
      .returning({ id: courses.id });

    revalidatePath("/admin/courses");
    return { success: true, id: row.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { success: false, error: "Ya existe un curso con ese slug." };
    }
    return { success: false, error: msg };
  }
}

export async function updateCourseAction(
  id: string,
  payload: CoursePayload,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db
      .update(courses)
      .set({
        titulo: payload.titulo,
        slug: payload.slug,
        descripcion: payload.descripcion ?? null,
        badge: payload.badge ?? null,
        categoria: payload.categoria,
        modalidad: payload.modalidad ?? null,
        frecuencia: payload.frecuencia ?? null,
        duracion: payload.duracion ?? null,
        acceso: payload.acceso ?? "Solo socios activos",
        contenido: payload.contenido ?? null,
        perfilParticipante: payload.perfilParticipante ?? null,
      })
      .where(eq(courses.id, id));

    revalidatePath("/admin/courses");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { success: false, error: "Ya existe un curso con ese slug." };
    }
    return { success: false, error: msg };
  }
}

export async function toggleCourseActiveAction(
  id: string,
): Promise<{ success: true; active: boolean } | { success: false; error: string }> {
  const rows = await db
    .select({ active: courses.active })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (!rows[0]) return { success: false, error: "Curso no encontrado." };

  const newActive = !rows[0].active;
  await db.update(courses).set({ active: newActive }).where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  return { success: true, active: newActive };
}
