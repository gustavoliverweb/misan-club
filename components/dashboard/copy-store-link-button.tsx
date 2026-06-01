"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

type Props = { userId: string };

export function CopyStoreLinkButton({ userId }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}/tienda/${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-subtle px-3 py-2">
        <span className="flex-1 truncate font-mono text-[10px] text-muted">
          /tienda/{userId.slice(0, 8)}…
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <a
          href={`/tienda/${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-subtle px-3 py-2 text-xs text-muted transition-colors hover:text-fg"
        >
          <ExternalLink size={11} />
          Ver
        </a>
      </div>
    </div>
  );
}
