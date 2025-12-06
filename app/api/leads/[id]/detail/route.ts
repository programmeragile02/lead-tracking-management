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
        include: { field: { include: { options: true } } },
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
  const [
    products,
    statuses,
    stages,
    stageHistory,
    statusHistory,
    followUpTypes,
    fieldDefs,
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
    // ambil semua definisi field dinamis aktif (supaya field yang belum ada nilai juga muncul)
    prisma.leadCustomFieldDef.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        options: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  // 6. Bangun map nilai custom untuk lead ini: fieldId -> value
  const valueMap = new Map<number, string>();
  for (const cv of lead.customValues ?? []) {
    valueMap.set(cv.fieldId, cv.value);
  }

  // 7. Bentuk dynamicFields ramah UI
  const dynamicFields = fieldDefs.map((f) => ({
    id: f.id, // ID definisi field
    key: f.key,
    label: f.label,
    type: f.type, // enum LeadFieldType -> di frontend pakai string yang sama
    isRequired: f.isRequired,
    options: f.options.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
    value: valueMap.get(f.id) ?? "",
  }));

  // 8. Hitung persentase kelengkapan profil untuk progress bar di UI
  const profileCompletion = computeProfileCompletion(lead);

  // 9. Response ke frontend
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
      dynamicFields,
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

  // field dinamis → masih pakai customValues, ini nggak masalah
  for (const cv of lead.customValues ?? []) {
    check(cv.value);
  }

  if (!total) return 0;
  return Math.round((filled / total) * 100);
}
