import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const baseField =
  "w-full bg-white border border-[var(--mbg-border)] rounded-lg px-3 h-10 outline-none transition-colors focus:border-[var(--mbg-primary)] focus:ring-2 focus:ring-[var(--mbg-primary)]/20 placeholder:text-[var(--mbg-muted)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${baseField} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${baseField} h-auto py-2 min-h-[80px] resize-none ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select ref={ref} className={`${baseField} pr-8 ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-[var(--mbg-dark)]">{label}</label>}
      {children}
      {hint && !error && <span className="text-xs text-[var(--mbg-muted)]">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
