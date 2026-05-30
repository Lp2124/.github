import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [rolesResult, companiesResult, branchesResult] = await Promise.all([
    supabase
      .from("user_role_assignments")
      .select("role_name")
      .eq("user_id", user?.id ?? ""),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("branches").select("id", { count: "exact", head: true })
  ]);

  const roleNames = (rolesResult.data ?? [])
    .map((role) => role.role_name)
    .filter((roleName): roleName is string => Boolean(roleName));

  return (
    <DashboardOverview
      userEmail={user?.email ?? ""}
      roleNames={roleNames}
      companyCount={companiesResult.count ?? 0}
      branchCount={branchesResult.count ?? 0}
    />
  );
}
