import { useEffect, useState } from "react";
import { Coffee, UtensilsCrossed, Moon, Apple, Flame, X, Wallet } from "lucide-react";
import { Card, CardBody } from "./ui/Card";
import type { MealPlan, Meal } from "../lib/api";

const TYPE_META: Record<string, { label: string; icon: any }> = {
  breakfast: { label: "Sarapan", icon: Coffee },
  lunch: { label: "Makan Siang", icon: UtensilsCrossed },
  dinner: { label: "Makan Malam", icon: Moon },
  snack: { label: "Snack", icon: Apple },
};

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      icon: UtensilsCrossed,
    }
  );
}

const fmtRp = (n?: number) =>
  n == null ? "-" : `Rp${n.toLocaleString("id-ID")}`;

interface Props {
  mealPlan: MealPlan;
}

export function MealPlanView({ mealPlan }: Props) {
  const [activeDay, setActiveDay] = useState(1);
  const [openMeal, setOpenMeal] = useState<Meal | null>(null);

  useEffect(() => {
    setActiveDay(1);
  }, [mealPlan.meal_plan_id]);

  if (!mealPlan.plan) {
    return null;
  }

  const day =
    mealPlan.plan.days.find((d) => d.day === activeDay) ?? mealPlan.plan.days[0];
  const summary = mealPlan.plan.nutrition_summary;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2>Meal Plan Kamu</h2>
        <p className="text-sm text-[var(--mbg-muted)] mt-0.5">
          Mode {mealPlan.mode} · v{mealPlan.version} · {mealPlan.duration_days} hari
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {mealPlan.plan.days.map((d) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(d.day)}
            className={`px-4 h-9 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeDay === d.day
                ? "bg-[var(--mbg-dark)] text-white"
                : "bg-white border border-[var(--mbg-border)] text-[var(--mbg-dark)] hover:border-[var(--mbg-primary)]"
            }`}
          >
            Hari {d.day}
          </button>
        ))}
      </div>

      {/* Meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {day.meals.map((m, i) => {
          const meta = metaFor(m.type);
          const Icon = meta.icon;
          return (
            <button key={`${m.type}-${i}`} onClick={() => setOpenMeal(m)} className="text-left">
              <Card className="hover:border-[var(--mbg-primary)] transition-colors h-full">
                <div className="p-4 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-[var(--mbg-primary)]/10 text-[var(--mbg-primary)] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--mbg-muted)]">{meta.label}</div>
                    <div className="text-sm truncate" style={{ fontWeight: 500 }}>
                      {m.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[var(--mbg-dark)] shrink-0">
                    <Flame size={14} className="text-[var(--mbg-primary)]" />
                    {m.nutrition_summary.calories} kkal
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Daily summary */}
      {day.daily_nutrition && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3>Total Hari {day.day}</h3>
              {day.daily_total_budget != null && (
                <div className="text-sm text-[var(--mbg-muted)] flex items-center gap-1.5">
                  <Wallet size={14} />
                  {fmtRp(day.daily_total_budget)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Kalori" value={day.daily_nutrition.calories} unit="kkal" />
              <Stat label="Protein" value={day.daily_nutrition.protein ?? 0} unit="g" />
              <Stat label="Karbohidrat" value={day.daily_nutrition.carbs ?? 0} unit="g" />
              <Stat label="Lemak" value={day.daily_nutrition.fat ?? 0} unit="g" />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Plan-wide summary */}
      <Card>
        <CardBody>
          <h3>Ringkasan Keseluruhan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="Avg Kalori/hari" value={summary.avg_daily_calories} unit="kkal" />
            {summary.avg_protein != null && (
              <Stat label="Avg Protein" value={summary.avg_protein} unit="g" />
            )}
            {summary.avg_carbs != null && (
              <Stat label="Avg Karbo" value={summary.avg_carbs} unit="g" />
            )}
            {summary.avg_fat != null && (
              <Stat label="Avg Lemak" value={summary.avg_fat} unit="g" />
            )}
            {summary.total_estimated_budget != null && (
              <div className="bg-[var(--mbg-bg)] rounded-lg p-3 col-span-2 md:col-span-4">
                <div className="text-xs text-[var(--mbg-muted)]">Total estimasi budget</div>
                <div className="mt-1 text-xl" style={{ fontWeight: 600 }}>
                  {fmtRp(summary.total_estimated_budget)}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {openMeal && (
        <MealDetailModal meal={openMeal} onClose={() => setOpenMeal(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-[var(--mbg-bg)] rounded-lg p-3">
      <div className="text-xs text-[var(--mbg-muted)]">{label}</div>
      <div className="mt-1">
        <span className="text-xl" style={{ fontWeight: 600 }}>{value}</span>
        <span className="text-xs text-[var(--mbg-muted)] ml-1">{unit}</span>
      </div>
    </div>
  );
}

function MealDetailModal({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const meta = metaFor(meal.type);
  return (
    <div
      className="fixed inset-0 bg-[var(--mbg-dark)]/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start justify-between sticky top-0 bg-white">
          <div>
            <div className="text-xs text-[var(--mbg-muted)]">{meta.label}</div>
            <h3 className="mt-0.5">{meal.name}</h3>
            {meal.budget_estimate != null && (
              <div className="text-sm text-[var(--mbg-muted)] mt-1 flex items-center gap-1.5">
                <Wallet size={14} />
                {fmtRp(meal.budget_estimate)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-md hover:bg-[var(--mbg-bg)] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div>
            <div className="text-xs text-[var(--mbg-muted)] mb-2">Kandungan Gizi</div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Kalori" value={meal.nutrition_summary.calories} unit="kkal" />
              <Stat label="Protein" value={meal.nutrition_summary.protein} unit="g" />
              <Stat label="Karbohidrat" value={meal.nutrition_summary.carbs} unit="g" />
              <Stat label="Lemak" value={meal.nutrition_summary.fat} unit="g" />
            </div>
          </div>

          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <div className="text-xs text-[var(--mbg-muted)] mb-2">Bahan</div>
              <ul className="flex flex-col gap-1.5">
                {meal.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm border-b border-[var(--mbg-border)] py-1.5 last:border-b-0"
                  >
                    <span>{ing.name}</span>
                    {ing.weight != null && (
                      <span className="text-[var(--mbg-muted)]">
                        {ing.weight}
                        {ing.unit ? ` ${ing.unit}` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meal.instructions && meal.instructions.length > 0 && (
            <div>
              <div className="text-xs text-[var(--mbg-muted)] mb-2">Cara Membuat</div>
              <ol className="flex flex-col gap-2 text-sm list-decimal pl-5">
                {meal.instructions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
