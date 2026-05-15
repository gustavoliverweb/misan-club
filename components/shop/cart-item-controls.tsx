"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeFromCartAction, updateCartItemQuantityAction } from "@/app/actions/cart-actions";
import { useRouter } from "next/navigation";

type Props = {
  cartItemId: string;
  initialQuantity: number;
};

export function CartItemControls({ cartItemId, initialQuantity }: Props) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleQtyChange(delta: number) {
    const next = quantity + delta;
    if (next < 1 || next > 99) return;
    setQuantity(next);
    startTransition(async () => {
      await updateCartItemQuantityAction(cartItemId, next);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeFromCartAction(cartItemId);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1">
        <button
          onClick={() => handleQtyChange(-1)}
          disabled={isPending || quantity <= 1}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums text-fg">
          {quantity}
        </span>
        <button
          onClick={() => handleQtyChange(1)}
          disabled={isPending || quantity >= 99}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          <Plus size={12} />
        </button>
      </div>

      <button
        onClick={handleRemove}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
