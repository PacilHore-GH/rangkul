export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "success" | "warning" | "neutral" | "accent";
}) {
  const styles = {
    success: "bg-[var(--brand-soft)] text-[var(--brand)]",
    warning: "bg-[#fff4dc] text-[#9c6a10]",
    neutral: "bg-[var(--panel)] text-[var(--muted)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}
