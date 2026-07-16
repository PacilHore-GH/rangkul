import { AppGuard } from "@/components/app-guard";
import { FamilyDashboard } from "@/components/family-dashboard";
import { ActivePersonProvider } from "@/features/people/active-person-context";

export default function DashboardPage() {
  return <AppGuard><ActivePersonProvider><FamilyDashboard /></ActivePersonProvider></AppGuard>;
}
