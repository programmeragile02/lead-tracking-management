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
  subStatusId: number | null;

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

const HEADER_MAP: Record<string, string> = {
  "Tanggal Lead Masuk": "created_at",
  "Nama Lead *": "name",
  "No. WhatsApp": "phone",
  Alamat: "address",
  Kota: "city",
  "Nama Produk": "product_name",
  "Sumber Lead (Kode)": "source_code",
  "Tahap Lead (Kode)": "stage_code",
  "Status Utama (Kode)": "status_code",
  "Sub Status (Kode)": "sub_status_code",
  "Harga Penawaran": "price_offering",
  "Harga Negosiasi": "price_negotiation",
  "Harga Closing": "price_closing",
};

function normalizeRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [label, key] of Object.entries(HEADER_MAP)) {
    out[key] = row[label] ?? "";
  }

  return out;
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
    const [products, sources, stages, statuses, subStatuses] =
      await Promise.all([
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
        prisma.leadSubStatus.findMany({
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            statusId: true,
            status: { select: { code: true } },
          },
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

    const subStatusByCode = new Map(
      subStatuses.map((s) => [s.code.toUpperCase(), s])
    );

    const errors: Array<{ rowNumber: number; messages: string[] }> = [];
    const validRows: PreviewRow[] = [];

    raw.forEach((r, idx) => {
      const row = normalizeRow(r);

      const rowNumber = idx + 2;
      const msgs: string[] = [];

      const createdAt = parseExcelDateNullable(row.created_at);
      if (String(row.created_at || "").trim() && !createdAt) {
        msgs.push(
          "Tanggal masuk tidak valid. Isi contoh: 2025-12-15 atau 2025-12-15 08:00 atau 2025/12/15"
        );
      }

      const name = String(row.name || "").trim();
      if (!name) msgs.push("Kolom 'Nama Lead *' wajib diisi.");

      const phone = normalizePhone(row.phone);
      if (String(row.phone || "").trim() && !phone)
        msgs.push("Format 'No Wa' tidak valid. Contoh: 0812xxx atau 62812xxx.");

      const address = String(row.address || "").trim() || null;
      const city = String(row.city || "").trim() || null;

      const productName = String(row.product_name || "").trim() || null;
      const productId = productName
        ? productByName.get(nameKey(productName)) ?? null
        : null;
      if (productName && !productId)
        msgs.push(`Nama Produk '${productName}' tidak ditemukan.`);

      const sourceCode = String(row.source_code || "").trim();
      const sourceId = sourceCode
        ? sourceByCode.get(sourceCode.toUpperCase()) ?? null
        : null;
      if (sourceCode && !sourceId)
        msgs.push(`Sumber lead '${sourceCode}' tidak ditemukan.`);

      const stageCode = String(row.stage_code || "").trim();
      const stageId = stageCode
        ? stageByCode.get(stageCode.toUpperCase()) ?? null
        : null;
      if (stageCode && !stageId)
        msgs.push(`Tahap lead '${stageCode}' tidak ditemukan.`);

      const statusCode = String(row.status_code || "").trim();
      let statusId: number | null = null;

      if (statusCode) {
        statusId = statusByCode.get(statusCode.toUpperCase()) ?? null;
        if (!statusId) {
          msgs.push(`Status utama '${statusCode}' tidak ditemukan.`);
        }
      }

      const subStatusCode = String(row.sub_status_code || "").trim();
      let subStatusId: number | null = null;

      // Keduanya kosong
      // if (!statusCode && !subStatusCode) {
      //   msgs.push("Isi minimal salah satu: status_code atau sub_status_code.");
      // }

      // Kalau ada sub status → tentukan status utama
      if (subStatusCode) {
        const ss = subStatusByCode.get(subStatusCode.toUpperCase());
        if (!ss) {
          msgs.push(`Sub status '${subStatusCode}' tidak ditemukan.`);
        } else {
          subStatusId = ss.id;

          // AUTO SET STATUS DARI SUB (kalau kosong)
          if (!statusId) {
            statusId = ss.statusId;
          } else if (statusId !== ss.statusId) {
            msgs.push(
              `Sub status '${subStatusCode}' tidak cocok dengan status_code.`
            );
          }
        }
      }

      const priceOffering = parseDecimalNullable(row.price_offering);
      if (String(row.price_offering || "").trim() && priceOffering === null)
        msgs.push("Harga penawaran tidak valid.");

      const priceNegotiation = parseDecimalNullable(row.price_negotiation);
      if (
        String(row.price_negotiation || "").trim() &&
        priceNegotiation === null
      )
        msgs.push("Harga negosiasi tidak valid.");

      const priceClosing = parseDecimalNullable(row.price_closing);
      if (String(row.price_closing || "").trim() && priceClosing === null)
        msgs.push("Harga closing tidak valid.");

      if (msgs.length) {
        errors.push({ rowNumber, messages: msgs });
      } else {
        validRows.push({
          rowNumber,
          name,
          phone,
          address,
          city,
          productName,
          productId,
          sourceId,
          stageId,
          statusId,
          subStatusId,
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
