import type { MealPlan, MealPlanData, Me, GenerateRequest, Meal, MealType } from "./api";

const env = (import.meta as any).env ?? {};
export const MOCK_ENABLED: boolean =
  env.VITE_MOCK_API === undefined ? true : env.VITE_MOCK_API !== "false";

let mockUser: Me = {
  id: "demo-user-id",
  email: "demo@mbg.app",
  name: "Demo User",
  profile: {
    age: 25,
    weight_kg: 65,
    height_cm: 170,
    gender: "Laki-laki",
    activity_level: "Moderat",
    goal: "Penurunan Berat Badan",
    allergies: ["udang"],
    diseases: [],
    food_preferences: ["tidak makan babi"],
    budget_per_day: 30000,
  },
};

let mockMealPlanCounter = 1;

interface SampleMeal {
  type: MealType;
  name: string;
  budget: number;
  cal: number; protein: number; carbs: number; fat: number;
  ingredients: { name: string; weight: number; unit: string }[];
  instructions: string[];
}

const SAMPLE_DAYS: SampleMeal[][] = [
  [
    { type: "breakfast", name: "Oatmeal + Pisang", budget: 12000, cal: 350, protein: 12, carbs: 58, fat: 6,
      ingredients: [
        { name: "Oat", weight: 60, unit: "g" },
        { name: "Pisang", weight: 100, unit: "g" },
        { name: "Susu rendah lemak", weight: 200, unit: "ml" },
      ],
      instructions: [
        "Rebus oat dengan susu rendah lemak selama 5 menit.",
        "Iris pisang dan tambahkan ke atas oatmeal.",
        "Sajikan hangat.",
      ],
    },
    { type: "lunch", name: "Nasi + Ayam Goreng + Lalapan", budget: 18000, cal: 550, protein: 35, carbs: 65, fat: 15,
      ingredients: [
        { name: "Nasi putih", weight: 150, unit: "g" },
        { name: "Dada ayam", weight: 120, unit: "g" },
        { name: "Lalapan timun & kemangi", weight: 80, unit: "g" },
      ],
      instructions: [
        "Marinasi ayam dengan bawang putih dan garam.",
        "Goreng dengan minyak sedikit hingga matang.",
        "Sajikan dengan nasi dan lalapan segar.",
      ],
    },
    { type: "dinner", name: "Nasi + Tempe Bacem + Sayur Bening", budget: 12000, cal: 480, protein: 22, carbs: 70, fat: 10,
      ingredients: [
        { name: "Nasi putih", weight: 150, unit: "g" },
        { name: "Tempe", weight: 100, unit: "g" },
        { name: "Bayam", weight: 80, unit: "g" },
      ],
      instructions: [
        "Rebus tempe dengan bumbu bacem hingga meresap.",
        "Buat sayur bening bayam dengan jagung manis.",
        "Sajikan bersama nasi.",
      ],
    },
    { type: "snack", name: "Buah Pepaya", budget: 5000, cal: 120, protein: 2, carbs: 28, fat: 1,
      ingredients: [{ name: "Pepaya", weight: 200, unit: "g" }],
      instructions: ["Potong pepaya dadu dan sajikan dingin."],
    },
  ],
  [
    { type: "breakfast", name: "Roti Gandum + Telur Rebus", budget: 10000, cal: 320, protein: 18, carbs: 40, fat: 8,
      ingredients: [
        { name: "Roti gandum", weight: 60, unit: "g" },
        { name: "Telur", weight: 100, unit: "g" },
      ],
      instructions: ["Rebus telur 8 menit.", "Sajikan dengan roti gandum panggang."],
    },
    { type: "lunch", name: "Nasi + Ikan Bakar + Tumis Kangkung", budget: 20000, cal: 560, protein: 38, carbs: 60, fat: 14,
      ingredients: [
        { name: "Nasi putih", weight: 150, unit: "g" },
        { name: "Ikan kembung", weight: 150, unit: "g" },
        { name: "Kangkung", weight: 100, unit: "g" },
      ],
      instructions: ["Bakar ikan dengan bumbu kecap.", "Tumis kangkung dengan bawang putih.", "Sajikan dengan nasi."],
    },
    { type: "dinner", name: "Nasi + Tahu Tempe + Sup Bayam", budget: 11000, cal: 470, protein: 24, carbs: 65, fat: 11,
      ingredients: [
        { name: "Nasi putih", weight: 150, unit: "g" },
        { name: "Tahu", weight: 80, unit: "g" },
        { name: "Tempe", weight: 80, unit: "g" },
        { name: "Bayam", weight: 80, unit: "g" },
      ],
      instructions: ["Goreng tahu tempe.", "Buat sup bayam dengan kaldu.", "Sajikan bersama nasi."],
    },
    { type: "snack", name: "Yogurt + Madu", budget: 8000, cal: 140, protein: 6, carbs: 22, fat: 3,
      ingredients: [{ name: "Yogurt plain", weight: 150, unit: "g" }, { name: "Madu", weight: 10, unit: "g" }],
      instructions: ["Tuang yogurt ke mangkuk.", "Beri madu di atasnya."],
    },
  ],
];

function makePlanData(days: number): MealPlanData {
  const dayList = Array.from({ length: days }, (_, i) => {
    const sample = SAMPLE_DAYS[i % SAMPLE_DAYS.length];
    const meals: Meal[] = sample.map((s) => ({
      type: s.type,
      name: s.name,
      budget_estimate: s.budget,
      nutrition_summary: { calories: s.cal, protein: s.protein, carbs: s.carbs, fat: s.fat },
      ingredients: s.ingredients,
      instructions: s.instructions,
    }));
    const totalCal = meals.reduce((a, m) => a + m.nutrition_summary.calories, 0);
    const totalProt = meals.reduce((a, m) => a + m.nutrition_summary.protein, 0);
    const totalCarb = meals.reduce((a, m) => a + m.nutrition_summary.carbs, 0);
    const totalFat = meals.reduce((a, m) => a + m.nutrition_summary.fat, 0);
    const totalBudget = meals.reduce((a, m) => a + (m.budget_estimate ?? 0), 0);
    return {
      day: i + 1,
      meals,
      daily_total_budget: totalBudget,
      daily_nutrition: {
        calories: totalCal,
        protein: totalProt,
        carbs: totalCarb,
        fat: totalFat,
      },
    };
  });

  const avg = (sel: (d: typeof dayList[number]) => number) =>
    Math.round(dayList.reduce((a, d) => a + sel(d), 0) / dayList.length);

  return {
    days: dayList,
    nutrition_summary: {
      avg_daily_calories: avg((d) => d.daily_nutrition!.calories),
      avg_protein: avg((d) => d.daily_nutrition!.protein!),
      avg_carbs: avg((d) => d.daily_nutrition!.carbs!),
      avg_fat: avg((d) => d.daily_nutrition!.fat!),
      total_estimated_budget: dayList.reduce((a, d) => a + (d.daily_total_budget ?? 0), 0),
    },
  };
}

let activeMockPlan: MealPlan | null = null;

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

const ok = <T>(data: T, message = "OK") => ({ status: "success" as const, message, data });

export const mockHandlers: Record<string, (body: any) => Promise<any>> = {
  "POST /auth/login": async () => delay(ok({ token: "mock-token" }, "Login berhasil")),
  "POST /auth/register": async () => delay(ok({ token: "mock-token" }, "Registrasi berhasil")),
  "POST /auth/logout": async () => delay(ok({}, "Logout")),

  "GET /user/me": async () => delay(ok(mockUser)),
  "PUT /user/profile": async (body) => {
    mockUser = { ...mockUser, profile: { ...mockUser.profile, ...body } };
    return delay(ok(mockUser, "Profil tersimpan"));
  },

  "GET /meal-plan": async () =>
    delay(ok(activeMockPlan ? [activeMockPlan] : [])),

  "POST /meal-plan/generate": async (body: GenerateRequest) => {
    const days = body.duration_days || 7;
    activeMockPlan = {
      meal_plan_id: `mock-mp-${mockMealPlanCounter++}`,
      mode: body.mode,
      version: 1,
      duration_days: days,
      is_active: true,
      plan: makePlanData(days),
    };
    return delay(ok(activeMockPlan, "Meal plan berhasil dibuat"), 1500);
  },

  "POST /chat": async (body: { message: string; meal_plan_id?: string | null }) => {
    if (body.meal_plan_id && activeMockPlan) {
      const updated = JSON.parse(JSON.stringify(activeMockPlan)) as MealPlan;
      updated.version += 1;
      updated.plan.days = updated.plan.days.map((d) => ({
        ...d,
        meals: d.meals.map((m) =>
          m.type === "lunch" ? { ...m, name: `${m.name} (refined)` } : m
        ),
      }));
      activeMockPlan = updated;
      return delay(
        ok(
          {
            reply: `Saya sudah menyesuaikan meal plan berdasarkan permintaan: "${body.message}".`,
            intent: "REFINE_MENU",
            updated_meal_plan: updated,
            new_version: updated.version,
          },
          "Refine berhasil"
        ),
        1200
      );
    }
    return delay(
      ok({
        reply:
          "**Kebutuhan protein harian** umumnya 0.8–1.2g per kg berat badan. Untuk profil kamu sekitar **65–80g per hari**.\n\nTips agar target tercapai:\n\n- Sertakan protein di *setiap* waktu makan utama\n- Pilih sumber protein lokal: tempe, tahu, ikan, telur\n- Konsumsi `whey` opsional untuk top-up setelah olahraga\n\nKalau tujuanmu menurunkan berat badan, jaga protein **tetap tinggi** untuk menjaga massa otot.",
        intent: "ASK_QUESTION",
      }),
      900
    );
  },
};

export async function mockFetch(method: string, path: string, body: any) {
  // Dynamic routes: /meal-plan/:id  and  /meal-plan/:id/versions
  if (method === "GET") {
    const m = path.match(/^\/meal-plan\/([^/]+)$/);
    if (m) {
      if (activeMockPlan && activeMockPlan.meal_plan_id === m[1]) {
        return delay(ok(activeMockPlan));
      }
      return delay({ status: "error", message: "Meal plan tidak ditemukan" });
    }
  }
  if (method === "DELETE") {
    const m = path.match(/^\/meal-plan\/([^/]+)$/);
    if (m) {
      if (activeMockPlan && activeMockPlan.meal_plan_id === m[1]) activeMockPlan = null;
      return delay(ok({}, "Meal plan dihapus"));
    }
  }

  const key = `${method} ${path}`;
  const handler = mockHandlers[key];
  if (!handler) {
    return { status: "error", message: `Mock handler tidak ditemukan: ${key}` };
  }
  return handler(body);
}
