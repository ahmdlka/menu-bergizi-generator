import { useState } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { ChatPanel } from "../components/ChatPanel";
import { GeneratorPicker } from "../components/GeneratorPicker";
import { FastForm } from "../components/forms/FastForm";
import { SpecificForm } from "../components/forms/SpecificForm";
import { MealPlanView } from "../components/MealPlanView";
import { MealPlanSkeleton } from "../components/MealPlanSkeleton";
import { useMealPlan } from "../lib/mealPlanStore";
import { mealPlanApi, type GenerateRequest } from "../lib/api";

type View = "picker" | "fast" | "specific";

export function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [view, setView] = useState<View>("picker");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mealPlan, setMealPlan, hydrating } = useMealPlan();

  async function handleSubmit(req: GenerateRequest) {
    setError(null);
    setGenerating(true);
    setView("picker");
    try {
      const mp = await mealPlanApi.generate(req);
      setMealPlan(mp);
    } catch (err: any) {
      setError(err.message ?? "Gagal generate meal plan");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 -m-6">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1>Susun Meal Plan-mu</h1>
              <p className="text-sm text-[var(--mbg-muted)] mt-1">
                Pilih cara generate yang paling cocok untuk kamu.
              </p>
            </div>
            {!chatOpen && (
              <Button variant="secondary" onClick={() => setChatOpen(true)}>
                <MessageSquare size={16} />
                Chat
              </Button>
            )}
          </div>

          {!generating && !hydrating && view === "picker" && (
            <GeneratorPicker
              onPick={(m) => setView(m === "FAST" ? "fast" : "specific")}
            />
          )}
          {!generating && !hydrating && view === "fast" && (
            <FastForm
              onBack={() => setView("picker")}
              onSubmit={handleSubmit}
              submitting={generating}
            />
          )}
          {!generating && !hydrating && view === "specific" && (
            <SpecificForm
              onBack={() => setView("picker")}
              onSubmit={handleSubmit}
              submitting={generating}
            />
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {(generating || hydrating) && <MealPlanSkeleton />}

          {!generating && !hydrating && view === "picker" && mealPlan && (
            <>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setMealPlan(null)}>
                  <RefreshCw size={14} />
                  Hapus & generate ulang
                </Button>
              </div>
              <MealPlanView mealPlan={mealPlan} />
            </>
          )}

          {!generating && !hydrating && view === "picker" && !mealPlan && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center text-center py-16 gap-2">
                <div className="size-12 rounded-full bg-[var(--mbg-bg)] flex items-center justify-center text-[var(--mbg-muted)]">
                  <MessageSquare size={20} />
                </div>
                <h3>Belum ada meal plan</h3>
                <p className="text-sm text-[var(--mbg-muted)] max-w-sm">
                  Hasil meal plan kamu akan muncul di sini setelah generate.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {chatOpen && (
        <ChatPanel onClose={() => setChatOpen(false)} hasMealPlan={!!mealPlan} />
      )}
    </div>
  );
}
