"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartItemCountAction } from "@/app/actions/cart-actions";

export function CartNavCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getCartItemCountAction().then(setCount).catch(() => {});

    function handleCartUpdated() {
      getCartItemCountAction().then(setCount).catch(() => {});
    }
    window.addEventListener("cart:updated", handleCartUpdated);
    return () => window.removeEventListener("cart:updated", handleCartUpdated);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-fg transition-colors hover:bg-white/15"
    >
      <ShoppingCart size={15} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
