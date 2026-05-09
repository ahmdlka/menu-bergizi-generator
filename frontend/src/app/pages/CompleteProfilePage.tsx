import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Input, Field, Select } from "../components/ui/Input";
import { Brand } from "../components/Brand";
import { userApi, UserProfile } from "../lib/api";
import { toast } from "sonner";

type ProfileFormValues = {
  age: string;
  weight_kg: string;
  height_cm: string;
  gender: string;
  activity_level: string;
  goal: string;
  allergies: string;
  diseases: string;
  food_preferences: string;
  budget_per_day: string;
};

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      activity_level: "Moderat",
      goal: "Pemeliharaan",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const profile: UserProfile = {
        age: Number(values.age),
        weight_kg: Number(values.weight_kg),
        height_cm: Number(values.height_cm),
        gender: values.gender,
        activity_level: values.activity_level,
        goal: values.goal,
        budget_per_day: values.budget_per_day ? Number(values.budget_per_day) : undefined,
        allergies: values.allergies ? values.allergies.split(",").map((s) => s.trim()) : [],
        diseases: values.diseases ? values.diseases.split(",").map((s) => s.trim()) : [],
        food_preferences: values.food_preferences ? values.food_preferences.split(",").map((s) => s.trim()) : [],
      };
      await userApi.updateProfile(profile);
      toast.success("Profil berhasil dilengkapi!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mbg-bg)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex justify-center">
          <Brand />
        </div>

        <Card>
          <CardBody className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-[var(--mbg-dark)]">Lengkapi Profil Kamu</h2>
              <p className="text-sm text-[var(--mbg-muted)]">
                Bantu kami mengenal kamu lebih baik untuk membuat meal plan yang paling sesuai.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field 
                  label="Usia *" 
                  error={errors.age?.message}
                >
                  <Input
                    type="number"
                    placeholder="Contoh: 25"
                    {...register("age", { 
                      required: "Usia wajib diisi",
                      min: { value: 1, message: "Usia minimal 1 tahun" }
                    })}
                  />
                </Field>

                <Field 
                  label="Jenis Kelamin *" 
                  error={errors.gender?.message}
                >
                  <Select 
                    {...register("gender", { required: "Jenis kelamin wajib dipilih" })}
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </Select>
                </Field>

                <Field 
                  label="Berat Badan (kg) *" 
                  error={errors.weight_kg?.message}
                >
                  <Input
                    type="number"
                    placeholder="Contoh: 65"
                    {...register("weight_kg", { 
                      required: "Berat badan wajib diisi",
                      min: { value: 1, message: "Berat badan minimal 1 kg" }
                    })}
                  />
                </Field>

                <Field 
                  label="Tinggi Badan (cm) *" 
                  error={errors.height_cm?.message}
                >
                  <Input
                    type="number"
                    placeholder="Contoh: 170"
                    {...register("height_cm", { 
                      required: "Tinggi badan wajib diisi",
                      min: { value: 1, message: "Tinggi badan minimal 1 cm" }
                    })}
                  />
                </Field>

                <Field 
                  label="Tingkat Aktivitas *" 
                  error={errors.activity_level?.message}
                >
                  <Select 
                    {...register("activity_level", { required: "Tingkat aktivitas wajib dipilih" })}
                  >
                    <option value="Sedenter">Sedenter (Banyak duduk)</option>
                    <option value="Ringan">Ringan (Olahraga 1-3 hari/minggu)</option>
                    <option value="Moderat">Moderat (Olahraga 3-5 hari/minggu)</option>
                    <option value="Aktif">Aktif (Olahraga 6-7 hari/minggu)</option>
                    <option value="Sangat Aktif">Sangat Aktif (Fisik berat/Atlet)</option>
                  </Select>
                </Field>

                <Field 
                  label="Tujuan *" 
                  error={errors.goal?.message}
                >
                  <Select 
                    {...register("goal", { required: "Tujuan wajib dipilih" })}
                  >
                    <option value="Penurunan Berat Badan">Penurunan Berat Badan</option>
                    <option value="Pemeliharaan">Pemeliharaan Berat Badan</option>
                    <option value="Peningkatan Massa Otot">Peningkatan Massa Otot</option>
                  </Select>
                </Field>
              </div>

              <hr className="border-[var(--mbg-bg)]" />

              <div className="flex flex-col gap-4">
                <Field 
                  label="Alergi" 
                  hint="Pisahkan dengan koma. Contoh: kacang, seafood"
                >
                  <Input
                    placeholder="Tidak ada"
                    {...register("allergies")}
                  />
                </Field>

                <Field 
                  label="Kondisi Kesehatan / Penyakit" 
                  hint="Pisahkan dengan koma. Contoh: diabetes, hipertensi"
                >
                  <Input
                    placeholder="Tidak ada"
                    {...register("diseases")}
                  />
                </Field>

                <Field 
                  label="Preferensi Makanan" 
                  hint="Pisahkan dengan koma. Contoh: vegetarian, rendah karbo"
                >
                  <Input
                    placeholder="Contoh: vegetarian"
                    {...register("food_preferences")}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </Button>
                <p className="text-center text-xs text-[var(--mbg-muted)]">
                  * Menandakan kolom wajib diisi
                </p>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
