import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { fetchWaStatus } from "@/lib/whatsapp-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      product: true,
      source: true,
      status: true,
      stage: true,
      sales: { select: { id: true, name: true, email: true } },
      customValues: { include: { field: { include: { options: true } } } },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  let waStatus: string | null = null;

  if (lead.salesId) {
    try {
      const waState = await fetchWaStatus(lead.salesId);
      waStatus = waState?.status ?? "INIT";
    } catch {
      waStatus = "ERROR";
    }
  }

  // === Ambil master + history + fielddefs + settings secara paralel ===
  const [
    products,
    statuses,
    stages,
    stageHistory,
    statusHistory,
    followUpTypes,
    fieldDefs,
    settings, // <-- NEW
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
    prisma.leadCustomFieldDef.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),

    // ====== SETTINGS ======
    prisma.generalSetting.findFirst({
      where: { id: 1 },
      select: {
        companyName: true,
      },
    }),
  ]);

  const valueMap = new Map<number, string>();
  for (const cv of lead.customValues ?? []) {
    valueMap.set(cv.fieldId, cv.value);
  }

  const dynamicFields = fieldDefs.map((f) => ({
    id: f.id,
    key: f.key,
    label: f.label,
    type: f.type,
    isRequired: f.isRequired,
    options: f.options.map((opt) => ({ value: opt.value, label: opt.label })),
    value: valueMap.get(f.id) ?? "",
  }));

  const profileCompletion = computeProfileCompletion(lead);

  // === Current user yang aman untuk client ===
  const currentUser = {
    id: user.id,
    name: user.name,
    roleCode: user.roleCode ?? null,
    roleSlug: user.roleSlug ?? null,
  };

  // === Settings default fallback ===
  const safeSettings = {
    companyName: settings?.companyName || "Perusahaan Kami",
  };

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
      currentUser,
      settings: safeSettings,
      whatsapp: {
        salesId: lead.salesId,
        status: waStatus, // INIT | PENDING_QR | CONNECTED | DISCONNECTED | ERROR
      },
    },
  });
}

function computeProfileCompletion(lead: any): number {
  let total = 0;
  let filled = 0;

  const check = (v: any) => {
    total++;
    if (v !== null && v !== undefined && String(v).trim() !== "") filled++;
  };

  check(lead.name);
  check(lead.phone);
  check(lead.address);
  check(lead.productId);
  check(lead.sourceId);
  check(lead.statusId);
  check(lead.stageId);

  for (const cv of lead.customValues ?? []) check(cv.value);

  if (!total) return 0;
  return Math.round((filled / total) * 100);
}
