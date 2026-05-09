import { API_URL } from "./env";
import { auth } from "./auth";
import { MOCK_ENABLED, mockFetch } from "./mock";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Standard envelope:
//   success → { status: "success", message, data }
//   error   → { status: "error",   message }
interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body as string) : undefined;

  let envelope: Envelope<T>;
  let httpStatus = 200;

  if (MOCK_ENABLED) {
    envelope = (await mockFetch(method, path, body)) as Envelope<T>;
  } else {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) || {}),
    };
    const token = auth.token;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    httpStatus = res.status;
    const text = await res.text();
    envelope = (text ? JSON.parse(text) : {}) as Envelope<T>;
  }

  if (envelope.status !== "success") {
    throw new ApiError(envelope.message || `Request failed (${httpStatus})`, httpStatus);
  }
  return envelope.data as T;
}

// --- Auth ---

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    apiFetch<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
};

// --- User ---

export interface UserProfile {
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  gender?: string;            // "Laki-laki" | "Perempuan"
  activity_level?: string;    // "Sedenter" | "Ringan" | "Moderat" | "Aktif" | "Sangat Aktif"
  goal?: string;              // "Penurunan Berat Badan" | "Pemeliharaan" | "Peningkatan Massa Otot"
  allergies?: string[];
  diseases?: string[];
  food_preferences?: string[];
  budget_per_day?: number;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  profile?: UserProfile;
}

export const userApi = {
  me: () => apiFetch<Me>("/user/me"),
  updateProfile: (profile: UserProfile) =>
    apiFetch<Me>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
};

// --- Meal Plan ---

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  weight?: number;
  unit?: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | string;

export interface Meal {
  type: MealType;
  name: string;
  budget_estimate?: number;
  nutrition_summary: NutritionSummary;
  ingredients?: Ingredient[];
  instructions?: string[];
}

export interface DailyNutrition {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealDay {
  day: number;
  meals: Meal[];
  daily_total_budget?: number;
  daily_nutrition?: DailyNutrition;
}

export interface MealPlanData {
  days: MealDay[];
  nutrition_summary: {
    avg_daily_calories: number;
    avg_protein?: number;
    avg_carbs?: number;
    avg_fat?: number;
    total_estimated_budget?: number;
  };
}

export interface MealPlan {
  meal_plan_id: string;
  mode: "FAST" | "SPECIFIC";
  version: number;
  duration_days: number;
  is_active: boolean;
  plan: MealPlanData;
}

export interface GenerateRequest {
  mode: "FAST" | "SPECIFIC";
  duration_days: number;
  extra_constraints?: {
    budget_per_day?: number;
    exclude_ingredients?: string[];
    prefer_local_food?: boolean;
    age?: number;
    weight_kg?: number;
    height_cm?: number;
    gender?: string;
    activity_level?: string;
    goal?: string;
    allergies?: string[];
    diseases?: string[];
    food_preferences?: string[];
  };
}

export const mealPlanApi = {
  generate: (body: GenerateRequest) =>
    apiFetch<MealPlan>("/meal-plan/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  list: () => apiFetch<MealPlan[]>("/meal-plan"),
  get: (id: string) => apiFetch<MealPlan>(`/meal-plan/${id}`),
  remove: (id: string) => apiFetch(`/meal-plan/${id}`, { method: "DELETE" }),
};

// --- Chat ---

export type ChatIntent = "REFINE_MENU" | "ASK_QUESTION";

export interface ChatResponse {
  reply: string;
  intent: ChatIntent;
  updated_meal_plan?: MealPlan;
  new_version?: number;
}

export const chatApi = {
  send: (message: string, meal_plan_id?: string | null) =>
    apiFetch<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, meal_plan_id: meal_plan_id ?? null }),
    }),
};
