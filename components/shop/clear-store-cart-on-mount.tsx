"use client";

import { useEffect } from "react";
import { clearStoreCartAction } from "@/app/actions/store-cart-actions";

export function ClearStoreCartOnMount() {
  useEffect(() => {
    clearStoreCartAction();
  }, []);
  return null;
}
