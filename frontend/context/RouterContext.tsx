"use client"

import { createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import type { useRouter as useRouterType } from "next/navigation"

type AppRouterInstance = ReturnType<typeof useRouterType>

const RouterContext = createContext<AppRouterInstance | null>(null)

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <RouterContext.Provider value={router}>
      {children}
    </RouterContext.Provider>
  )
}

export function useAppRouter() {
  return useContext(RouterContext)
}