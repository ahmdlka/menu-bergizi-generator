import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { Input, Field, Select } from "../ui/Input";
import type { GenerateRequest } from "../../lib/api";

interface Props {
  onBack: () => void;
  onSubmit: (req: GenerateRequest) => void | Promise<void>;
  submitting: boolean;
}

export function FastForm({ onBack, onSubmit, submitting }: Props) {
  const [durationDays, setDurationDays] = useState(1);
  const [budget, setBudget] = useState<number | "">("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      mode: "FAST",
      duration_days: durationDays,
      extra_constraints: budget ? { budget_per_day: Number(budget) } : undefined,
    });
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="size-8 rounded-md hover:bg-[var(--mbg-bg)] flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3>Fast Generate</h3>
            <p className="text-sm text-[var(--mbg-muted)]">
              Kami pakai data profil kamu untuk menyusun menu.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Field label="Durasi (hari)" hint="Pilih 1, 2, atau 3 hari">
            <Select
              value={String(durationDays)}
              onChange={(e) => setDurationDays(Number(e.target.value))}
            >
              <option value="1">1 hari</option>
              <option value="2">2 hari</option>
              <option value="3">3 hari</option>
            </Select>
          </Field>

          <Field label="Budget / hari (Rp)" hint="Opsional, override profil">
            <Input
              type="number"
              value={budget}
              onChange={(e) =>
                setBudget(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="30000"
              min={0}
            />
          </Field>

          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onBack}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Generating..." : "Generate Meal Plan"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}