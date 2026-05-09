import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--mbg-primary)] text-white hover:bg-[var(--mbg-primary-hover)] disabled:opacity-50",
  secondary:
    "bg-white text-[var(--mbg-dark)] border border-[var(--mbg-border)] hover:bg-[var(--mbg-bg)] disabled:opacity-50",
  ghost:
    "bg-transparent text-[var(--mbg-dark)] hover:bg-[var(--mbg-bg)] disabled:opacity-50",
  dark:
    "bg-[var(--mbg-dark)] text-white hover:opacity-90 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 rounded-md",
  md: "h-10 px-4 rounded-lg",
  lg: "h-12 px-5 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
