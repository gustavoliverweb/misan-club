import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const seminars = [
  {
    number: "01",
    badge: "Presencial",
    title: "Renacer Sin Miedo",
    subtitle: "Presencial",
    description:
      "2 días intensivos para romper con el pasado emocional, reprogramar la mente con hábitos alineados al propósito y salir con un plan de acción de 90 días.",
    href: "/formacion/tribal-training-seminars/renacer-sin-miedo-presencial",
    format: "Sábado y domingo · 10:00–16:00",
    style: "Dinámico · Emocional · Grupal",
  },
  {
    number: "02",
    badge: "Online",
    title: "Renacer Sin Miedo",
    subtitle: "Online",
    description:
      "La misma experiencia transformadora de fin de semana en formato digital. Ejercicios de impacto adaptados, dinámicas guiadas y momentos colectivos con la tribu en directo.",
    href: "/formacion/tribal-training-seminars/renacer-sin-miedo-online",
    format: "Sábado y domingo · Online en vivo",
    style: "Dinámico · Grupal · Digital",
  },
  {
    number: "03",
    badge: "45 días",
    title: "Del sofá al éxito",
    subtitle: "Parte 1",
    description:
      "Renace en 90 días — primera mitad. Activa tu propósito, instala rutinas conscientes, equilibra áreas con la Rueda de la Vida y aprende a decir NO.",
    href: "/formacion/tribal-training-seminars/del-sofa-al-exito-parte-1",
    format: "45 días · Trabajo diario · Recomendado por la mañana",
    style: "Propósito · Rutinas · Enfoque",
  },
  {
    number: "04",
    badge: "45 días",
    title: "Del sofá al éxito",
    subtitle: "Parte 2",
    description:
      "Renace en 90 días — segunda mitad. Perdón y liberación emocional, programación mental, productividad consciente y liderazgo transformacional.",
    href: "/formacion/tribal-training-seminars/del-sofa-al-exito-parte-2",
    format: "45 días · Trabajo diario",
    style: "Liderazgo · Productividad · Mente",
  },
];

export default function TribalTrainingPage() {
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
            <Link href="/formacion" className="transition-colors hover:text-fg">
              Formación
            </Link>
            <span>/</span>
            <span className="text-fg">Tribal Training Seminars</span>
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
                Experiencia intensiva · 90 días
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
              Tribal Training
              <br />
              Seminars
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Un viaje de crecimiento personal que fusiona lo presencial con lo
              online. Sistema de transformación de 90 días para pasar del
              estancamiento a la claridad y de la excusa a la acción.
            </p>
          </div>
        </section>

        {/* Seminars list */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Seminarios
            </p>
            <div className="space-y-4">
              {seminars.map(({ number, badge, title, subtitle, description, href, format, style: styleTag }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-start gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-card p-7 transition-colors hover:border-white/[0.12]"
                  style={{ boxShadow: "rgba(0,0,0,0.4) 0px 16px 40px -8px" }}
                >
                  {/* Number */}
                  <span
                    aria-hidden
                    className="hidden shrink-0 select-none font-bold leading-none text-white/[0.06] sm:block"
                    style={{ fontSize: "56px", letterSpacing: "-0.04em", marginTop: "-4px" }}
                  >
                    {number}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-3 flex-wrap">
                      <span className="rounded-full border border-white/[0.07] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-accent">
                        {badge}
                      </span>
                      <span className="text-xs text-muted">{format}</span>
                    </div>
                    <h2
                      className="mb-1 text-xl font-bold text-fg"
                      style={{ letterSpacing: "-0.025em" }}
                    >
                      {title}{" "}
                      <span className="text-muted font-normal">— {subtitle}</span>
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {description}
                    </p>
                    <p className="mt-3 text-[11px] text-muted/70">{styleTag}</p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-accent transition-transform group-hover:translate-x-0.5"
                  />
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