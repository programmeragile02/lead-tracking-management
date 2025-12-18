export function getWaTargetFromLead(
  lead: {
    phone?: string | null;
  },
  lastChatId?: string | null
) {
  if (lastChatId) return lastChatId;

  if (lead.phone) {
    const digits = lead.phone.replace(/[^\d]/g, "");
    return digits ? `${digits}@c.us` : null;
  }

  return null;
}
