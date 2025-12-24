export const DEFAULT_STATUS_CLASS = "bg-slate-600 text-white";

export const STATUS_COLOR_MAP: Record<string, string> = {
  NEW: "bg-slate-500 text-white",
  COLD: "bg-blue-700 text-white",
  WARM: "bg-amber-500 text-white",
  HOT: "bg-red-500 text-white",
  CLOSE_WON: "bg-emerald-500 text-white",
  CLOSE_LOST: "bg-rose-500 text-white",
};

/**
 * Ambil class badge status dengan fallback aman
 */
export function getStatusClass(
  code?: string | null,
  fallback = DEFAULT_STATUS_CLASS
) {
  if (!code) return fallback;
  return STATUS_COLOR_MAP[code] ?? fallback;
}
