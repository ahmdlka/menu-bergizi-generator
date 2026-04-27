"use client"

import { useQuery } from "@tanstack/react-query"
import { ProductAPI } from "@/lib/api/product"

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => ProductAPI.getById(id),
  })
}