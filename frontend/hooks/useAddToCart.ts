"use client"

import { useMutation } from "@tanstack/react-query"
import { CartAPI } from "@/lib/api/cart"

export function useAddToCart() {
  return useMutation({
    mutationFn: CartAPI.add,
  })
}