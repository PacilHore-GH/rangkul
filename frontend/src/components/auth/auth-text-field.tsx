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

  return (
    <label htmlFor={fieldId} className="auth-field">
      <span className="auth-label-row">
        <span>{label}</span>
      </span>
      <div className={`auth-input-row ${error ? "auth-input-row-error" : ""}`}>
        {leading ? <span className="auth-input-leading">{leading}</span> : null}
        <input id={fieldId} className={`auth-input ${className ?? ""}`.trim()} {...props} />
      </div>
      <span className={`hint ${error ? "hint-error" : ""}`}>{error || hint || " "}</span>
    </label>
  );
}
