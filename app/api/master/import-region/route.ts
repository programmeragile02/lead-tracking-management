import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import * as XLSX from "xlsx";

type ImportSummary = {
  row: number;
  message: string;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || user.roleCode !== "SUPERADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { ok: false, error: "File wajib diupload" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, {
    defval: "",
    raw: false,
  });

  const provinceCache = new Map<string, number>();

  let success = 0;
  let skipped = 0;
  let failed = 0;

  const errors: ImportSummary[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNumber = i + 2; // header = row 1

    try {
      const provinceCode = String(r.province_code).trim();
      const provinceName = String(r.province_name).trim();

      const cityCodeRaw = String(r.city_code).trim();
      const cityCode = cityCodeRaw.replace(",", ".");
      const cityName = String(r.city_name).trim();
      const cityType = String(r.city_type).toUpperCase().trim();

      // === VALIDASI DASAR ===
      if (
        !provinceCode ||
        !provinceName ||
        !cityCode ||
        !cityName ||
        !["KOTA", "KABUPATEN"].includes(cityType)
      ) {
        skipped++;
        continue;
      }

      // === VALIDASI FORMAT CODE ===
      if (!/^\d{2}$/.test(provinceCode)) {
        skipped++;
        continue;
      }

      if (!/^\d{2}\.\d{2}$/.test(cityCode)) {
        skipped++;
        continue;
      }

      // === PROVINCE (CACHE) ===
      let provinceId = provinceCache.get(provinceCode);
      if (!provinceId) {
        const province = await prisma.province.upsert({
          where: { code: provinceCode },
          update: {
            name: provinceName,
          },
          create: {
            code: provinceCode,
            name: provinceName,
            isActive: true,
          },
        });

        provinceId = province.id;
        provinceCache.set(provinceCode, provinceId);
      }

      // === CITY ===
      await prisma.city.upsert({
        where: { code: cityCode },
        update: {
          name: cityName,
          type: cityType,
          provinceId,
          isActive: true,
        },
        create: {
          code: cityCode,
          name: cityName,
          type: cityType,
          provinceId,
          isActive: true,
        },
      });

      success++;
    } catch (err: any) {
      failed++;
      errors.push({
        row: rowNumber,
        message: err?.message || "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      total: rows.length,
      success,
      skipped,
      failed,
    },
    errors: errors.slice(0, 30), // biar response aman
  });
}
