import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OverviewPricePayload = {
  value: number;
  date: string; // ISO
};

// helper
function normalizeWibDate(input?: string) {
  if (!input) return null;

  // kalau sudah ISO valid → langsung pakai
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // fallback: date-only → inject WIB noon
  return new Date(`${input}T12:00:00+07:00`);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "ID lead tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      name,
      phone,
      address,
      city, // legacy
      cityId,
      provinceId,
      productId,
      customValues,
      prices,
      statusId,
      subStatusId,
    }: {
      name: string;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      cityId?: number | null;
      provinceId?: number | null;
      productId?: number | null;
      customValues?: { fieldId: number; value: string }[];
      prices?: {
        offering?: OverviewPricePayload;
        negotiation?: OverviewPricePayload;
        closing?: OverviewPricePayload;
      };
      statusId?: number | null;
      subStatusId?: number | null;
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Nama lead wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil data lama (buat compare)
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        statusId: true,
        subStatusId: true,
        salesId: true,
        isExcluded: true,
      },
    });

    if (!existingLead || existingLead.isExcluded) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // =========================
      // UPDATE DATA UTAMA LEAD
      // =========================
      const dataToUpdate: any = {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        cityId: cityId ?? null,
        provinceId: provinceId ?? null,
        // legacy backup
        city: city?.trim() || null,
        productId: productId ? Number(productId) : null,
      };

      // Harga
      if (prices?.offering && prices.offering.value) {
        dataToUpdate.priceOffering = prices.offering.value;

        const d = normalizeWibDate(prices.offering.date);
        if (d && !Number.isNaN(d.getTime())) {
          dataToUpdate.priceOfferingAt = d;
        }
      }

      if (prices?.negotiation && prices.negotiation.value) {
        dataToUpdate.priceNegotiation = prices.negotiation.value;

        const d = normalizeWibDate(prices.negotiation.date);
        if (d && !Number.isNaN(d.getTime())) {
          dataToUpdate.priceNegotiationAt = d;
        }
      }

      if (prices?.closing && prices.closing.value) {
        dataToUpdate.priceClosing = prices.closing.value;

        const d = normalizeWibDate(prices.closing.date);
        if (d && !Number.isNaN(d.getTime())) {
          dataToUpdate.priceClosingAt = d;
        }
      }

      if (cityId) {
        const cityExists = await tx.city.findUnique({
          where: { id: cityId },
          select: { id: true },
        });

        if (!cityExists) {
          throw new Error("Kota / kabupaten tidak valid");
        }
      }

      await tx.lead.update({
        where: { id: leadId },
        data: dataToUpdate,
      });

      // =========================
      // STATUS
      // =========================
      if (typeof statusId === "number" && statusId !== existingLead.statusId) {
        await tx.lead.update({
          where: { id: leadId },
          data: {
            statusId,
            subStatusId: null, // reset sub status
          },
        });

        await tx.leadStatusHistory.create({
          data: {
            leadId,
            statusId,
            salesId: existingLead.salesId,
            note: "Diubah dari overview",
          },
        });
      }

      // =========================
      // SUB STATUS
      // =========================
      if (
        typeof subStatusId === "number" &&
        subStatusId !== existingLead.subStatusId
      ) {
        await tx.lead.update({
          where: { id: leadId },
          data: { subStatusId },
        });

        await tx.leadSubStatusHistory.create({
          data: {
            leadId,
            subStatusId,
            salesId: existingLead.salesId,
            note: "Diubah dari overview",
          },
        });
      }

      // =========================
      // CUSTOM FIELD VALUES
      // =========================
      if (Array.isArray(customValues)) {
        for (const cv of customValues) {
          if (!cv.fieldId) continue;

          await tx.leadCustomFieldValue.upsert({
            where: {
              leadId_fieldId: {
                leadId,
                fieldId: cv.fieldId,
              },
            },
            update: {
              value: cv.value ?? "",
            },
            create: {
              leadId,
              fieldId: cv.fieldId,
              value: cv.value ?? "",
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Update overview error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal menyimpan overview lead" },
      { status: 500 }
    );
  }
}
