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
        { ok: false, error: "Hanya SALES yang boleh import." },
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

    // preload master
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
          },
        }),
      ]);

    const productByName = new Map(products.map((p) => [nameKey(p.name), p.id]));

    const sourceByCode = new Map(
      sources.map((s) => [String(s.code).toUpperCase(), s.id])
    );
    const sourceByName = new Map(sources.map((s) => [nameKey(s.name), s.id]));

    const stageByCode = new Map(
      stages.map((s) => [String(s.code).toUpperCase(), s.id])
    );
    const stageByName = new Map(stages.map((s) => [nameKey(s.name), s.id]));

    const statusByCode = new Map(
      statuses.map((s) => [String(s.code).toUpperCase(), s.id])
    );
    const statusByName = new Map(statuses.map((s) => [nameKey(s.name), s.id]));

    const subStatusByCode = new Map(
      subStatuses.map((s) => [s.code.toUpperCase(), s])
    );

    const errors: Array<{ rowNumber: number; messages: string[] }> = [];
    const skipped: Array<{ rowNumber: number; reason: string }> = [];
    const createData: Array<Parameters<typeof prisma.lead.create>[0]["data"]> =
      [];

    const existingLeads = await prisma.lead.findMany({
      where: {
        salesId: user.id,
        phone: { not: null },
      },
      select: {
        phone: true,
      },
    });

    const existingPhoneSet = new Set(
      existingLeads.map((l) => l.phone).filter(Boolean)
    );

    raw.forEach((r, idx) => {
      const row = normalizeRow(r);

      const rowNumber = idx + 2;
      const msgs: string[] = [];

      const createdAt = parseExcelDateNullable(row.created_at);
      if (String(row.created_at || "").trim() && !createdAt) {
        msgs.push(
          "Tanggal lead tidak valid. Contoh: 2025-12-15 atau 2025-12-15 08:00 atau 2025/12/15"
        );
      }

      const name = String(row.name || "").trim();
      if (!name) msgs.push("Kolom 'Nama lead' wajib diisi.");

      const phone = normalizePhone(row.phone);
      if (String(row.phone || "").trim() && !phone)
        msgs.push("Format 'No Wa' tidak valid.");

      // === DUPLICATE CHECK (BY PHONE) ===
      if (phone && existingPhoneSet.has(phone)) {
        skipped.push({
          rowNumber,
          reason: `Duplikat No. WhatsApp (${phone})`,
        });
        return;
      }

      const address = String(row.address || "").trim() || null;
      const city = String(row.city || "").trim() || null;

      const productName = String(row.product_name || "").trim() || null;
      const productId = productName
        ? productByName.get(nameKey(productName)) ?? null
        : null;
      if (productName && !productId)
        msgs.push(`Nama produk '${productName}' tidak ditemukan.`);

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

      // if (!statusCode && !subStatusCode) {
      //   msgs.push("Isi minimal salah satu: status_code atau sub_status_code.");
      // }

      if (subStatusCode) {
        const ss = subStatusByCode.get(subStatusCode.toUpperCase());
        if (!ss) {
          msgs.push(`Sub status '${subStatusCode}' tidak ditemukan.`);
        } else {
          subStatusId = ss.id;

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
        return;
      }

      createData.push({
        salesId: user.id, // guard: selalu milik sales yg import
        name,
        phone: phone ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,

        productId: productId ?? undefined,
        sourceId: sourceId ?? undefined,
        stageId: stageId ?? undefined,
        statusId: statusId ?? undefined,
        subStatusId: subStatusId ?? undefined,

        priceOffering: priceOffering ?? undefined,
        priceNegotiation: priceNegotiation ?? undefined,
        priceClosing: priceClosing ?? undefined,

        createdAt: createdAt ?? undefined,

        importedFromExcel: true,
        importedAt: new Date(),
        importedById: user.id,
      });
    });

    // insert chunk
    const CHUNK = 200;
    let inserted = 0;

    for (let i = 0; i < createData.length; i += CHUNK) {
      const chunk = createData.slice(i, i + CHUNK);

      await prisma.$transaction(async (tx) => {
        for (const data of chunk) {
          const lead = await tx.lead.create({ data });

          const salesId = lead.salesId ?? user.id;

          /* =========================
           * STAGE HISTORY
           * ========================= */
          if (lead.stageId) {
            await tx.leadStageHistory.create({
              data: {
                leadId: lead.id,
                stageId: lead.stageId,

                changedById: user.id,
                salesId,

                mode: "NORMAL",
                note: "Imported from Excel",
              },
            });
          }

          /* =========================
           * STATUS HISTORY
           * ========================= */
          if (lead.statusId) {
            await tx.leadStatusHistory.create({
              data: {
                leadId: lead.id,
                statusId: lead.statusId,

                changedById: user.id,
                salesId,
                note: "Imported from Excel",
              },
            });
          }

          /* =========================
           * SUB STATUS HISTORY
           * ========================= */
          if (lead.subStatusId) {
            await tx.leadSubStatusHistory.create({
              data: {
                leadId: lead.id,
                subStatusId: lead.subStatusId,

                changedById: user.id,
                salesId,
                note: "Imported from Excel",
              },
            });
          }
        }
      });

      inserted += chunk.length;
    }

    return NextResponse.json({
      ok: true,
      data: {
        totalRows: raw.length,
        inserted,
        skipped: skipped.length,
        invalid: errors.length,
        skippedRows: skipped.slice(0, 200),
        errors: errors.slice(0, 200),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Gagal import." },
      { status: 500 }
    );
  }
}
