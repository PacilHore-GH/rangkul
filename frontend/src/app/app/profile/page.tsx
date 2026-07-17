import Link from "next/link";
import { AppGuard } from "@/components/app-guard";
import { LogoutButton } from "@/components/logout-button";
import { PersonProfileManager } from "@/components/person-profile-manager";

export default function ProfilePage() {
  return <AppGuard><main className="app-shell">
    <header className="app-header">
      <div>
        <Link href="/app/dashboard" className="back">← Dashboard</Link>
        <p className="eyebrow">ORANG YANG DIDAMPINGI</p>
        <h1>Kelola profil pendampingan</h1>
      </div>
      <LogoutButton />
    </header>
    <PersonProfileManager />
  </main></AppGuard>;
}
