import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Field, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { userApi, type Me, type UserProfile } from "../lib/api";

const csv = (a?: string[]) => (a ?? []).join(", ");
const fromCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        </CardHeader>
        <form onSubmit={save}>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Usia">
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : "")}
              />
            </Field>
            <Field label="Jenis kelamin">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </Select>
            </Field>
            <Field label="Berat (kg)">
              <Input
                type="number"
                value={form.weight_kg}
                onChange={(e) =>
                  set("weight_kg", e.target.value ? Number(e.target.value) : "")
                }
              />
            </Field>
            <Field label="Tinggi (cm)">
              <Input
                type="number"
                value={form.height_cm}
                onChange={(e) =>
                  set("height_cm", e.target.value ? Number(e.target.value) : "")
                }
              />
            </Field>
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
            <Field label="Tujuan">
              <Select value={form.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="Penurunan Berat Badan">Penurunan Berat Badan</option>
                <option value="Pemeliharaan">Pemeliharaan</option>
                <option value="Peningkatan Massa Otot">Peningkatan Massa Otot</option>
              </Select>
            </Field>
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
            <Field label="Kondisi kesehatan" hint="Pisahkan dengan koma">
              <Input
                value={form.diseases}
                onChange={(e) => set("diseases", e.target.value)}
                placeholder="diabetes"
              />
            </Field>
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

            {error && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {savedAt && !error && (
              <div className="col-span-2 text-sm text-[var(--mbg-primary)] bg-[var(--mbg-primary)]/10 rounded-md px-3 py-2">
                Profil tersimpan.
              </div>
            )}

            <div className="col-span-2 flex justify-end">
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
