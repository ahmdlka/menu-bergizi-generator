"use client"

import { useQuery } from "@tanstack/react-query"
import { ProductAPI } from "@/lib/api/product"
import type { Category } from "@/types/product"

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: ProductAPI.getCategories,
  })
}