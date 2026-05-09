import { Zap, Sliders } from "lucide-react";
import { Card } from "./ui/Card";

interface Props {
  onPick: (mode: "FAST" | "SPECIFIC") => void;
}

export function GeneratorPicker({ onPick }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={() => onPick("FAST")} className="text-left">
        <Card className="hover:border-[var(--mbg-primary)] transition-colors cursor-pointer h-full">
          <div className="p-6 flex flex-col gap-3">
            <div className="size-10 rounded-lg bg-[var(--mbg-primary)]/10 text-[var(--mbg-primary)] flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3>Fast Generate</h3>
              <p className="text-sm text-[var(--mbg-muted)] mt-1">
                Pakai data profil kamu — meal plan siap dalam hitungan detik.
              </p>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={() => onPick("SPECIFIC")} className="text-left">
        <Card className="hover:border-[var(--mbg-primary)] transition-colors cursor-pointer h-full">
          <div className="p-6 flex flex-col gap-3">
            <div className="size-10 rounded-lg bg-[var(--mbg-dark)]/10 text-[var(--mbg-dark)] flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h3>Specific Generate</h3>
              <p className="text-sm text-[var(--mbg-muted)] mt-1">
                Form 3 langkah — atur fisik, kondisi kesehatan, preferensi & budget.
              </p>
            </div>
          </div>
        </Card>
      </button>
    </div>
  );
}
