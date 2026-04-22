"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { reviewKycSubmissionAction } from "@/app/actions/kyc-actions";
import { Button } from "@/components/ui/button";

type Props = {
  submissionId: string;
};

export function KycReviewActions({ submissionId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await reviewKycSubmissionAction({
        submissionId,
        decision: "approved",
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al aprobar.");
      }
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await reviewKycSubmissionAction({
        submissionId,
        decision: "rejected",
        rejectionReason: rejectionReason.trim() || undefined,
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al rechazar.");
      }
    });
  }

  if (showRejectForm) {
    return (
      <div className="flex flex-col gap-2 min-w-[220px]">
        <textarea
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          rows={2}
          placeholder="Motivo del rechazo (opcional)"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          disabled={isPending}
        />
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="destructive"
            onClick={reject}
            disabled={isPending}
            className="flex-1 gap-1"
          >
            {isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <X size={13} />
            )}
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectForm(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={approve}
          disabled={isPending}
          className="gap-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectForm(true)}
          disabled={isPending}
          className="gap-1 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          <X size={13} />
          Rechazar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
