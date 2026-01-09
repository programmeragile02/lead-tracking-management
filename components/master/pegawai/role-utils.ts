export function formatRoleLabel(roleCode?: string | null) {
  if (!roleCode) return "-";

  // ubah SUPERADMIN -> Super Admin
  return roleCode
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function roleBadgeClass(roleCode?: string | null) {
  switch (roleCode) {
    case "SUPERADMIN":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "MANAGER":
      return "bg-primary/10 text-primary border-primary/30";
    case "TEAM_LEADER":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "SALES":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}
