"use client"

import { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`btn-primary ${className}`}
    >
      {children}
    </button>
  )
}