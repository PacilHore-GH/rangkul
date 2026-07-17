"use client";

import { useId, useState } from "react";

import { passwordRequirements } from "@/lib/validation";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  className?: string;
  showRequirements?: boolean;
  hint?: string;
  error?: string;
  id?: string;
};

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  className = "field",
  showRequirements = false,
  hint,
  error,
  id: providedId,
}: PasswordFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          className={`${className} ${error ? "auth-input-error" : ""}`.trim()}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error || !showRequirements ? hintId : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a15 15 0 0 1-2.1 2.6M6.2 6.2C4.2 7.5 3 9 3 9s3.5 5 9 5c1.2 0 2.3-.2 3.3-.6" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
      {showRequirements ? (
        <>
        <ul className="password-requirements" aria-label="Ketentuan kata sandi">
          {passwordRequirements(value).map((requirement) => (
            <li key={requirement.key} className={requirement.met ? "met" : ""}>
              <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>
              {requirement.label}
            </li>
          ))}
        </ul>
        {error ? (
          <span id={hintId} className="hint hint-error" role="alert">
            {error}
          </span>
        ) : null}
        </>
      ) : (
        <span
          id={hintId}
          className={`hint ${error ? "hint-error" : ""}`}
          role={error ? "alert" : undefined}
        >
          {error || hint || "Masukkan kata sandi Anda"}
        </span>
      )}
    </div>
  );
}
