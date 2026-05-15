"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Package,
  Info,
  TrendingUp,
  AlertCircle,
  Link2,
  Link2Off,
} from "lucide-react";
import Link from "next/link";
import {
  createProductAction,
  updateProductAction,
} from "@/app/actions/product-actions";
import type { ProductRow } from "@/app/actions/product-actions";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const REDUCED_BRANDS = ["herbora", "pwd", "rincón herbal", "rincon herbal"];
const REDUCED_CATEGORY_KEYWORDS = ["editorial", "libros", "libro"];

const PRESETS = {
  standard:    { n1: 5,   n2: 3,   n3: 2,   n4: 1,   n5: 1   },
  proprietary: { n1: 10,  n2: 6,   n3: 4,   n4: 2,   n5: 2   },
  reduced:     { n1: 2.5, n2: 1.5, n3: 1,   n4: 0.5, n5: 0.5 },
  membership:  { n1: 5,   n2: 3,   n3: 2,   n4: 1,   n5: 1   },
  service:     { n1: 5,   n2: 3,   n3: 2,   n4: 1,   n5: 1   },
} as const;

type Rates = { n1: number; n2: number; n3: number; n4: number; n5: number; pool: number };

const COMMISSION_CATEGORIES = [
  { value: "standard",    label: "Estándar (5/3/2/1/1%)" },
  { value: "proprietary", label: "Propio 2× (10/6/4/2/2%)" },
  { value: "reduced",     label: "Reducido 50% (2.5/1.5/1/0.5/0.5%)" },
  { value: "membership",  label: "Membresía (5/3/2/1/1%)" },
  { value: "service",     label: "Servicio (sobre margen)" },
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

function initRates(product?: ProductRow): Rates {
  if (!product) return { ...PRESETS.standard, pool: PRESETS.standard.n1 };
  return {
    n1:   parseFloat(product.porcentajeN1)   * 100,
    n2:   parseFloat(product.porcentajeN2)   * 100,
    n3:   parseFloat(product.porcentajeN3)   * 100,
    n4:   parseFloat(product.porcentajeN4)   * 100,
    n5:   parseFloat(product.porcentajeN5)   * 100,
    pool: parseFloat(product.porcentajePool) * 100,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  mode: "create" | "edit";
  productId?: string;
  initialData?: ProductRow;
};

export function ProductForm({ mode, productId, initialData }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nombre,      setNombre]      = useState(initialData?.nombre      ?? "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? "");
  const [categoria,   setCategoria]   = useState(initialData?.categoria   ?? "bienestar-en-casa");
  const [subcategoria, setSubcategoria] = useState(initialData?.subcategoria ?? "");
  const [marca,       setMarca]       = useState(initialData?.marca       ?? "");
  const [imagen,      setImagen]      = useState(initialData?.imagen      ?? "");
  const [pvp,         setPvp]         = useState(
    initialData ? parseFloat(initialData.precioPublico).toString() : "",
  );
  const [precioSocio, setPrecioSocio] = useState(
    initialData ? parseFloat(initialData.precioSocio).toString() : "",
  );
  const [commCat,  setCommCat]  = useState<string>(initialData?.commissionCategory ?? "standard");
  const [rates,    setRates]    = useState<Rates>(() => initRates(initialData));
  const [participaPool, setParticipaPool] = useState(initialData?.participaEnPool ?? true);
  const [generaAf,      setGeneraAf]      = useState(initialData?.generaAutofactura ?? true);
  const [autoFilled,    setAutoFilled]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const [poolSyncedToN1, setPoolSyncedToN1] = useState(() => {
    if (!initialData) return true;
    const n1   = parseFloat(initialData.porcentajeN1)   * 100;
    const pool = parseFloat(initialData.porcentajePool) * 100;
    return Math.abs(n1 - pool) < 0.01;
  });

  // Auto-fill plan based on brand / category
  useEffect(() => {
    const isReduced =
      REDUCED_BRANDS.includes(marca.trim().toLowerCase()) ||
      REDUCED_CATEGORY_KEYWORDS.some((kw) => categoria.toLowerCase().includes(kw));

    if (isReduced) {
      setRates({ ...PRESETS.reduced, pool: PRESETS.reduced.n1 });
      setCommCat("reduced");
      setAutoFilled(true);
      setPoolSyncedToN1(true);
    } else if (autoFilled) {
      setRates({ ...PRESETS.standard, pool: PRESETS.standard.n1 });
      setCommCat("standard");
      setAutoFilled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marca, categoria]);

  // Pool sync to N1
  useEffect(() => {
    if (poolSyncedToN1) {
      setRates((r) => ({ ...r, pool: r.n1 }));
    }
  }, [rates.n1, poolSyncedToN1]);

  function handleCommCatChange(val: string) {
    setCommCat(val);
    const preset = PRESETS[val as keyof typeof PRESETS] ?? PRESETS.standard;
    setRates({ ...preset, pool: poolSyncedToN1 ? preset.n1 : rates.pool });
    setAutoFilled(false);
  }

  function handlePoolChange(v: number) {
    setPoolSyncedToN1(false);
    setRates((r) => ({ ...r, pool: v }));
  }

  // Computed values
  const pvpNum   = parseFloat(pvp)         || 0;
  const socioNum = parseFloat(precioSocio) || 0;
  const hasPrices      = pvpNum > 0 && socioNum > 0;
  const marginEur      = hasPrices ? pvpNum - socioNum : 0;
  const marginPct      = hasPrices ? (marginEur / pvpNum) * 100 : 0;
  const totalNetworkPct = rates.n1 + rates.n2 + rates.n3 + rates.n4 + rates.n5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      nombre,
      descripcion:  descripcion  || undefined,
      categoria,
      subcategoria: subcategoria || undefined,
      marca:        marca        || undefined,
      imagen:       imagen       || undefined,
      precioPublico:       parseFloat(pvp),
      precioSocio:         parseFloat(precioSocio),
      commissionCategory:  commCat,
      porcentajeN1:   rates.n1   / 100,
      porcentajeN2:   rates.n2   / 100,
      porcentajeN3:   rates.n3   / 100,
      porcentajeN4:   rates.n4   / 100,
      porcentajeN5:   rates.n5   / 100,
      porcentajePool: rates.pool / 100,
      participaEnPool:    participaPool,
      generaAutofactura:  generaAf,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProductAction(payload)
          : await updateProductAction(productId!, payload);

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
          className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeft size={15} />
          Productos
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Package size={22} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "Nuevo producto" : "Editar producto"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Datos básicos ──────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
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
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

        {/* ── Precios ────────────────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Precios</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio público (PVP) *" hint="IVA incluido — precio de mercado">
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  €
                </span>
              </div>
            </Field>

            <Field label="Precio socio *" hint="Base para el cálculo de comisiones">
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  €
                </span>
              </div>
            </Field>
          </div>

          {hasPrices && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium text-blue-600">Margen directo</p>
                <p className="text-xl font-bold text-blue-700">{fmt.format(marginEur)}</p>
                <p className="text-xs text-blue-500">{marginPct.toFixed(1)}% sobre PVP</p>
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-xs font-medium text-green-600">Ahorro del socio</p>
                <p className="text-xl font-bold text-green-700">{fmt.format(marginEur)}</p>
                <p className="text-xs text-green-500">{marginPct.toFixed(1)}% de descuento</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Motor de comisiones ────────────────────────────────────── */}
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Motor de comisiones</h2>
            </div>
            {autoFilled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Info size={11} />
                Plan reducido auto-aplicado
              </span>
            )}
          </div>

          {/* Plan selector */}
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

          {/* Level rates grid */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Porcentajes por nivel — base: precio socio
            </p>
            <div className="grid grid-cols-5 gap-3">
              <PctInput label="Nivel 1" value={rates.n1} onChange={(v) => setRates((r) => ({ ...r, n1: v }))} />
              <PctInput label="Nivel 2" value={rates.n2} onChange={(v) => setRates((r) => ({ ...r, n2: v }))} />
              <PctInput label="Nivel 3" value={rates.n3} onChange={(v) => setRates((r) => ({ ...r, n3: v }))} />
              <PctInput label="Nivel 4" value={rates.n4} onChange={(v) => setRates((r) => ({ ...r, n4: v }))} />
              <PctInput label="Nivel 5" value={rates.n5} onChange={(v) => setRates((r) => ({ ...r, n5: v }))} />
            </div>
            <p className="text-xs text-gray-400">
              MDS / Academy admiten hasta 200% (introduce valores manualmente).
            </p>
          </div>

          {/* Pool */}
          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Pool trimestral</span>
              <button
                type="button"
                onClick={() => setPoolSyncedToN1((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  poolSyncedToN1
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {poolSyncedToN1 ? (
                  <><Link2 size={11} /> Sincronizado con N1</>
                ) : (
                  <><Link2Off size={11} /> Fijar a N1</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <PctInput label="% Pool" value={rates.pool} onChange={handlePoolChange} />
              <div className="pb-1">
                <Toggle
                  checked={participaPool}
                  onChange={setParticipaPool}
                  label="Participa en pool"
                  description="Suma al fondo trimestral"
                />
              </div>
            </div>
          </div>

          {/* Live commission preview */}
          {socioNum > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Previsión por venta — base: {fmt.format(socioNum)}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(
                  [
                    { label: "N1",   pct: rates.n1 },
                    { label: "N2",   pct: rates.n2 },
                    { label: "N3",   pct: rates.n3 },
                    { label: "N4",   pct: rates.n4 },
                    { label: "N5",   pct: rates.n5 },
                    { label: "Pool", pct: rates.pool },
                  ] as { label: string; pct: number }[]
                ).map(({ label, pct }) => (
                  <div
                    key={label}
                    className="rounded-md border border-blue-100 bg-white p-2.5 text-center"
                  >
                    <p className="text-[10px] font-medium text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {fmt.format((socioNum * pct) / 100)}
                    </p>
                    <p className="text-[10px] text-blue-600">{pct}%</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-blue-100 pt-2">
                <span className="text-xs text-gray-500">Total red (N1–N5)</span>
                <span className="text-sm font-semibold text-gray-900">
                  {fmt.format((socioNum * totalNetworkPct) / 100)}{" "}
                  <span className="text-xs font-normal text-blue-600">
                    ({totalNetworkPct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ── Opciones ───────────────────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Opciones</h2>
          <Toggle
            checked={generaAf}
            onChange={setGeneraAf}
            label="Generar autofactura automáticamente"
            description="Al procesar la compra se genera un documento fiscal para el socio"
          />
        </section>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} className="mt-px shrink-0" />
            {error}
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-10">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending
              ? "Guardando…"
              : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
          </button>
          <Link
            href="/admin/products"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}