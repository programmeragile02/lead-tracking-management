import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      productId,
      statusCode,
      priceOffering,
      priceNegotiation,
      priceClosing,
      customValues,
    }: {
      name: string;
      phone?: string | null;
      address?: string | null;
      productId?: number | null;
      statusCode?: string | null;
      priceOffering?: string | null;
      priceNegotiation?: string | null;
      priceClosing?: string | null;
      customValues?: { fieldId: number; value: string }[];
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Nama lead wajib diisi" },
        { status: 400 }
      );
    }

    // cari statusId dari code kalau ada
    let statusId: number | null = null;
    if (statusCode) {
      const status = await prisma.leadStatus.findUnique({
        where: { code: statusCode },
        select: { id: true },
      });
      statusId = status?.id ?? null;
    }

    const productIdNumber = productId ? Number(productId) : null;

    // update lead utama
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        productId: productIdNumber,
        statusId: statusId,
        priceOffering: priceOffering
          ? new prisma.Prisma.Decimal(priceOffering)
          : null,
        priceNegotiation: priceNegotiation
          ? new prisma.Prisma.Decimal(priceNegotiation)
          : null,
        priceClosing: priceClosing
          ? new prisma.Prisma.Decimal(priceClosing)
          : null,
      },
    });

    // upsert field dinamis (LeadCustomFieldValue)
    if (Array.isArray(customValues) && customValues.length) {
      for (const cv of customValues) {
        if (!cv.fieldId) continue;

        await prisma.leadCustomFieldValue.upsert({
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

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Update overview error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal menyimpan overview lead" },
      { status: 500 }
    );
  }
}
