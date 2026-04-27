"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CartProvider } from "@/context/CartContext"
import { ToastProvider } from "@/context/ToastContext"
import { RouterProvider } from "@/context/RouterContext"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CartProvider>
          <RouterProvider>{children}</RouterProvider>
        </CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}