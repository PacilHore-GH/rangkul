import Link from "next/link";

export function AuthBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`auth-brand ${compact ? "auth-brand-compact" : ""}`} aria-label="Rangkul home">
      <span className="auth-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="auth-brand-icon" fill="none">
          <path d="M16 27c5-3.2 10-7.3 10-13a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 5.7 5 9.8 10 13Z" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 18h8M16 14v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="auth-brand-copy">
        <span className="auth-brand-name">Rangkul</span>
        <span className="auth-brand-tagline">Bersama untuk tumbuh, pulih, dan berdaya.</span>
      </span>
    </Link>
  );
}
