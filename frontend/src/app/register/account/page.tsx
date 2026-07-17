import { AuthForm } from "@/components/auth-form";

export default async function RegisterAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return <AuthForm mode="register" role={role} />;
}
