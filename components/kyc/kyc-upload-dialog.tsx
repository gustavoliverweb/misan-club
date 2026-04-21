"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Upload, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitKycDocumentAction } from "@/app/actions/kyc-actions";

const DOCUMENT_TYPES = [
  { value: "dni_front", label: "DNI — Frente" },
  { value: "dni_back", label: "DNI — Dorso" },
  { value: "passport", label: "Pasaporte" },
  { value: "selfie", label: "Selfie con documento" },
] as const;

interface KycUploadDialogProps {
  kycStatus: "pending" | "verified" | "rejected";
}

export function KycUploadDialog({ kycStatus }: KycUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitKycDocumentAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state?.success]);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    if (!pending) setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        className="shrink-0 bg-amber-500 hover:bg-amber-600"
        onClick={handleOpen}
      >
        <AlertCircle size={15} />
        {kycStatus === "rejected" ? "Volver a enviar" : "Subir Documentación"}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="kyc-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                Verificación de Identidad
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {kycStatus === "rejected" && !state?.success && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Tu documentación anterior fue rechazada. Por favor, sube
                documentos válidos y legibles.
              </div>
            )}

            {state?.success ? (
              <div className="py-8 text-center">
                <CheckCircle2
                  size={40}
                  className="mx-auto mb-3 text-green-500"
                />
                <p className="font-medium text-green-700">
                  ¡Documentos enviados correctamente!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  El equipo revisará tu solicitud en 24–48 horas.
                </p>
              </div>
            ) : (
              <form ref={formRef} action={formAction} className="space-y-4">
                <div>
                  <label
                    htmlFor="kyc-doc-type"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Tipo de documento
                  </label>
                  <select
                    id="kyc-doc-type"
                    name="documentType"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Selecciona un tipo...</option>
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="kyc-document"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Archivo{" "}
                    <span className="font-normal text-gray-400">
                      (JPG, PNG, WEBP o PDF · máx. 10 MB)
                    </span>
                  </label>
                  <input
                    id="kyc-document"
                    name="document"
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs file:font-medium"
                  />
                </div>

                {state?.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {state.error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full"
                >
                  <Upload size={15} />
                  {pending ? "Subiendo..." : "Enviar documentación"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
