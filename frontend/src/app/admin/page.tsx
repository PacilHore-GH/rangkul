import { AdminGuard } from "@/features/admin/admin-guard";
import { FacilityManager } from "@/features/facilities/facility-manager";

export default function AdminPage() {
  return <AdminGuard><FacilityManager /></AdminGuard>;
}
