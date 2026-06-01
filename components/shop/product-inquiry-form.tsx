"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Send, Loader2, MessageSquare } from "lucide-react";
import { submitProductInquiryAction } from "@/app/actions/contact-actions";

type Props = {
  productId: string;
  productName: string;
};

export function ProductInquiryForm({ productId, productName }: Props) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const nombre = fd.get("nombre") as string;
    const email = fd.get("email") as string;
    const mensaje = fd.get("mensaje") as string;

    startTransition(async () => {
      const res = await submitProductInquiryAction({ productId, productName, nombre, email, mensaje });
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle size={22} className="text-green-400" />
        </div>
        <p className="font-semibold text-fg">¡Solicitud enviada!</p>
        <p className="text-sm text-muted">
          Un distribuidor se pondrá en contacto contigo a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare size={15} className="text-accent" />
        <p className="text-sm font-semibold text-fg">Obtener información del proveedor</p>
      </div>
      <p className="mb-4 text-xs text-muted">
        Sobre: <span className="font-medium text-fg">{productName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="inq-nombre" className="mb-1 block text-xs font-medium text-muted">
            Nombre completo
          </label>
          <input
            id="inq-nombre"
            name="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="inq-email" className="mb-1 block text-xs font-medium text-muted">
            Correo electrónico
          </label>
          <input
            id="inq-email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="inq-mensaje" className="mb-1 block text-xs font-medium text-muted">
            Mensaje
          </label>
          <textarea
            id="inq-mensaje"
            name="mensaje"
            rows={3}
            required
            placeholder="¿Qué te interesa saber sobre este producto?"
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent/40 focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {pending ? "Enviando…" : "Solicitar información"}
        </button>
      </form>
    </div>
  );
}
