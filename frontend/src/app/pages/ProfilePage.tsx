import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Field, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { userApi, type Me, type UserProfile } from "../lib/api";

const csv = (a?: string[]) => (a ?? []).join(", ");
const fromCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

// Required field keys
const REQUIRED_FIELDS: (keyof typeof REQUIRED_LABELS)[] = [
  "age",
  "gender",
  "weight_kg",
  "height_cm",
];

const REQUIRED_LABELS = {
  age: "Usia",
  gender: "Jenis kelamin",
  weight_kg: "Berat badan",
  height_cm: "Tinggi badan",
} as const;

export function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    userApi
      .me()
      .then((data) => {
        if (!alive) return;
        setMe(data);
        const p = data.profile ?? {};
        setForm({
          age: p.age ?? "",
          weight_kg: p.weight_kg ?? "",
          height_cm: p.height_cm ?? "",
          gender: p.gender ?? "",
          activity_level: p.activity_level ?? "Moderat",
          goal: p.goal ?? "Pemeliharaan",
          allergies: csv(p.allergies),
          diseases: csv(p.diseases),
          food_preferences: csv(p.food_preferences),
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function set<K extends string>(key: K, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
    // Clear field error on change
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.age || Number(form.age) <= 0) {
      newErrors.age = "Usia wajib diisi";
    }
    if (!form.gender) {
      newErrors.gender = "Jenis kelamin wajib dipilih";
    }
    if (!form.weight_kg || Number(form.weight_kg) <= 0) {
      newErrors.weight_kg = "Berat badan wajib diisi";
    }
    if (!form.height_cm || Number(form.height_cm) <= 0) {
      newErrors.height_cm = "Tinggi badan wajib diisi";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedAt(null);

    if (!validate()) return;

    setSaving(true);
    try {
      const payload: UserProfile = {
        age: form.age === "" ? undefined : Number(form.age),
        weight_kg: form.weight_kg === "" ? undefined : Number(form.weight_kg),
        height_cm: form.height_cm === "" ? undefined : Number(form.height_cm),
        gender: form.gender || undefined,
        activity_level: form.activity_level,
        goal: form.goal,
        allergies: fromCsv(form.allergies),
        diseases: fromCsv(form.diseases),
        food_preferences: fromCsv(form.food_preferences),
      };
      await userApi.updateProfile(payload);
      setSavedAt(Date.now());
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--mbg-muted)]">Memuat profil...</p>
        </CardBody>
      </Card>
    );
  }

  // Check if any required field is still empty (for banner display)
  const hasEmptyRequired =
    !form.age || !form.gender || !form.weight_kg || !form.height_cm;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h2>Profil Akun</h2>
          <p className="text-sm text-[var(--mbg-muted)] mt-1">
            Data ini dipakai sebagai default saat generate meal plan.
          </p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <Field label="Nama">
            <Input value={me?.name ?? ""} disabled />
          </Field>
          <Field label="Email">
            <Input value={me?.email ?? ""} disabled />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3>Edit Profil Gizi</h3>
          <p className="text-xs text-[var(--mbg-muted)] mt-1">
            Kolom bertanda <span className="text-red-500 font-medium">*</span> wajib diisi sebelum menyimpan.
          </p>
        </CardHeader>

        {/* Required fields reminder banner */}
        {hasEmptyRequired && (
          <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
            <p className="text-xs text-amber-700">
              Kolom <strong>Usia</strong>, <strong>Jenis Kelamin</strong>,{" "}
              <strong>Berat</strong>, dan <strong>Tinggi</strong> wajib diisi
              agar meal plan bisa disesuaikan dengan kebutuhan gizi kamu.
            </p>
          </div>
        )}

        <form onSubmit={save}>
          <CardBody className="grid grid-cols-2 gap-4">
            {/* Usia */}
            <Field
              label="Usia *"
              error={fieldErrors.age}
            >
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : "")}
                placeholder="Contoh: 25"
                min={1}
                className={fieldErrors.age ? "border-red-400 focus:border-red-400" : ""}
              />
            </Field>

            {/* Jenis Kelamin */}
            <Field label="Jenis kelamin *" error={fieldErrors.gender}>
              <Select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={fieldErrors.gender ? "border-red-400 focus:border-red-400" : ""}
              >
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </Select>
            </Field>

            {/* Berat */}
            <Field label="Berat (kg) *" error={fieldErrors.weight_kg}>
              <Input
                type="number"
                value={form.weight_kg}
                onChange={(e) =>
                  set("weight_kg", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Contoh: 65"
                min={1}
                className={fieldErrors.weight_kg ? "border-red-400 focus:border-red-400" : ""}
              />
            </Field>

            {/* Tinggi */}
            <Field label="Tinggi (cm) *" error={fieldErrors.height_cm}>
              <Input
                type="number"
                value={form.height_cm}
                onChange={(e) =>
                  set("height_cm", e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Contoh: 170"
                min={1}
                className={fieldErrors.height_cm ? "border-red-400 focus:border-red-400" : ""}
              />
            </Field>

            {/* Tingkat Aktivitas */}
            <Field label="Tingkat aktivitas">
              <Select
                value={form.activity_level}
                onChange={(e) => set("activity_level", e.target.value)}
              >
                <option value="Sedenter">Sedenter</option>
                <option value="Ringan">Ringan</option>
                <option value="Moderat">Moderat</option>
                <option value="Aktif">Aktif</option>
                <option value="Sangat Aktif">Sangat Aktif</option>
              </Select>
            </Field>

            {/* Tujuan */}
            <Field label="Tujuan">
              <Select value={form.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="Penurunan Berat Badan">Penurunan Berat Badan</option>
                <option value="Pemeliharaan">Pemeliharaan</option>
                <option value="Peningkatan Massa Otot">Peningkatan Massa Otot</option>
              </Select>
            </Field>

            {/* Alergi */}
            <Field
              label="Alergi"
              hint="Pisahkan dengan koma"
            >
              <Input
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                placeholder="gluten, kacang"
              />
            </Field>

            {/* Kondisi Kesehatan */}
            <Field label="Kondisi kesehatan" hint="Pisahkan dengan koma">
              <Input
                value={form.diseases}
                onChange={(e) => set("diseases", e.target.value)}
                placeholder="diabetes"
              />
            </Field>

            {/* Preferensi */}
            <Field
              label="Preferensi makanan"
              hint="Pisahkan dengan koma"
            >
              <Input
                value={form.food_preferences}
                onChange={(e) => set("food_preferences", e.target.value)}
                placeholder="vegetarian, tidak makan babi"
              />
            </Field>

            {/* Error & Success messages */}
            {error && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {savedAt && !error && (
              <div className="col-span-2 text-sm text-[var(--mbg-primary)] bg-[var(--mbg-primary)]/10 rounded-md px-3 py-2">
                ✓ Profil berhasil tersimpan.
              </div>
            )}

            {/* Validation summary if fields are missing */}
            {Object.keys(fieldErrors).length > 0 && (
              <div className="col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-sm font-medium text-red-600 mb-1">
                  Kolom wajib berikut belum diisi:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {Object.entries(fieldErrors).map(([key, msg]) => (
                    <li key={key} className="text-xs text-red-500">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="col-span-2 flex items-center justify-between">
              <p className="text-xs text-[var(--mbg-muted)]">
                <span className="text-red-500">*</span> Wajib diisi
              </p>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan profil"}
              </Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}