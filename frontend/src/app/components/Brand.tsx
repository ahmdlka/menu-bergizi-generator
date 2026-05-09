export function Brand({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-7" : "size-9";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} rounded-lg bg-[var(--mbg-primary)] text-white flex items-center justify-center`}
      >
        M
      </div>
      <div className="leading-tight">
        <div className="text-sm" style={{ fontWeight: 600 }}>MBG</div>
        <div className="text-xs text-[var(--mbg-muted)]">Menu Bergizi Generator</div>
      </div>
    </div>
  );
}
