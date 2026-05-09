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

interface FormState {
  age: number | "";
  weight_kg: number | "";
  height_cm: number | "";
  gender: string;
  activity_level: string;
  goal: string;
  allergies: string;
  diseases: string;
  food_preferences: string;
  exclude_ingredients: string;
  budget_per_day: number | "";
  duration_days: number;
  prefer_local_food: boolean;
}

const initial: FormState = {
  age: "",
  weight_kg: "",
  height_cm: "",
  gender: "",
  activity_level: "Moderat",
  goal: "Pemeliharaan",
  allergies: "",
  diseases: "",
  food_preferences: "",
  exclude_ingredients: "",
  budget_per_day: "",
  duration_days: 7,
  prefer_local_food: true,
};

const STEPS = ["Data Fisik", "Kesehatan & Alergi", "Preferensi & Budget"];

function csvToArray(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export function SpecificForm({ onBack, onSubmit, submitting }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prev() {
    if (step === 0) onBack();
    else setStep(step - 1);
  }

  function submit() {
    onSubmit({
      mode: "SPECIFIC",
      duration_days: data.duration_days,
      extra_constraints: {
        age: data.age === "" ? undefined : Number(data.age),
        weight_kg: data.weight_kg === "" ? undefined : Number(data.weight_kg),
        height_cm: data.height_cm === "" ? undefined : Number(data.height_cm),
        gender: data.gender || undefined,
        activity_level: data.activity_level,
        goal: data.goal,
        allergies: csvToArray(data.allergies),
        diseases: csvToArray(data.diseases),
        food_preferences: csvToArray(data.food_preferences),
        exclude_ingredients: csvToArray(data.exclude_ingredients),
        budget_per_day:
          data.budget_per_day === "" ? undefined : Number(data.budget_per_day),
        prefer_local_food: data.prefer_local_food,
      },
    });
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="size-8 rounded-md hover:bg-[var(--mbg-bg)] flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h3>Specific Generate</h3>
            <p className="text-sm text-[var(--mbg-muted)]">
              Step {step + 1} / {STEPS.length} — {STEPS[step]}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[var(--mbg-primary)]" : "bg-[var(--mbg-bg)]"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Usia">
              <Input
                type="number"
                value={data.age}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : "")}
                placeholder="25"
              />
            </Field>
            <Field label="Jenis kelamin">
              <Select value={data.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </Select>
            </Field>
            <Field label="Berat (kg)">
              <Input
                type="number"
                value={data.weight_kg}
                onChange={(e) =>
                  set("weight_kg", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="65"
              />
            </Field>
            <Field label="Tinggi (cm)">
              <Input
                type="number"
                value={data.height_cm}
                onChange={(e) =>
                  set("height_cm", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="170"
              />
            </Field>
            <Field label="Tingkat aktivitas">
              <Select
                value={data.activity_level}
                onChange={(e) => set("activity_level", e.target.value)}
              >
                <option value="Sedenter">Sedenter</option>
                <option value="Ringan">Ringan</option>
                <option value="Moderat">Moderat</option>
                <option value="Aktif">Aktif</option>
                <option value="Sangat Aktif">Sangat Aktif</option>
              </Select>
            </Field>
            <Field label="Tujuan">
              <Select value={data.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="Penurunan Berat Badan">Penurunan Berat Badan</option>
                <option value="Pemeliharaan">Pemeliharaan</option>
                <option value="Peningkatan Massa Otot">Peningkatan Massa Otot</option>
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Alergi" hint="Pisahkan dengan koma. Contoh: gluten, kacang">
              <Input
                value={data.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                placeholder="gluten, kacang"
              />
            </Field>
            <Field label="Kondisi kesehatan / penyakit" hint="Pisahkan dengan koma">
              <Input
                value={data.diseases}
                onChange={(e) => set("diseases", e.target.value)}
                placeholder="diabetes, hipertensi"
              />
            </Field>
            <Field
              label="Bahan yang dihindari"
              hint="Pisahkan dengan koma. Contoh: udang, daging babi"
            >
              <Input
                value={data.exclude_ingredients}
                onChange={(e) => set("exclude_ingredients", e.target.value)}
                placeholder="udang, jeroan"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Preferensi makanan"
              hint="Pisahkan dengan koma"
            >
              <Input
                value={data.food_preferences}
                onChange={(e) => set("food_preferences", e.target.value)}
                placeholder="vegetarian, no_seafood"
              />
            </Field>
            <Field label="Budget / hari (Rp)">
              <Input
                type="number"
                value={data.budget_per_day}
                onChange={(e) =>
                  set("budget_per_day", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="30000"
              />
            </Field>
            <Field label="Durasi (hari)" hint="1–30 hari">
              <Input
                type="number"
                min={1}
                max={30}
                value={data.duration_days}
                onChange={(e) =>
                  set("duration_days", Math.min(30, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </Field>
            <Field label="Prioritaskan makanan lokal">
              <label className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={data.prefer_local_food}
                  onChange={(e) => set("prefer_local_food", e.target.checked)}
                  className="size-4 accent-[var(--mbg-primary)]"
                />
                <span className="text-sm text-[var(--mbg-muted)]">
                  Ya, utamakan menu lokal Indonesia
                </span>
              </label>
            </Field>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={prev}>
            {step === 0 ? "Batal" : "Kembali"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Lanjut</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Generating..." : "Generate Meal Plan"}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
