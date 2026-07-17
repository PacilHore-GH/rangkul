export function SkeletonViewer() {
  return (
    <div className="rounded-[24px] bg-[var(--panel)] p-4">
      <svg viewBox="0 0 220 220" className="mx-auto h-64 w-64" role="img" aria-label="Visualisasi skeleton">
        <circle cx="110" cy="32" r="16" fill="white" stroke="#1d6d59" strokeWidth="3" />
        <path d="M110 48V102M110 60L72 82M110 60L148 82M110 102L82 158M110 102L138 158" stroke="#1d6d59" strokeWidth="7" strokeLinecap="round" />
        <circle cx="72" cy="82" r="7" fill="#7d6fd6" />
        <circle cx="148" cy="82" r="7" fill="#7d6fd6" />
        <circle cx="82" cy="158" r="7" fill="#2a9d79" />
        <circle cx="138" cy="158" r="7" fill="#2a9d79" />
      </svg>
      <p className="mt-3 text-center text-sm text-[var(--muted)]">Frame 12 · Fase raise · Referensi dapat ditampilkan berdampingan.</p>
    </div>
  );
}
