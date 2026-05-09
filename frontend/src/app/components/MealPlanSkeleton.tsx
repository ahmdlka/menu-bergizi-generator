import { Card, CardBody } from "./ui/Card";

export function MealPlanSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <Card>
        <CardBody className="flex flex-col items-center text-center py-10 gap-3">
          <div className="size-12 rounded-full border-2 border-[var(--mbg-primary)] border-t-transparent animate-spin" />
          <div>
            <h3>AI sedang menyusun meal plan kamu...</h3>
            <p className="text-sm text-[var(--mbg-muted)] mt-1">
              Proses ini bisa memakan 10–30 detik. Terima kasih sudah menunggu.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-9 w-20 rounded-lg bg-white border border-[var(--mbg-border)]" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[var(--mbg-bg)]" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-16 bg-[var(--mbg-bg)] rounded" />
                <div className="h-4 w-3/4 bg-[var(--mbg-bg)] rounded" />
              </div>
              <div className="h-4 w-14 bg-[var(--mbg-bg)] rounded" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="h-4 w-48 bg-[var(--mbg-bg)] rounded" />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[var(--mbg-bg)] rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
