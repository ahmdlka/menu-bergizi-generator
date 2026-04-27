"use client"

import { useQuery } from "@tanstack/react-query"
import { ProductAPI } from "@/lib/api/product"

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: () =>
      category ? ProductAPI.getByCategory(category) : ProductAPI.getAll(),
  })
}