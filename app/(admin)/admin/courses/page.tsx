import Link from "next/link";
import { BookOpen, Plus, Pencil } from "lucide-react";
import { getAllCoursesAction } from "@/app/actions/course-actions";
import { ToggleCourseActiveButton } from "@/components/admin/toggle-course-active-button";

const CATEGORIA_LABELS: Record<string, string> = {
  "misan-club-academy":       "Misan Club Academy",
  "tribal-training-seminars": "Tribal Training Seminars",
  "inteligencia-artificial":  "Inteligencia Artificial",
};

export default async function AdminCoursesPage() {
  const coursesList = await getAllCoursesAction();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cursos de Formación</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {coursesList.length} curso{coursesList.length !== 1 ? "s" : ""} en catálogo
            </p>
          </div>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={15} />
          Nuevo curso
        </Link>
      </div>

      {coursesList.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <BookOpen size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No hay cursos todavía.</p>
          <Link
            href="/admin/courses/new"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <Plus size={13} />
            Crear el primer curso
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Título</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Categoría</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Modalidad</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Activo</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coursesList.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.titulo}</p>
                    {c.badge && <p className="text-xs text-gray-400">{c.badge}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORIA_LABELS[c.categoria] ?? c.categoria}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{c.modalidad ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <ToggleCourseActiveButton courseId={c.id} initialActive={c.active} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/courses/${c.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                    >
                      <Pencil size={11} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
