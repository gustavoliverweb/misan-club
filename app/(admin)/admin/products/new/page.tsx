"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package, Info } from "lucide-react";
import Link from "next/link";
import { createProductAction } from "@/app/actions/product-actions";

// Brands and categories that get the 50% reduced commission plan
const REDUCED_BRANDS = ["herbora", "pwd", "rincón herbal", "rincon herbal"];
const REDUCED_CATEGORY_KEYWORDS = ["editorial", "libros", "libro"];

const STANDARD = { n1: 5, n2: 3, n3: 2, n4: 1, n5: 1, pool: 5, cat: "standard" };
const REDUCED  = { n1: 2.5, n2: 1.5, n3: 1, n4: 0.5, n5: 0.5, pool: 2.5, cat: "reduced" };

type Rates = { n1: number; n2: number; n3: number; n4: number; n5: number; pool: number; cat: string };

const COMMISSION_CATEGORIES = [
  { value: "standard",    label: "Estándar (5/3/2/1/1%)" },
  { value: "proprietary", label: "Propio 2× (10/6/4/2/2%)" },
  { value: "reduced",     label: "Reducido 50% (2.5/1.5/1/0.5/0.5%)" },
  { value: "membership",  label: "Membresía (5/3/2/1/1%)" },
  { value: "service",     label: "Servicio (sobre margen 30%)" },
];

const SHOP_CATEGORIES = [
  { value: "bienestar-en-casa",          label: "Bienestar en Casa" },
  { value: "complementos-nutricionales", label: "Complementos Nutricionales" },
  { value: "elixsia-cosmetics",          label: "Elixsia Cosmetics" },
  { value: "misan-editorial",            label: "Misan Editorial" },
  { value: "cursos-y-formaciones",       label: "Cursos y Formaciones" },
  { value: "membresias",                 label: "Membresías" },
  { value: "servicios-ia",               label: "Servicios IA" },
];

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

function PctInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={200}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          %
        </span>
      </div>
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("bienestar-en-casa");
  const [subcategoria, setSubcategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [imagen, setImagen] = useState("");
  const [pvp, setPvp] = useState("");
  const [precioSocio, setPrecioSocio] = useState("");
  const [commCat, setCommCat] = useState("standard");
  const [rates, setRates] = useState<Rates>(STANDARD);
  const [participaPool, setParticipaPool] = useState(true);
  const [generaAf, setGeneraAf] = useState(true);
  const [autoFilled, setAutoFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill commission rates based on brand / category
  useEffect(() => {
    const isReduced =
      REDUCED_BRANDS.includes(marca.trim().toLowerCase()) ||
      REDUCED_CATEGORY_KEYWORDS.some((kw) => categoria.toLowerCase().includes(kw));

    if (isReduced) {
      setRates(REDUCED as Rates);
      setCommCat("reduced");
      setAutoFilled(true);
    } else if (autoFilled) {
      // Only reset to standard if we previously auto-filled (don't overwrite manual edits)
      setRates(STANDARD as Rates);
      setCommCat("standard");
      setAutoFilled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marca, categoria]);

  // Keep pool rate in sync with N1 as the default (user can still override)
  useEffect(() => {
    setRates((r) => ({ ...r, pool: r.n1 }));
  }, [rates.n1]);

  function handleCommCatChange(val: string) {
    setCommCat(val);
    if (val === "standard")    { setRates(STANDARD as Rates); setAutoFilled(false); }
    if (val === "reduced")     { setRates(REDUCED as Rates);  setAutoFilled(false); }
    if (val === "proprietary") { setRates({ n1: 10, n2: 6, n3: 4, n4: 2, n5: 2, pool: 10, cat: "proprietary" }); setAutoFilled(false); }
    if (val === "membership")  { setRates(STANDARD as Rates); setAutoFilled(false); }
  }

  const marginCalc = pvp && precioSocio
    ? (parseFloat(pvp) - parseFloat(precioSocio)).toFixed(2)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createProductAction({
        nombre,
        descripcion: descripcion || undefined,
        categoria,
        subcategoria: subcategoria || undefined,
        marca: marca || undefined,
        imagen: imagen || undefined,
        precioPublico: parseFloat(pvp),
        precioSocio: parseFloat(precioSocio),
        commissionCategory: commCat,
        porcentajeN1: rates.n1 / 100,
        porcentajeN2: rates.n2 / 100,
        porcentajeN3: rates.n3 / 100,
        porcentajeN4: rates.n4 / 100,
        porcentajeN5: rates.n5 / 100,
        porcentajePool: rates.pool / 100,
        participaEnPool: participaPool,
        generaAutofactura: generaAf,
      });

      if (res.success) {
        router.push("/admin/products");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Productos
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Package size={22} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Datos básicos ─────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Datos básicos</h2>

          <Field label="Nombre *">
            <Input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Botella Hidrogenadora Portátil NOK"
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción del producto…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría *">
              <select
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {SHOP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Subcategoría" hint="ej: agua/agua-hidrogenada">
              <Input
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                placeholder="agua/agua-hidrogenada"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca">
              <Input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="NOK, Herbora, PWD…"
              />
            </Field>

            <Field label="Imagen (URL)">
              <Input
                type="url"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>
        </section>

        {/* ── Precios ───────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Precios</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio público (PVP) *" hint="Impuestos incluidos">
              <div className="relative">
                <Input
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  value={pvp}
                  onChange={(e) => setPvp(e.target.value)}
                  placeholder="695.00"
                  className="pl-7"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              </div>
            </Field>

            <Field label="Precio socio (neto, sin IVA) *" hint="Base para el cálculo de comisiones">
              <div className="relative">
                <Input
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  value={precioSocio}
                  onChange={(e) => setPrecioSocio(e.target.value)}
                  placeholder="565.00"
                  className="pl-7"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              </div>
            </Field>
          </div>

          {marginCalc && (
            <p className="text-sm text-blue-600">
              Margen directo calculado: <strong>€{marginCalc}</strong>{" "}
              (PVP − Precio socio)
            </p>
          )}
        </section>

        {/* ── Comisiones ────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Motor de comisiones</h2>
            {autoFilled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Info size={11} />
                Plan reducido auto-aplicado
              </span>
            )}
          </div>

          <Field label="Tipo de plan *">
            <select
              value={commCat}
              onChange={(e) => handleCommCatChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {COMMISSION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <div className="rounded-lg bg-gray-50 p-4 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Porcentajes por nivel — Base: precio socio sin IVA
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <PctInput label="Nivel 1" value={rates.n1} onChange={(v) => setRates((r) => ({ ...r, n1: v }))} />
              <PctInput label="Nivel 2" value={rates.n2} onChange={(v) => setRates((r) => ({ ...r, n2: v }))} />
              <PctInput label="Nivel 3" value={rates.n3} onChange={(v) => setRates((r) => ({ ...r, n3: v }))} />
              <PctInput label="Nivel 4" value={rates.n4} onChange={(v) => setRates((r) => ({ ...r, n4: v }))} />
              <PctInput label="Nivel 5" value={rates.n5} onChange={(v) => setRates((r) => ({ ...r, n5: v }))} />
              <PctInput label="Pool" value={rates.pool} onChange={(v) => setRates((r) => ({ ...r, pool: v }))} />
            </div>
            <p className="text-xs text-gray-400">
              MDS / Academy pueden usar 200% (introduce valores manuales).
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={participaPool}
                onChange={(e) => setParticipaPool(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
              />
              Participa en el pool trimestral
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={generaAf}
                onChange={(e) => setGeneraAf(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
              />
              Generar autofactura automáticamente
            </label>
          </div>
        </section>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {/* ── Submit ────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar producto"}
          </button>
          <Link
            href="/admin/products"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}