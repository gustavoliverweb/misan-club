"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const shopSections = [
  {
    label: "Misan Shop",
    href: "/shop",
    description: "Todas las categorías",
    isMain: true,
  },
  {
    label: "Bienestar en Casa",
    href: "/misanshop/bienestar-en-casa",
    description: "Agua, bienestar, hogar",
    isMain: false,
  },
  {
    label: "Complementos Nutricionales",
    href: "/misanshop/complementos-nutricionales",
    description: "Suplementos Herbora y PWD Nutrition",
    isMain: false,
  },
  {
    label: "Tu Biblioteca",
    href: "/misanshop/tu-biblioteca",
    description: "Libros y desarrollo personal",
    isMain: false,
  },
  {
    label: "El Ofertón",
    href: "/misanshop/el-oferton",
    description: "Ofertas exclusivas semanales",
    isMain: false,
  },
];

const formacionGroups = [
  {
    label: "Misan Club Academy",
    href: "/formacion/misan-club-academy",
    items: [
      {
        label: "Mentes Ricas, Ingresos Reales",
        href: "/formacion/misan-club-academy/mentes-ricas-ingresos-reales",
      },
      {
        label: "Crecimiento Personal",
        href: "/formacion/misan-club-academy/crecimiento-personal",
      },
    ],
  },
  {
    label: "Tribal Training Seminars",
    href: "/formacion/tribal-training-seminars",
    items: [
      {
        label: "Renacer Sin Miedo · Presencial",
        href: "/formacion/tribal-training-seminars/renacer-sin-miedo-presencial",
      },
      {
        label: "Renacer Sin Miedo · Online",
        href: "/formacion/tribal-training-seminars/renacer-sin-miedo-online",
      },
      {
        label: "Del sofá al éxito · Parte 1",
        href: "/formacion/tribal-training-seminars/del-sofa-al-exito-parte-1",
      },
      {
        label: "Del sofá al éxito · Parte 2",
        href: "/formacion/tribal-training-seminars/del-sofa-al-exito-parte-2",
      },
    ],
  },
  {
    label: "Inteligencia Artificial",
    href: "/categoria-producto/cursos-y-formaciones/inteligencia-artificial",
    items: [],
  },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [formacionOpen, setFormacionOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.06] bg-black/80 backdrop-blur-md"
          : ""
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-fg">
          MisanClub
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {/* Formación dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setFormacionOpen(true)}
            onMouseLeave={() => setFormacionOpen(false)}
          >
            <Link
              href="/formacion"
              className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg"
            >
              Formación
              <ChevronDown
                size={12}
                className={`mt-px transition-transform duration-200 ${
                  formacionOpen ? "-rotate-180" : ""
                }`}
              />
            </Link>

            {formacionOpen && (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div className="w-72 overflow-hidden rounded-2xl border border-white/8 bg-black/95 backdrop-blur-md">
                  {formacionGroups.map((group, i) => (
                    <div key={group.href}>
                      {i > 0 && (
                        <div className="mx-3 border-t border-white/6" />
                      )}
                      <div className="p-2">
                        <Link
                          href={group.href}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-white/4 hover:text-accent"
                        >
                          {group.label}
                        </Link>
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-4 py-1.5 text-xs text-muted transition-colors hover:bg-white/4 hover:text-fg"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shop dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link
              href="/shop"
              className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg"
            >
              Shop
              <ChevronDown
                size={12}
                className={`mt-px transition-transform duration-200 ${
                  shopOpen ? "-rotate-180" : ""
                }`}
              />
            </Link>

            {shopOpen && (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div className="w-64 overflow-hidden rounded-2xl border border-white/8 bg-black/95 backdrop-blur-md">
                  <div className="p-2">
                    {shopSections.map((section, i) => (
                      <div key={section.href}>
                        {i === 1 && (
                          <div className="mx-3 my-1 border-t border-white/6" />
                        )}
                        <Link
                          href={section.href}
                          className={`block rounded-lg px-3 py-2 transition-colors hover:bg-white/4 ${
                            section.isMain
                              ? "text-sm font-medium text-fg hover:text-accent"
                              : "group"
                          }`}
                        >
                          {section.isMain ? (
                            section.label
                          ) : (
                            <>
                              <p className="text-xs font-medium text-fg group-hover:text-accent">
                                {section.label}
                              </p>
                              <p className="text-[11px] text-muted">
                                {section.description}
                              </p>
                            </>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {[
            { label: "Cómo funciona", href: "/#como-funciona" },
            { label: "Beneficios", href: "/#beneficios" },
            { label: "Precios", href: "/#precios" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-full bg-white/10 px-5 text-sm font-medium text-fg transition-colors hover:bg-white/15"
        >
          Entrar →
        </Link>
      </div>
    </header>
  );
}
