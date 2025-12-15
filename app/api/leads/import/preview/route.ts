import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  normalizePhone,
  parseDecimalNullable,
  parseExcelDateNullable,
} from "@/lib/import-helpers";

export const runtime = "nodejs";

type PreviewRow = {
  rowNumber: number;
  name: string;
  phone: string | null;
  address: string | null;
  productName: string | null;

  productId: number | null;
  sourceId: number | null;
  stageId: number | null;
  statusId: number | null;

  priceOffering: string | null;
  priceNegotiation: string | null;
  priceClosing: string | null;

  createdAt: string | null;
};

function nameKey(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    if (user.roleCode !== "SALES") {
      return NextResponse.json(
        { ok: false, error: "Hanya SALES yang boleh import" },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "File wajib diupload." },
        { status: 400 }
      );
    }

    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws)
      return NextResponse.json(
        { ok: false, error: "Sheet tidak ditemukan." },
        { status: 400 }
      );

    const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
      defval: "",
    });

    // preload master untuk lookup (lebih cepat & konsisten)
    const [products, sources, stages, statuses] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.leadSource.findMany({
        where: { deletedAt: null },
        select: { id: true, code: true, name: true },
      }),
      prisma.leadStage.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
      }),
      prisma.leadStatus.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const productByName = new Map(products.map((p) => [nameKey(p.name), p.id]));

    const sourceByCode = new Map(
      sources.map((s) => [String(s.code).toUpperCase(), s.id])
    );

    const stageByCode = new Map(
      stages.map((s) => [String(s.code).toUpperCase(), s.id])
    );

    const statusByCode = new Map(
      statuses.map((s) => [String(s.code).toUpperCase(), s.id])
    );

    const errors: Array<{ rowNumber: number; messages: string[] }> = [];
    const validRows: PreviewRow[] = [];

    raw.forEach((r, idx) => {
      const rowNumber = idx + 2;
      const msgs: string[] = [];

      const createdAt = parseExcelDateNullable(r.created_at);
      if (String(r.created_at || "").trim() && !createdAt) {
        msgs.push(
          "created_at tidak valid. Isi contoh: 2025-12-15 atau 2025-12-15 08:00"
        );
      }

      const name = String(r.name || "").trim();
      if (!name) msgs.push("Kolom 'name' wajib diisi.");

      const phone = normalizePhone(r.phone);
      if (String(r.phone || "").trim() && !phone)
        msgs.push("Format 'phone' tidak valid. Contoh: 0812xxx atau 62812xxx.");

      const address = String(r.address || "").trim() || null;

      const productName = String(r.product_name || "").trim() || null;
      const productId = productName
        ? productByName.get(nameKey(productName)) ?? null
        : null;
      if (productName && !productId)
        msgs.push(`product_name '${productName}' tidak ditemukan.`);

      const sourceCode = String(r.source_code || "").trim();
      const sourceId = sourceCode
        ? sourceByCode.get(sourceCode.toUpperCase()) ?? null
        : null;
      if (sourceCode && !sourceId)
        msgs.push(`source_code '${sourceCode}' tidak ditemukan.`);

      const stageCode = String(r.stage_code || "").trim();
      const stageId = stageCode
        ? stageByCode.get(stageCode.toUpperCase()) ?? null
        : null;
      if (stageCode && !stageId)
        msgs.push(`stage_code '${stageCode}' tidak ditemukan.`);

      const statusCode = String(r.status_code || "").trim();
      const statusId = statusCode
        ? statusByCode.get(statusCode.toUpperCase()) ?? null
        : null;
      if (statusCode && !statusId)
        msgs.push(`status_code '${statusCode}' tidak ditemukan.`);

      const priceOffering = parseDecimalNullable(r.price_offering);
      if (String(r.price_offering || "").trim() && priceOffering === null)
        msgs.push("price_offering tidak valid.");

      const priceNegotiation = parseDecimalNullable(r.price_negotiation);
      if (String(r.price_negotiation || "").trim() && priceNegotiation === null)
        msgs.push("price_negotiation tidak valid.");

      const priceClosing = parseDecimalNullable(r.price_closing);
      if (String(r.price_closing || "").trim() && priceClosing === null)
        msgs.push("price_closing tidak valid.");

      if (msgs.length) {
        errors.push({ rowNumber, messages: msgs });
      } else {
        validRows.push({
          rowNumber,
          name,
          phone,
          address,
          productName,
          productId,
          sourceId,
          stageId,
          statusId,
          priceOffering,
          priceNegotiation,
          priceClosing,
          createdAt: createdAt ? createdAt.toISOString() : null,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      data: {
        totalRows: raw.length,
        validRows: validRows.length,
        invalidRows: errors.length,
        preview: validRows.slice(0, 10),
        errors: errors.slice(0, 200),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Gagal preview import." },
      { status: 500 }
    );
  }
}
