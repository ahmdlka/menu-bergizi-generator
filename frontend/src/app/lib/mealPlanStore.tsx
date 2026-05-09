import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mealPlanApi, type MealPlan } from "./api";
import { auth } from "./auth";

interface MealPlanCtx {
  mealPlan: MealPlan | null;
  setMealPlan: (mp: MealPlan | null) => void;
  hydrating: boolean;
}

const Ctx = createContext<MealPlanCtx | null>(null);

function pickActive(list: MealPlan[]): MealPlan | null {
  if (!list.length) return null;
  return list.find((m) => m.is_active) ?? list[0];
}

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [hydrating, setHydrating] = useState(true);

  // On mount: fetch list, pick the active meal plan
  useEffect(() => {
    if (!auth.isAuthed()) {
      setHydrating(false);
      return;
    }
    let alive = true;
    mealPlanApi
      .list()
      .then((list) => {
        if (alive) setMealPlan(pickActive(list));
      })
      .catch(() => {
        // ignore — user can still generate a new one
      })
      .finally(() => {
        if (alive) setHydrating(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Ctx.Provider value={{ mealPlan, setMealPlan, hydrating }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMealPlan must be used inside MealPlanProvider");
  return ctx;
}
