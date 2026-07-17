import { processingSteps } from "@/features/journal/lib/journal-demo-data";

export function ProcessingTimeline({ activeStep = 4 }: { activeStep?: number }) {
  return (
    <ol className="space-y-4">
      {processingSteps.map((step, index) => {
        const complete = index < activeStep;
        const current = index === activeStep;
        return (
          <li key={step} className="flex items-start gap-4">
            <div
              className={`mt-1 h-4 w-4 rounded-full border-2 ${
                complete ? "border-[var(--brand)] bg-[var(--brand)]" : current ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-white"
              }`}
            />
            <div>
              <p className={`text-sm font-medium ${current ? "text-[var(--brand-deep)]" : "text-[var(--muted)]"}`}>{step}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {complete ? "Tahap sudah selesai." : current ? "Tahap sedang berjalan dan status akan diperbarui otomatis." : "Menunggu tahap sebelumnya selesai."}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
