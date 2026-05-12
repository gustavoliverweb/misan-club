import Link from "next/link";
import { ArrowRight, BookOpen, Users, Cpu } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const pillars = [
  {
    Icon: BookOpen,
    badge: "Formación continua",
    title: "Misan Club Academy",
    description:
      "Talleres quincenales online para transformar tu relación con el dinero y potenciar tu crecimiento personal. Acceso exclusivo para socios.",
    href: "/formacion/misan-club-academy",
    items: ["Mentes Ricas, Ingresos Reales", "Crecimiento Personal"],
  },
  {
    Icon: Users,
    badge: "Experiencia intensiva",
    title: "Tribal Training Seminars",
    description:
      "Seminarios de transformación que fusionan lo presencial y lo online en un sistema de 90 días para pasar del estancamiento a la acción.",
    href: "/formacion/tribal-training-seminars",
    items: ["Renacer Sin Miedo", "Del sofá al éxito — Partes 1 y 2"],
  },
  {
    Icon: Cpu,
    badge: "Tecnología aplicada",
    title: "Inteligencia Artificial",
    description:
      "Consultoría estratégica y formaciones intensivas para automatizar procesos, crear agentes de IA y dominar el marketing de contenidos.",
    href: "/categoria-producto/cursos-y-formaciones/inteligencia-artificial",
    items: ["Consultoría estratégica", "Agentes de IA", "Automatización y chatbots"],
  },
];

export default function FormacionPage() {
  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="transition-colors hover:text-fg">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-fg">Formación</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-20 pt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,153,255,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Formación · MisanClub
              </span>
            </div>

            <h1
              className="max-w-2xl font-bold text-fg"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              Formación que
              <br />
              transforma vidas.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Tres áreas de conocimiento diseñadas para activar tu mentalidad,
              desarrollar tus ingresos y ponerte al frente del cambio
              tecnológico.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {pillars.map(({ Icon, badge, title, description, href, items }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-card transition-colors hover:border-white/[0.12]"
                  style={{ boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px" }}
                >
                  <div className="flex-1 p-6">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                      <Icon size={16} className="text-accent" />
                    </div>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                      {badge}
                    </p>
                    <h2
                      className="mb-3 text-lg font-bold text-fg"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">
                      {description}
                    </p>
                    <ul className="mt-5 space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-px w-3 shrink-0 bg-accent/50" />
                          <span className="text-xs text-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
                    <span className="text-xs text-muted">Explorar</span>
                    <ArrowRight
                      size={14}
                      className="text-accent transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}