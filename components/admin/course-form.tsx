"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createCourseAction, updateCourseAction } from "@/app/actions/course-actions";
import type { CourseRow } from "@/app/actions/course-actions";

const CATEGORIAS = [
  { value: "misan-club-academy",       label: "Misan Club Academy" },
  { value: "tribal-training-seminars", label: "Tribal Training Seminars" },
  { value: "inteligencia-artificial",  label: "Inteligencia Artificial" },
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

type Props = {
  mode: "create" | "edit";
  courseId?: string;
  initialData?: CourseRow;
};

export function CourseForm({ mode, courseId, initialData }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [titulo,             setTitulo]             = useState(initialData?.titulo             ?? "");
  const [slug,               setSlug]               = useState(initialData?.slug               ?? "");
  const [slugManual,         setSlugManual]         = useState(!!initialData);
  const [descripcion,        setDescripcion]        = useState(initialData?.descripcion        ?? "");
  const [badge,              setBadge]              = useState(initialData?.badge              ?? "");
  const [categoria,          setCategoria]          = useState(initialData?.categoria          ?? "misan-club-academy");
  const [modalidad,          setModalidad]          = useState(initialData?.modalidad          ?? "");
  const [frecuencia,         setFrecuencia]         = useState(initialData?.frecuencia         ?? "");
  const [duracion,           setDuracion]           = useState(initialData?.duracion           ?? "");
  const [acceso,             setAcceso]             = useState(initialData?.acceso             ?? "Solo socios activos");
  const [contenido,          setContenido]          = useState(initialData?.contenido          ?? "");
  const [perfilParticipante, setPerfilParticipante] = useState(initialData?.perfilParticipante ?? "");
  const [error,              setError]              = useState<string | null>(null);

  function handleTituloChange(value: string) {
    setTitulo(value);
    if (!slugManual) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      titulo,
      slug,
      descripcion:        descripcion        || undefined,
      badge:              badge              || undefined,
      categoria,
      modalidad:          modalidad          || undefined,
      frecuencia:         frecuencia         || undefined,
      duracion:           duracion           || undefined,
      acceso:             acceso             || undefined,
      contenido:          contenido          || undefined,
      perfilParticipante: perfilParticipante || undefined,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createCourseAction(payload)
          : await updateCourseAction(courseId!, payload);

      if (res.success) {
        router.push("/admin/courses");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses"
          className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeft size={15} />
          Cursos
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <BookOpen size={22} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "Nuevo curso" : "Editar curso"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Datos básicos ──────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Datos básicos</h2>

          <Field label="Título *">
            <Input
              required
              value={titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              placeholder="Mentes Ricas, Ingresos Reales"
            />
          </Field>

          <Field
            label="Slug (URL) *"
            hint={`Ruta pública: /formacion/${categoria}/${slug || "…"}`}
          >
            <Input
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="mentes-ricas-ingresos-reales"
              pattern="[a-z0-9\-]+"
              title="Solo letras minúsculas, números y guiones"
            />
          </Field>

          <Field label="Categoría *">
            <select
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Descripción" hint="Texto corto para la tarjeta de listado">
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Un taller quincenal para activar tu mentalidad y tus ingresos…"
            />
          </Field>

          <Field label="Badge" hint="Texto de la pastilla superior, ej: «Dinero · Mentalidad · Solo socios»">
            <Input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Dinero · Mentalidad · Solo socios"
            />
          </Field>
        </section>

        {/* ── Formato ────────────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Formato</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Modalidad">
              <Input
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                placeholder="Online en directo"
              />
            </Field>
            <Field label="Frecuencia">
              <Input
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value)}
                placeholder="Cada 15 días"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duración">
              <Input
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                placeholder="60–90 min por sesión"
              />
            </Field>
            <Field label="Acceso">
              <Input
                value={acceso}
                onChange={(e) => setAcceso(e.target.value)}
                placeholder="Solo socios activos"
              />
            </Field>
          </div>
        </section>

        {/* ── Contenido ──────────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Contenido del curso</h2>

          <Field
            label="Qué aprenderás"
            hint="Un punto por línea. Cada línea aparece como un ítem en la página del curso."
          >
            <Textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={6}
              placeholder={`Cómo transformar tu relación con el dinero\nEliminar creencias limitantes sobre los ingresos\nTécnicas para vender productos de fácil rotación`}
            />
          </Field>

          <Field label="Perfil del participante">
            <Textarea
              value={perfilParticipante}
              onChange={(e) => setPerfilParticipante(e.target.value)}
              rows={4}
              placeholder="Para personas que quieren generar ingresos reales mientras transforman la mentalidad que los ha limitado hasta ahora…"
            />
          </Field>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} className="mt-px shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pb-10">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending
              ? "Guardando…"
              : mode === "create"
              ? "Crear curso"
              : "Guardar cambios"}
          </button>
          <Link
            href="/admin/courses"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
