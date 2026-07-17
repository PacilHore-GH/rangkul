import { InputHTMLAttributes, ReactNode, useId } from "react";

type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
};

export function AuthTextField({
  label,
  hint,
  error,
  leading,
  className,
  id,
  ...props
}: AuthTextFieldProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="auth-field">
      <label htmlFor={fieldId} className="auth-label-row">
        <span>{label}</span>
      </label>
      <div className={`auth-input-row ${error ? "auth-input-row-error" : ""}`}>
        {leading ? <span className="auth-input-leading">{leading}</span> : null}
        <input
          id={fieldId}
          className={`auth-input ${className ?? ""}`.trim()}
          aria-describedby={hintId}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      <span
        id={hintId}
        className={`hint ${error ? "hint-error" : ""}`}
        role={error ? "alert" : undefined}
      >
        {error || hint || " "}
      </span>
    </div>
  );
}
