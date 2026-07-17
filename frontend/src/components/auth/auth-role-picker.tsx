"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";

const options = [
  {
    code: "family",
    title: "Keluarga & caregiver",
    description:
      "Untuk orang tua, wali, atau pendamping yang ingin mencatat progres harian dan berkolaborasi dengan profesional.",
    status: "ready",
  },
  {
    code: "professional",
    title: "Profesional",
    description:
      "Akses mandiri untuk profesional akan dibuka setelah alur undangan dan review workspace final tersedia.",
    status: "coming_soon",
  },
];

export function AuthRolePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState("family");

  return (
    <AuthShell
      eyebrow="RANGKUL · PENDAFTARAN"
      title="Pilih peran untuk memulai."
      description="Langkah ini membantu kami menampilkan alur masuk yang sesuai tanpa mengubah fitur yang sudah berjalan."
      heroTitle="Pendampingan terasa lebih tenang saat alurnya jelas."
      heroDescription="Rangkul menyiapkan ruang yang hangat untuk keluarga mencatat progres kecil, menjaga konteks, dan tetap terhubung dengan tim profesional."
      form={
        <>
          <div className="auth-role-grid" role="radiogroup" aria-label="Pilih peran akun">
            {options.map((option) => {
              const active = selected === option.code;
              const disabled = option.status !== "ready";
              return (
                <button
                  key={option.code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => setSelected(option.code)}
                  className={`auth-role-card ${active ? "auth-role-card-active" : ""} ${disabled ? "auth-role-card-disabled" : ""}`}
                >
                  <div className="auth-role-head">
                    <span className="auth-role-title">{option.title}</span>
                    <span
                      className={`auth-chip ${disabled ? "auth-chip-muted" : "auth-chip-success"}`}
                    >
                      {disabled ? "Segera" : "Aktif"}
                    </span>
                  </div>
                  <p>{option.description}</p>
                </button>
              );
            })}
          </div>

          <button
            className="primary"
            type="button"
            onClick={() => router.push(`/register/account?role=${selected}`)}
          >
            Lanjutkan pendaftaran
          </button>
        </>
      }
      aside={
        <div className="auth-links auth-links-inline">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </div>
      }
    />
  );
}
