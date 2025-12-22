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
      city,
      productId,
      customValues,
    }: {
      name: string;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      productId?: number | null;
      customValues?: { fieldId: number; value: string }[];
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Nama lead wajib diisi" },
        { status: 400 }
      );
    }

    const productIdNumber = productId ? Number(productId) : null;

    // update lead utama
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        productId: productIdNumber,
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
