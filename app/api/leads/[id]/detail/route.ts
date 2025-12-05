// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";

// export async function GET(
//   req: NextRequest,
//   ctx: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await ctx.params;
//   const user = await getCurrentUser(req);
//   if (!user) {
//     return NextResponse.json(
//       { ok: false, error: "unauthenticated" },
//       { status: 401 }
//     );
//   }

//   const leadId = Number(id);
//   console.log("[lead-detail] hit for id =", id, "-> leadId =", leadId);
//   if (!leadId || Number.isNaN(leadId)) {
//     return NextResponse.json(
//       { ok: false, error: "invalid_id" },
//       { status: 400 }
//     );
//   }

//   // ambil lead + relasi penting + nilai custom
//   const lead = await prisma.lead.findUnique({
//     where: { id: leadId },
//     include: {
//       product: true,
//       source: true,
//       stage: true,
//       status: true,
//       sales: {
//         select: { id: true, name: true, phone: true },
//       },
//       customValues: {
//         include: {
//           field: true,
//         },
//       },
//     },
//   });

//   console.log("[lead-detail] lead =", lead);

//   if (!lead) {
//     return NextResponse.json(
//       { ok: false, error: "lead_not_found" },
//       { status: 404 }
//     );
//   }

//   // Kalau role sales, batasi hanya lead miliknya
//   if (user.roleSlug === "sales" && lead.salesId !== user.id) {
//     return NextResponse.json(
//       { ok: false, error: "forbidden" },
//       { status: 403 }
//     );
//   }

//   // ambil daftar produk aktif
//   const products = await prisma.product.findMany({
//     where: {
//       isAvailable: true,
//       deletedAt: null,
//     },
//     orderBy: { name: "asc" },
//   });

//   // ambil definisi field custom aktif (buat hitung completion)
//   const customDefs = await prisma.leadCustomFieldDef.findMany({
//     where: {
//       isActive: true,
//     },
//     include: {
//       options: true,
//     },
//     orderBy: { sortOrder: "asc" },
//   });

//   // --- hitung profile completion ---

//   // field paten yang kita anggap bagian dari "kelengkapan profil"
//   const baseFields: { key: string; filled: boolean }[] = [
//     { key: "name", filled: !!lead.name?.trim() },
//     { key: "phone", filled: !!lead.phone?.trim() },
//     { key: "address", filled: !!lead.address?.trim() },
//     { key: "product", filled: !!lead.productId },
//     { key: "status", filled: !!lead.statusId },
//     { key: "stage", filled: !!lead.stageId },
//     { key: "source", filled: !!lead.sourceId },
//   ];

//   // field dinamis yang required
//   const requiredDynamicDefs = customDefs.filter((d) => d.isRequired);
//   const dynamicFilled = requiredDynamicDefs.map((def) => {
//     const val = lead.customValues.find((v) => v.fieldId === def.id);
//     return {
//       key: def.key,
//       filled: !!val?.value?.trim(),
//     };
//   });

//   const allFields = [...baseFields, ...dynamicFilled];
//   const total = allFields.length || 1;
//   const filledCount = allFields.filter((f) => f.filled).length;
//   const profileCompletion = Math.min(
//     100,
//     Math.round((filledCount / total) * 100)
//   );

//   return NextResponse.json({
//     ok: true,
//     data: {
//       lead,
//       products,
//       profileCompletion,
//       dynamicFields: customDefs,
//     },
//   });
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const leadId = Number(id || 0);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "invalid_id" },
        { status: 400 }
      );
    }

    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // lead + relasi penting
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        product: true,
        status: true,
        stage: true,
        source: true,
        sales: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "lead_not_found" },
        { status: 404 }
      );
    }

    // option produk (untuk dropdown)
    const products = await prisma.product.findMany({
      where: { isAvailable: true, deletedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    });

    // master tahap (urut by order)
    const stages = await prisma.leadStage.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, code: true, order: true },
    });

    // master status (urut by order)
    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true, code: true, order: true },
    });

    // contoh scoring sederhana untuk progress profil:
    let filled = 0;
    let total = 6;

    if (lead.phone) filled++;
    if (lead.address) filled++;
    if (lead.productId) filled++;
    if (lead.statusId) filled++;
    if (lead.stageId) filled++;
    if (lead.sourceId) filled++;

    const profileCompletion = Math.round((filled / total) * 100);

    return NextResponse.json({
      ok: true,
      data: {
        lead,
        products,
        stages,
        statuses,
        profileCompletion,
      },
    });
  } catch (err) {
    console.error("[lead-detail] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
