"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Send, Loader2 } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = data.get("nombre") as string;
    const email = data.get("email") as string;
    const mensaje = data.get("mensaje") as string;
    if (!nombre || !email || !mensaje) return;

    startTransition(async () => {
      // Simulated submission — replace with real action when email service is set up
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        <p className="text-lg font-semibold text-fg">¡Mensaje recibido!</p>
        <p className="text-sm text-muted">
          Un distribuidor de tu zona se pondrá en contacto contigo pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-xs font-medium text-muted">
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none focus:ring-0"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none focus:ring-0"
          />
        </div>
      </div>
      <div>
        <label htmlFor="mensaje" className="mb-1.5 block text-xs font-medium text-muted">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={4}
          required
          placeholder="Cuéntanos qué te interesa..."
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none focus:ring-0"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {pending ? "Enviando…" : "Quiero más información"}
      </button>
    </form>
  );
}
