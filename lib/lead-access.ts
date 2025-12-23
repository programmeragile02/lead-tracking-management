import { User, Lead } from "@prisma/client";

export function canAccessLead(user: any, lead: any) {
  if (user.roleSlug === "sales") {
    return lead.salesId === user.id;
  }

  if (user.roleSlug === "team-leader") {
    return lead.sales?.teamLeaderId === user.id;
  }

  if (user.roleSlug === "manager") {
    return true;
  }

  return false;
}
