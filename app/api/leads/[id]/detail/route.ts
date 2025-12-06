// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";

// export const dynamic = "force-dynamic";

// export async function GET(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const user = await getCurrentUser(req);
//   if (!user) {
//     return NextResponse.json(
//       { ok: false, error: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   const { id } = await context.params;
//   const leadId = Number(id);
//   if (!leadId || Number.isNaN(leadId)) {
//     return NextResponse.json(
//       { ok: false, error: "Invalid lead id" },
//       { status: 400 }
//     );
//   }

//   const lead = await prisma.lead.findUnique({
//     where: { id: leadId },
//     include: {
//       product: true,
//       source: true,
//       status: true,
//       stage: true,
//       sales: {
//         select: { id: true, name: true, email: true },
//       },
//       customValues: {
//         include: { field: true },
//       },
//     },
//   });

//   if (!lead) {
//     return NextResponse.json(
//       { ok: false, error: "Lead not found" },
//       { status: 404 }
//     );
//   }

//   // kalau role SALES → hanya boleh akses lead-nya sendiri
//   if (user.roleSlug === "sales" && lead.salesId !== user.id) {
//     return NextResponse.json(
//       { ok: false, error: "Forbidden" },
//       { status: 403 }
//     );
//   }

//   const [products, statuses, stages, stageHistory, statusHistory] =
//     await Promise.all([
//       prisma.product.findMany({
//         where: { isAvailable: true, deletedAt: null },
//         orderBy: { name: "asc" },
//       }),
//       prisma.leadStatus.findMany({
//         where: { isActive: true },
//         orderBy: { order: "asc" },
//       }),
//       prisma.leadStage.findMany({
//         where: { isActive: true },
//         orderBy: { order: "asc" },
//       }),
//       prisma.leadStageHistory.findMany({
//         where: { leadId },
//         orderBy: { createdAt: "asc" },
//         include: { stage: true },
//       }),
//       prisma.leadStatusHistory.findMany({
//         where: { leadId },
//         orderBy: { createdAt: "asc" },
//         include: { status: true },
//       }),
//     ]);

//   const profileCompletion = computeProfileCompletion(lead);

//   return NextResponse.json({
//     ok: true,
//     data: {
//       lead,
//       products,
//       statuses,
//       stages,
//       stageHistory,
//       statusHistory,
//       profileCompletion,
//       dynamicFields: lead.customValues,
//     },
//   });
// }

// function computeProfileCompletion(lead: any): number {
//   let total = 0;
//   let filled = 0;

//   const check = (v: any) => {
//     total++;
//     if (v !== null && v !== undefined && String(v).trim() !== "") filled++;
//   };

//   // field utama
//   check(lead.name);
//   check(lead.phone);
//   check(lead.address);
//   check(lead.productId);
//   check(lead.sourceId);
//   check(lead.statusId);
//   check(lead.stageId);

//   // field dinamis
//   for (const cv of lead.customValues ?? []) {
//     check(cv.value);
//   }

//   if (!total) return 0;
//   return Math.round((filled / total) * 100);
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Cek user login
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Ambil dan validasi leadId dari URL
  const { id } = await context.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  // 3. Ambil data lead + relasi penting
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      product: true,
      source: true,
      status: true,
      stage: true,
      sales: {
        select: { id: true, name: true, email: true },
      },
      customValues: {
        include: { field: true },
      },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  // 4. Proteksi: kalau role SALES hanya boleh lihat lead miliknya
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // 5. Ambil master & histori secara paralel:
  //    - products  : daftar produk
  //    - statuses  : master status lead
  //    - stages    : master tahapan pipeline
  //    - stageHistory  : histori perubahan tahap lead ini
  //    - statusHistory : histori perubahan status lead ini
  //    - followUpTypes : master tindak lanjut (FU1, KIRIM_PENAWARAN, dst)
  const [
    products,
    statuses,
    stages,
    stageHistory,
    statusHistory,
    followUpTypes,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.leadStage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.leadStageHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: "asc" },
      include: { stage: true },
    }),
    prisma.leadStatusHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: "asc" },
      include: { status: true },
    }),
    prisma.leadFollowUpType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  // 6. Hitung persentase kelengkapan profil untuk progress bar di UI
  const profileCompletion = computeProfileCompletion(lead);

  // 7. Response ke frontend
  return NextResponse.json({
    ok: true,
    data: {
      lead,
      products,
      statuses,
      stages,
      stageHistory,
      statusHistory,
      profileCompletion,
      dynamicFields: lead.customValues,

      // NEW: master tindak lanjut (ini yang dipakai dropdown di modal)
      followUpTypes,
    },
  });
}

// Helper: hitung kelengkapan profil lead
function computeProfileCompletion(lead: any): number {
  let total = 0;
  let filled = 0;

  const check = (v: any) => {
    total++;
    if (v !== null && v !== undefined && String(v).trim() !== "") filled++;
  };

  // field utama
  check(lead.name);
  check(lead.phone);
  check(lead.address);
  check(lead.productId);
  check(lead.sourceId);
  check(lead.statusId);
  check(lead.stageId);

  // field dinamis
  for (const cv of lead.customValues ?? []) {
    check(cv.value);
  }

  if (!total) return 0;
  return Math.round((filled / total) * 100);
}
