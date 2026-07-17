import { ReactNode } from "react";

import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  form: ReactNode;
  aside?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  heroTitle,
  heroDescription,
  form,
  aside,
}: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-form-column">
          <div className="auth-mobile-brand">
            <AuthBrand compact />
          </div>
          <div className="auth-mobile-hero">
            <AuthHeroPanel
              eyebrow="RANGKUL · RUANG KELUARGA"
              title={heroTitle}
              description={heroDescription}
              compact
            />
          </div>

          <section className="auth-card">
            <AuthBrand />
            <header className="auth-header">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="muted">{description}</p>
            </header>
            {form}
          </section>

          {aside ? <div className="auth-aside">{aside}</div> : null}
        </div>

        <div className="auth-visual-column">
          <AuthHeroPanel
            eyebrow="RANGKUL · RUANG KELUARGA"
            title={heroTitle}
            description={heroDescription}
          />
        </div>
      </section>
    </main>
  );
}


