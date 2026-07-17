import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--brand-deep)]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
