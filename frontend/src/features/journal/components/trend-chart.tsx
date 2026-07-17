export function TrendChart() {
  const points = "10,110 60,95 110,88 160,76 210,73 260,60 310,54 360,49";
  return (
    <div className="rounded-[24px] bg-[var(--panel)] p-4">
      <svg viewBox="0 0 380 140" className="h-44 w-full" role="img" aria-label="Grafik tren perkembangan">
        <path d="M10 120H370" stroke="#d8e7e2" strokeWidth="1.5" />
        <path d="M10 85H370" stroke="#d8e7e2" strokeWidth="1.5" />
        <path d="M10 50H370" stroke="#d8e7e2" strokeWidth="1.5" />
        <polyline fill="none" stroke="#1d6d59" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
        <polyline fill="rgba(42, 157, 121, 0.12)" stroke="none" points={`${points} 360,120 10,120`} />
        <circle cx="360" cy="49" r="5" fill="#7d6fd6" />
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span>Jumlah data valid: 8</span>
        <span>Kualitas rata-rata: 0.78</span>
        <span>Model boundary: 10 Jul 2026</span>
      </div>
    </div>
  );
}
