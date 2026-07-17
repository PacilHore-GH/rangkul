"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { PasswordField } from "@/components/password-field";
import { api, ApiError, CurrentUser } from "@/lib/api";
import {
  assertStrongPassword,
  assertValidEmail,
  InputValidationError,
  sanitizeSingleLine,
} from "@/lib/validation";

const rememberedEmailKey = "rangkul:remembered-email";

export function AuthForm({
  mode,
  role = "family",
}: {
  mode: "login" | "register";
  role?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined" || mode !== "login") return "";
    return window.localStorage.getItem(rememberedEmailKey) ?? "";
  });
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    terms?: string;
  }>({});
  const isRegister = mode === "register";
  const safeRole = role === "family" ? role : "family";

  const copy = useMemo(
    () => ({
      eyebrow: isRegister ? "RANGKUL · BUAT AKUN" : "RANGKUL · KELUARGA",
      title: isRegister ? "Mulai mendampingi, bersama." : "Selamat datang kembali.",
      description: isRegister
        ? "Buat akun keluarga untuk menyimpan dukungan, catatan, dan progres yang paling berarti."
        : "Masuk untuk melanjutkan ruang pendampingan keluarga Anda.",
      heroTitle: "Tempat yang hangat untuk menyimpan kemajuan harian.",
      heroDescription:
        "Rangkul membantu keluarga melihat perkembangan kecil secara lebih tenang, konsisten, dan siap dibagikan saat dibutuhkan.",
      submit: isRegister ? "Buat akun keluarga" : "Masuk",
    }),
    [isRegister],
  );

  function resetFieldErrors() {
    setFieldErrors({});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    resetFieldErrors();

    let normalizedEmail = "";
    let sanitizedName = "";

    try {
      normalizedEmail = assertValidEmail(email);
    } catch (err) {
      const message =
        err instanceof InputValidationError
          ? err.message
          : "Masukkan alamat email yang valid.";
      setFieldErrors((current) => ({ ...current, email: message }));
      return;
    }

    try {
      if (isRegister) {
        assertStrongPassword(password);
        sanitizedName = sanitizeSingleLine(name, 1000);
        if (!sanitizedName) {
          throw new InputValidationError("Masukkan nama Anda.");
        }
        if (sanitizedName.length > 80) {
          throw new InputValidationError("Nama tidak boleh lebih dari 80 karakter.");
        }
        if (!terms) {
          setFieldErrors((current) => ({
            ...current,
            terms: "Centang persetujuan penggunaan data untuk melanjutkan.",
          }));
          return;
        }
      } else if (!password) {
        throw new InputValidationError("Masukkan kata sandi Anda.");
      }
    } catch (err) {
      const message = err instanceof InputValidationError ? err.message : "Input tidak valid.";
      setFieldErrors((current) => ({
        ...current,
        ...(message.toLowerCase().includes("nama") ? { name: message } : {}),
        ...(message.toLowerCase().includes("kata sandi") ||
        message.toLowerCase().includes("huruf")
          ? { password: message }
          : {}),
      }));
      if (
        !message.toLowerCase().includes("nama") &&
        !message.toLowerCase().includes("kata sandi") &&
        !message.toLowerCase().includes("huruf")
      ) {
        setError(message);
      }
      return;
    }

    setLoading(true);
    try {
      const payload = isRegister
        ? {
            email: normalizedEmail,
            password,
            full_name: sanitizedName,
            terms_accepted: terms,
          }
        : { email: normalizedEmail, password };
      const user = await api<CurrentUser>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!isRegister) {
        if (rememberMe) {
          window.localStorage.setItem(rememberedEmailKey, normalizedEmail);
        } else {
          window.localStorage.removeItem(rememberedEmailKey);
        }
      }
      router.push(user.onboarding_completed ? "/app/dashboard" : "/app/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      heroTitle={copy.heroTitle}
      heroDescription={copy.heroDescription}
      form={
        <>
          <form onSubmit={submit} className="form-stack" noValidate>
            {isRegister ? (
              <AuthTextField
                label="Nama Anda"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                hint="Nama ini akan tampil sebagai identitas utama pendamping."
                error={fieldErrors.name}
              />
            ) : null}

            <AuthTextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={254}
              required
              hint="Gunakan email yang akan dipakai untuk masuk kembali."
              error={fieldErrors.email}
            />

            <PasswordField
              label="Kata sandi"
              className="auth-input"
              value={password}
              onChange={setPassword}
              autoComplete={isRegister ? "new-password" : "current-password"}
              showRequirements={isRegister}
              hint="Masukkan kata sandi Anda"
              error={fieldErrors.password}
            />

            {isRegister ? (
              <label className={`check auth-check ${fieldErrors.terms ? "auth-check-error" : ""}`}>
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(event) => setTerms(event.target.checked)}
                />
                <span>
                  Saya menyetujui penggunaan data secara bertanggung jawab untuk
                  mendukung proses pendampingan.
                </span>
              </label>
            ) : (
              <div className="auth-form-meta">
                <label className="check auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
                <Link href="/forgot-password" className="auth-inline-link">
                  Lupa kata sandi?
                </Link>
              </div>
            )}

            {fieldErrors.terms ? (
              <p role="alert" className="form-error">
                {fieldErrors.terms}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="form-error">
                {error}
              </p>
            ) : null}

            <button className="primary" disabled={loading}>
              {loading ? "Memproses..." : copy.submit}
            </button>
          </form>

          <div className="auth-links">
            {isRegister ? (
              <>
                Sudah punya akun? <Link href="/login">Masuk</Link>
                <br />
                Ingin ubah jenis akun? <Link href="/register/role">Pilih peran</Link>
              </>
            ) : (
              <>
                Belum punya akun? <Link href="/register/role">Daftar</Link>
                <br />
                Akses internal? <Link href="/admin/login">Masuk sebagai admin</Link>
              </>
            )}
          </div>
        </>
      }
      aside={
        isRegister ? (
          <div className="auth-note-grid">
            <div className="auth-note-card">
              <span className="auth-chip auth-chip-success">Akun keluarga</span>
              <p>
                Pendaftaran publik saat ini difokuskan untuk keluarga dan
                caregiver agar alur masuk tetap sederhana.
              </p>
              {safeRole !== "family" ? (
                <p>
                  Jalur profesional akan memakai alur undangan terpisah saat siap
                  dirilis.
                </p>
              ) : null}
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
