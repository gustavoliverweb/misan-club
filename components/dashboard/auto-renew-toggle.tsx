"use client";

import { useActionState } from "react";
import { toggleAutoRenewAction } from "@/app/actions/membership-actions";

interface AutoRenewToggleProps {
  initialValue: boolean;
}

export function AutoRenewToggle({ initialValue }: AutoRenewToggleProps) {
  const [state, dispatch, isPending] = useActionState(
    toggleAutoRenewAction,
    undefined,
  );

  const current = state?.autoRenew ?? initialValue;

  return (
    <form action={dispatch}>
      <button
        type="submit"
        disabled={isPending}
        role="switch"
        aria-checked={current}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 ${
          current ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            current ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </form>
  );
}
