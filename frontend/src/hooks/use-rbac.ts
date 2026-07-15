import { useAuth } from "@/context/AuthContext";

const HIERARCHY = ["super_admin","company_admin","project_manager","team_lead","employee"] as const;
export type RoleName = typeof HIERARCHY[number];

export function useRbac() {
  const { user } = useAuth();
  const role = user?.role?.role_name as RoleName | undefined;

  const hasMinimumRole = (min: RoleName) =>
    !!role && HIERARCHY.indexOf(role) <= HIERARCHY.indexOf(min);

  const hasPermission = (roles: RoleName[]) =>
    !!role && roles.includes(role);

  return {
    role,
    isSuperAdmin: role === "super_admin",
    isCompanyAdmin: hasMinimumRole("company_admin"),
    isManager: hasMinimumRole("project_manager"),
    isTeamLead: hasMinimumRole("team_lead"),
    isEmployee: hasMinimumRole("employee"),
    hasMinimumRole,
    hasPermission,
  };
}

// Export alias for components using useRBAC
export const useRBAC = useRbac;
