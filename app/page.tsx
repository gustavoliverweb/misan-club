import Link from "next/link";
import { ArrowRight, Check, CreditCard, Share2, Wallet } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ContactForm } from "@/components/marketing/contact-form";

const steps = [
  {
    number: "01",
    Icon: CreditCard,
    title: "Activa tu membresía",
    description:
      "30€ al año. Pago por Stripe, activación instantánea.",
  },
  {
    number: "02",
    Icon: Share2,
    title: "Comparte tu enlace",
    description:
      "Un clic para copiar tu enlace referido. Cada registro que entra por él pasa directo a tu nivel 1.",
  },
  {
    number: "03",
    Icon: Wallet,
    title: "Cobra automático",
    description:
      "Las comisiones se acreditan en tiempo real en tu wallet. Retiro disponible los días 1 al 5 de cada mes.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-14">

        {/* Radial glow — fondo azul muy sutil centrado */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(0,153,255,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Badge label */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Plataforma MLM · 5 niveles · Wallet en tiempo real
          </span>
        </div>

        {/* H1 */}
        <h1
          className="max-w-3xl text-center font-bold text-white"
          style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
          }}
        >
          Tu red trabaja.
          <br />
          Tú cobras.
        </h1>

        {/* Subtítulo */}
        <p className="mt-8 max-w-[420px] text-center text-base leading-relaxed text-muted">
          Construye una red de 5 niveles, cobra comisiones automáticas y
          gestiona todo desde un wallet con ledger inmutable.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Empieza gratis
            <ArrowRight size={14} />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-7 text-sm font-medium text-fg transition-colors hover:bg-white/15"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* ── Dashboard mockup ─────────────────────────── */}
        <div className="relative mt-20 w-full max-w-4xl">

          {/* Fade bottom para que "flote" sin corte brusco */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-28"
            style={{
              background: "linear-gradient(to top, #000000 0%, transparent 100%)",
            }}
          />

          {/* Marco del mockup */}
          <div
            className="overflow-hidden rounded-2xl bg-card"
            style={{
              boxShadow:
                "rgba(0,153,255,0.22) 0px 0px 0px 1px, rgba(0,0,0,0.55) 0px 40px 80px -12px",
            }}
          >
            {/* Barra superior tipo browser */}
            <div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
              <span className="ml-4 text-xs text-muted">
                misanclub.com/dashboard
              </span>
            </div>

            {/* Bento Grid simulado */}
            <div className="grid grid-cols-3 gap-2.5 p-4">

              {/* Saldo */}
              <div className="rounded-xl border border-white/[0.05] bg-subtle p-4">
                <p className="text-[11px] text-muted">Saldo wallet</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
                  €1,240
                </p>
                <p className="mt-1 text-[11px] text-accent">+€340 este mes</p>
              </div>

              {/* Red */}
              <div className="rounded-xl border border-white/[0.05] bg-subtle p-4">
                <p className="text-[11px] text-muted">Socios en red</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
                  47
                </p>
                <p className="mt-1 text-[11px] text-muted">5 niveles activos</p>
              </div>

              {/* Membresía */}
              <div className="rounded-xl border border-white/[0.05] bg-subtle p-4">
                <p className="text-[11px] text-muted">Membresía</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
                  Activa
                </p>
                <p className="mt-1 text-[11px] text-muted">Vence en 24 días</p>
              </div>

              {/* Gráfica de barras */}
              <div className="col-span-2 rounded-xl border border-white/[0.05] bg-subtle p-4">
                <p className="mb-3 text-[11px] text-muted">
                  Comisiones — últimas 7 semanas
                </p>
                <div className="flex h-16 items-end gap-1.5">
                  {[55, 38, 72, 48, 85, 40, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-stretch justify-end gap-0.5"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: `rgba(0,153,255,${0.15 + (h / 100) * 0.45})`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mi red — niveles */}
              <div className="rounded-xl border border-white/[0.05] bg-subtle p-4">
                <p className="mb-3 text-[11px] text-muted">Mi red</p>
                <div className="space-y-2">
                  {[
                    { label: "Nv. 1", count: 3, pct: 100 },
                    { label: "Nv. 2", count: 9, pct: 72 },
                    { label: "Nv. 3", count: 18, pct: 46 },
                    { label: "Nv. 4", count: 12, pct: 28 },
                  ].map(({ label, count, pct }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-9 shrink-0 text-[10px] text-muted">
                        {label}
                      </span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "rgba(0,153,255,0.5)",
                          }}
                        />
                      </div>
                      <span className="w-5 shrink-0 text-right text-[10px] text-muted">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────── */}
      <section id="como-funciona" className="px-6 py-32">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-20 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Proceso
            </p>
            <h2
              className="font-bold text-fg"
              style={{
                fontSize: "clamp(36px, 5vw, 62px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
              }}
            >
              Tres pasos para
              <br />
              empezar a cobrar
            </h2>
          </div>

          {/* Steps */}
          <div className="relative">

            {/* Conector punteado entre iconos — solo desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-7 hidden md:block"
              style={{
                left: "calc(16.666% + 28px)",
                right: "calc(16.666% + 28px)",
                height: "1px",
                backgroundImage:
                  "repeating-linear-gradient(to right, rgba(0,153,255,0.25) 0, rgba(0,153,255,0.25) 4px, transparent 4px, transparent 10px)",
              }}
            />

            <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
              {steps.map(({ number, Icon, title, description }) => (
                <div key={number} className="flex flex-col items-center text-center">

                  {/* Icono — z-10 para tapar la línea */}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black">
                    <Icon size={18} className="text-accent" />
                  </div>

                  {/* Número decorativo */}
                  <p
                    aria-hidden
                    className="mt-3 select-none font-bold leading-none text-white/4"
                    style={{ fontSize: "72px", letterSpacing: "-0.04em" }}
                  >
                    {number}
                  </p>

                  <h3
                    className="-mt-3 text-lg font-bold text-fg"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {title}
                  </h3>
                  <p className="mt-2 max-w-55 text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────── */}
      <section id="beneficios" className="px-6 py-32">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-24 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Beneficios
            </p>
            <h2
              className="font-bold text-fg"
              style={{
                fontSize: "clamp(36px, 5vw, 62px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
              }}
            >
              Herramientas reales.
              <br />
              Resultados reales.
            </h2>
          </div>

          {/* ── Beneficio 1: Red multinivel ── */}
          <div className="mb-32 grid grid-cols-1 items-center gap-12 md:grid-cols-5">

            {/* Texto */}
            <div className="md:col-span-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Red multinivel
              </p>
              <h3
                className="font-bold text-fg"
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                Ingresos que se
                <br />
                multiplican en
                <br />
                5 niveles
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Cada persona que traes genera comisiones cuando vende.
                Sus referidos también. Hasta el quinto nivel de
                profundidad, de forma automática.
              </p>
            </div>

            {/* Visual: niveles de red */}
            <div className="md:col-span-3">
              <div
                className="overflow-hidden rounded-2xl bg-card p-6"
                style={{
                  boxShadow:
                    "rgba(0,153,255,0.18) 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 24px 48px -8px",
                }}
              >
                <p className="mb-5 text-xs text-muted">Mi Red</p>
                <div className="space-y-3">
                  {[
                    { level: "Nivel 1", members: 12, pct: 100, commission: "+€120" },
                    { level: "Nivel 2", members: 9,  pct: 75,  commission: "+€72"  },
                    { level: "Nivel 3", members: 7,  pct: 55,  commission: "+€42"  },
                    { level: "Nivel 4", members: 4,  pct: 32,  commission: "+€24"  },
                    { level: "Nivel 5", members: 2,  pct: 16,  commission: "+€8"   },
                  ].map(({ level, members, pct, commission }) => (
                    <div key={level} className="flex items-center gap-3">
                      <span className="w-14 shrink-0 text-[11px] text-muted">{level}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `rgba(0,153,255,${0.25 + pct / 200})`,
                          }}
                        />
                      </div>
                      <span className="w-5 shrink-0 text-center text-[11px] text-muted">
                        {members}
                      </span>
                      <span className="w-12 shrink-0 text-right text-[11px] font-medium text-accent">
                        {commission}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-6 border-t border-white/6 pt-5">
                  {[
                    { value: "34", label: "socios activos" },
                    { value: "5",  label: "niveles" },
                    { value: "€266", label: "este mes" },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <p className="text-xl font-bold tracking-tight text-fg">{value}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Beneficio 2: Wallet inmutable ── */}
          <div className="mb-32 grid grid-cols-1 items-center gap-12 md:grid-cols-5">

            {/* Visual: ledger — aparece primero en desktop */}
            <div className="md:col-span-3 md:order-first">
              <div
                className="overflow-hidden rounded-2xl bg-card"
                style={{
                  boxShadow:
                    "rgba(0,153,255,0.18) 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 24px 48px -8px",
                }}
              >
                {/* Header del wallet */}
                <div className="flex items-end justify-between border-b border-white/6 px-5 py-4">
                  <p className="text-xs text-muted">Wallet</p>
                  <p className="text-2xl font-bold tracking-tight text-fg">€1,240</p>
                </div>
                {/* Transacciones */}
                <div className="divide-y divide-white/4">
                  {[
                    { type: "credit", amount: "+€120.00", desc: "Comisión Nivel 1", date: "12 may" },
                    { type: "credit", amount: "+€48.00",  desc: "Comisión Nivel 2", date: "10 may" },
                    { type: "credit", amount: "+€72.00",  desc: "Comisión Nivel 1", date: "08 may" },
                    { type: "debit",  amount: "−€50.00",  desc: "Retiro solicitado", date: "05 may" },
                    { type: "credit", amount: "+€24.00",  desc: "Comisión Nivel 3", date: "02 may" },
                  ].map(({ type, amount, desc, date }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            type === "credit"
                              ? "rgba(0,153,255,0.8)"
                              : "rgba(255,255,255,0.2)",
                        }}
                      />
                      <span
                        className={`w-20 shrink-0 text-sm font-medium tabular-nums ${
                          type === "credit" ? "text-accent" : "text-muted"
                        }`}
                      >
                        {amount}
                      </span>
                      <span className="flex-1 text-sm text-muted">{desc}</span>
                      <span className="shrink-0 text-[11px] text-faint">{date}</span>
                      <span className="shrink-0 text-[11px] text-white/20">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="md:col-span-2 md:order-last">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Transparencia total
              </p>
              <h3
                className="font-bold text-fg"
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                Cada euro,
                <br />
                firmado.
                <br />
                Cada retiro,
                <br />
                trazable.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Tu wallet usa un ledger inmutable con firma SHA-256.
                Nada se borra, nada se edita. Retiros disponibles
                los días 1 al 5 de cada mes con KYC verificado.
              </p>
            </div>
          </div>

          {/* ── Beneficio 3: Herramientas profesionales ── */}
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-5">

            {/* Texto */}
            <div className="md:col-span-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Tu identidad profesional
              </p>
              <h3
                className="font-bold text-fg"
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                Un perfil
                <br />
                verificado
                <br />
                que abre puertas
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                KYC integrado, enlace referido propio y autofacturas
                generadas automáticamente. Llegas a cualquier
                conversación como un operador serio.
              </p>
            </div>

            {/* Visual: perfil + KYC + enlace */}
            <div className="md:col-span-3">
              <div
                className="overflow-hidden rounded-2xl bg-card"
                style={{
                  boxShadow:
                    "rgba(0,153,255,0.18) 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 24px 48px -8px",
                }}
              >
                {/* Perfil */}
                <div className="flex items-center gap-4 border-b border-white/6 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    MG
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-fg">Marcos García</p>
                    <p className="mt-0.5 text-xs text-muted">marcos@misanclub.com</p>
                  </div>
                  <div className="ml-auto shrink-0 rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
                    KYC ✓
                  </div>
                </div>

                {/* Enlace referido */}
                <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted text-sm">🔗</span>
                    <span className="truncate text-xs text-muted">
                      misanclub.com/register?ref=mk291…
                    </span>
                  </div>
                  <button className="ml-3 shrink-0 rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted transition-colors hover:border-accent/30 hover:text-accent">
                    Copiar
                  </button>
                </div>

                {/* Autofactura */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-sm">📄</span>
                    <span className="text-xs text-muted">
                      Autofactura_Mayo_2026.pdf
                    </span>
                  </div>
                  <button className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted transition-colors hover:border-accent/30 hover:text-accent">
                    Ver
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRECIOS ──────────────────────────────────────── */}
      <section id="precios" className="px-6 py-32">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Precios
            </p>
            <h2
              className="font-bold text-fg"
              style={{
                fontSize: "clamp(36px, 5vw, 62px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
              }}
            >
              Un precio.
              <br />
              Todo incluido.
            </h2>
          </div>

          {/* Tarjeta */}
          <div className="relative mx-auto max-w-sm">

            {/* Glow detrás de la tarjeta */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,153,255,0.08) 0%, transparent 70%)",
              }}
            />

            <div
              className="overflow-hidden rounded-2xl bg-card"
              style={{
                boxShadow:
                  "rgba(0,153,255,0.3) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 32px 64px -12px",
              }}
            >
              {/* Precio */}
              <div className="border-b border-white/6 px-8 py-8 text-center">
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Único plan
                </p>
                <div className="flex items-start justify-center gap-1">
                  <span className="mt-2 text-2xl font-bold text-muted">€</span>
                  <span
                    className="font-bold text-fg"
                    style={{
                      fontSize: "72px",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    30
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">al año · 365 días de membresía activa</p>
              </div>

              {/* Checklist */}
              <div className="space-y-3.5 px-8 py-7">
                {[
                  "Red hasta 5 niveles de profundidad",
                  "Comisiones automáticas en tiempo real",
                  "Wallet con ledger inmutable SHA-256",
                  "KYC integrado + autofacturas PDF",
                  "Enlace referido propio",
                  "Panel de control con Bento Grid",
                  "Retiro mensual — días 1 al 5",
                  "Renovación automática opcional",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Check size={11} className="text-accent" />
                    </span>
                    <span className="text-sm text-muted">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-8 pb-8">
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Activar membresía
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Fine print */}
            <p className="mt-6 text-center text-xs text-muted">
              Sin compromisos. Cancela cuando quieras.
            </p>
          </div>

        </div>
      </section>

      {/* ── CONTACTO ─────────────────────────────────────── */}
      <section id="contacto" className="px-6 py-32">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Contacto
            </p>
            <h2
              className="font-bold text-fg"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              ¿Tienes dudas?
              <br />
              Hablemos.
            </h2>
            <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted">
              Cuéntanos qué te interesa y un distribuidor de tu zona se pondrá en contacto contigo.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-2xl bg-card p-8"
            style={{
              boxShadow:
                "rgba(0,153,255,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 24px 48px -8px",
            }}
          >
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-40 text-center">

        {/* Glow central — más intenso que el resto de la página */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,153,255,0.1) 0%, transparent 65%)",
          }}
        />

        {/* Línea separadora sutil */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(0,153,255,0.2) 30%, rgba(0,153,255,0.2) 70%, transparent)",
          }}
        />

        <div className="mx-auto max-w-3xl">
          <h2
            className="font-bold text-fg"
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
            }}
          >
            ¿Sigues esperando
            <br />
            el momento perfecto?
          </h2>

          <p className="mx-auto mt-8 max-w-sm text-base leading-relaxed text-muted">
            Tu red no empieza a crecer hasta que empiezas tú.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Crear mi cuenta
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-white/10 px-8 text-sm font-medium text-fg transition-colors hover:bg-white/15"
            >
              Ya tengo cuenta →
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />

    </div>
  );
}
