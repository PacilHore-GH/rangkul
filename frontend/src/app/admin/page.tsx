import { redirect } from "next/navigation";

// ponytail: no dashboard page yet, just redirect to aid programs
export default function AdminPage() {
  redirect("/admin/aid");
}
