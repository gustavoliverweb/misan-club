"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

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
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-fg"
        >
          MisanClub
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Cómo funciona", href: "#como-funciona" },
            { label: "Beneficios", href: "#beneficios" },
            { label: "Precios", href: "#precios" },
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
