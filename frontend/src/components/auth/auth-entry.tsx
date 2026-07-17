import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export function AuthEntry() {
  return (
    <AuthShell
      eyebrow="RANGKUL · SELAMAT DATANG"
      title="Ruang masuk yang tenang untuk keluarga dan tim."
      description="Masuk ke workspace Rangkul untuk mencatat perkembangan, menyimpan checkpoint, dan menjaga konteks pendampingan tetap rapi."
      heroTitle="Kemajuan kecil tetap terasa berarti saat dicatat dengan hangat."
      heroDescription="Rangkul membantu keluarga dan profesional melihat progres harian dalam ruang yang ringan, privat, dan mudah dipakai berulang."
      form={
        <div className="auth-entry-actions">
          <Link className="primary auth-action-link" href="/login">Masuk ke akun</Link>
          <Link className="secondary auth-action-link" href="/register/role">Buat akun keluarga</Link>
          <Link className="auth-inline-link" href="/admin/login">Masuk sebagai admin internal</Link>
        </div>
      }
      aside={
        <div className="auth-entry-note">
          <span className="auth-chip auth-chip-accent">Privasi dulu</span>
          <p>Media dan catatan tetap mengikuti izin relasi pengguna dan profil aktif yang sedang didampingi.</p>
        </div>
      }
    />
  );
}
