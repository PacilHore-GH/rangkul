import { AppGuard } from "@/components/app-guard";
import { FamilyDashboard } from "@/components/family-dashboard";

export default function DashboardPage() {
  return <AppGuard><FamilyDashboard /></AppGuard>;
}
