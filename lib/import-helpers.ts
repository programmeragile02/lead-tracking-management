export function normalizePhone(input: any): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  let d = raw.replace(/[^\d]/g, "");

  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (d.startsWith("8")) d = "62" + d;
  if (d.startsWith("620")) d = "62" + d.slice(3);

  if (!d.startsWith("62")) return null;
  if (d.length < 10 || d.length > 16) return null;

  return d;
}

export function parseDecimalNullable(input: any): string | null {
  if (input === null || input === undefined || input === "") return null;

  let cleaned = String(input)
    .trim()
    .replace(/rp/gi, "")
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "");

  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // 12.000.000,50
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // 12,000,000.50
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // 12000000,50
    cleaned = cleaned.replace(",", ".");
  } else {
    // 12.000.000 (anggap ribuan)
    cleaned = cleaned.replace(/\./g, "");
  }

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  return n.toFixed(2); // prisma Decimal aman pakai string
}

function keyCode(v: any) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}
function keyName(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

export function pickIdFromCodeOrName(params: {
  code?: any;
  name?: any;
  byCode?: Map<string, number>;
  byName: Map<string, number>;
}) {
  const c = keyCode(params.code);
  const n = keyName(params.name);

  if (c && params.byCode?.has(c)) return params.byCode.get(c)!;
  if (n && params.byName.has(n)) return params.byName.get(n)!;
  return null;
}

export function parseExcelDateNullable(input: any): Date | null {
  if (input === null || input === undefined || input === "") return null;

  // sudah Date object
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;

  // Excel serial number
  if (typeof input === "number" && Number.isFinite(input)) {
    const ms = Math.round((input - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const s = String(input).trim();
  if (!s) return null;

  // dukung "DD/MM/YYYY" atau "DD/MM/YYYY HH:mm" atau "DD/MM/YYYY HH:mm:ss"
  const m1 = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m1) {
    const dd = Number(m1[1]);
    const mm = Number(m1[2]);
    const yyyy = Number(m1[3]);
    const hh = m1[4] ? Number(m1[4]) : 0;
    const mi = m1[5] ? Number(m1[5]) : 0;
    const ss = m1[6] ? Number(m1[6]) : 0;

    const d = new Date(yyyy, mm - 1, dd, hh, mi, ss);
    // validasi biar 32/13/2025 ketolak
    if (
      d.getFullYear() === yyyy &&
      d.getMonth() === mm - 1 &&
      d.getDate() === dd
    ) {
      return d;
    }
    return null;
  }

  // dukung "YYYY-MM-DD" atau "YYYY-MM-DD HH:mm"
  const isoish = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(isoish);
  return Number.isNaN(d.getTime()) ? null : d;
}
