export function normalizeWaNumber(raw?: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/\D/g, "").replace(/^0/, "62");
}
