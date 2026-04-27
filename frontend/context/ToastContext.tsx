"use client"

import { createContext, useContext } from "react"

const ToastContext = createContext({
  show: (msg: string) => alert(msg),
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = (msg: string) => alert(msg)

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}