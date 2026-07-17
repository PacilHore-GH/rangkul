import Image from "next/image";

type AuthHeroPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
};

export function AuthHeroPanel({
  eyebrow,
  title,
  description,
  compact = false,
}: AuthHeroPanelProps) {
  return (
    <section className={`auth-hero-panel ${compact ? "auth-hero-panel-compact" : ""}`}>
      <div className="auth-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="auth-hero-media">
        <Image
          src="/auth-hero-cover.png"
          alt="Ilustrasi pendamping dan anak melakukan high five di ruang terapi yang hangat dan tenang."
          fill
          loading="eager"
          sizes={compact ? "(max-width: 767px) 100vw, 0px" : "(max-width: 1023px) 50vw, 44vw"}
          className="auth-hero-image"
        />
      </div>
    </section>
  );
}
