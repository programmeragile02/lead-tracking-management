import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";
import {
  pickPlanForLead,
  getFirstStepDelayHours,
} from "@/lib/nurturing-assign";

function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function normalizePhoneTo62(input: string | null | undefined): string | null {
  if (!input) return null;

  let s = input.trim().replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);

  if (s.startsWith("0")) return "62" + s.slice(1);
  if (s.startsWith("62")) return s;

  if (/^\d+$/.test(s)) return "62" + s;

  return s;
}

type CustomValueInput = {
  fieldId: number;
  value: string;
};

// =================== GET: daftar lead per sales ===================

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Belum login" },
        { status: 401 }
      );
    }

    if (currentUser.roleSlug !== "sales") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya sales yang dapat melihat daftar lead di halaman ini",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusCodeParam = searchParams.get("status")?.trim().toUpperCase();

    const pageParam = searchParams.get("page");
    const page = Math.max(1, Number(pageParam || 1) || 1);
    const pageSize = 10;

    const baseWhere: any = { salesId: currentUser.id };

    if (q) {
      baseWhere.AND = [
        {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { product: { name: { contains: q } } },
          ],
        },
      ];
    }

    const leadsWhere: any = { ...baseWhere };

    if (statusCodeParam && statusCodeParam !== "ALL") {
      leadsWhere.AND = (leadsWhere.AND || []).concat({
        status: { code: statusCodeParam },
      });
    }

    const skip = (page - 1) * pageSize;

    const leads = await prisma.lead.findMany({
      where: leadsWhere,
      include: {
        product: true,
        source: true,
        status: true,
        nurturingState: true,
        followUps: {
          where: { doneAt: null, nextActionAt: { not: null } },
          orderBy: { nextActionAt: "desc" },
          take: 1,
          include: { type: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize + 1,
    });

    const hasNext = leads.length > pageSize;
    const leadsPage = hasNext ? leads.slice(0, pageSize) : leads;

    // badge counts
    const grouped = await prisma.lead.groupBy({
      where: baseWhere,
      by: ["statusId"],
      _count: { _all: true },
    });

    const statusIds = grouped
      .map((g) => g.statusId)
      .filter((id): id is number => id !== null);

    const statusList = statusIds.length
      ? await prisma.leadStatus.findMany({ where: { id: { in: statusIds } } })
      : [];

    const statusMapById = new Map<number, string>();
    for (const st of statusList)
      statusMapById.set(st.id, st.code.toUpperCase());

    const countsByStatusCode: Record<string, number> = {};
    let totalAll = 0;

    for (const g of grouped) {
      const count = g._count._all;
      totalAll += count;

      if (g.statusId) {
        const code = statusMapById.get(g.statusId);
        if (code)
          countsByStatusCode[code] = (countsByStatusCode[code] || 0) + count;
      } else {
        countsByStatusCode["UNASSIGNED"] =
          (countsByStatusCode["UNASSIGNED"] || 0) + count;
      }
    }
    countsByStatusCode["ALL"] = totalAll;

    const data = leadsPage.map((lead) => {
      const latestFU = lead.followUps[0];
      const nurturingEnabled =
        lead.nurturingState?.status === NurturingStatus.ACTIVE;

      return {
        id: lead.id,
        name: lead.name,
        productName: lead.product?.name ?? null,
        sourceName: lead.source?.name ?? null,
        statusCode: lead.status?.code ?? null,
        statusName: lead.status?.name ?? null,
        createdAt: lead.createdAt.toISOString(),
        nextActionAt: latestFU?.nextActionAt
          ? latestFU.nextActionAt.toISOString()
          : null,
        followUpTypeName: latestFU?.type?.name ?? null,
        followUpTypeCode: latestFU?.type?.code ?? null,
        nurturingEnabled,
        importedFromExcel: lead.importedFromExcel ?? false,
      };
    });

    return NextResponse.json({
      ok: true,
      data,
      countsByStatusCode,
      page,
      pageSize,
      hasNext,
    });
  } catch (err: any) {
    console.error("GET /api/leads error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil daftar lead" },
      { status: 500 }
    );
  }
}

// =================== POST: buat lead baru ===================

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, message: "Belum login" },
        { status: 401 }
      );
    }

    if (currentUser.roleSlug !== "sales") {
      return NextResponse.json(
        { ok: false, message: "Hanya sales yang boleh menambahkan lead" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const address = body?.address ? String(body.address) : null;
    const rawPhone = body?.phone ? String(body.phone) : null;
    const phone = normalizePhoneTo62(rawPhone);
    const photoUrl = body?.photoUrl ? String(body.photoUrl) : null;

    const priceOffering = toNumberOrNull(body?.priceOffering);
    const priceNegotiation = toNumberOrNull(body?.priceNegotiation);
    const priceClosing = toNumberOrNull(body?.priceClosing);

    const productIdRaw = body?.productId;
    const productId =
      productIdRaw !== null &&
      productIdRaw !== undefined &&
      String(productIdRaw).trim()
        ? Number(String(productIdRaw).trim())
        : null;

    const sourceIdRaw = body?.sourceId;
    const sourceId =
      sourceIdRaw !== null &&
      sourceIdRaw !== undefined &&
      String(sourceIdRaw).trim()
        ? Number(String(sourceIdRaw).trim())
        : null;

    const customValuesRaw: CustomValueInput[] = Array.isArray(
      body?.customValues
    )
      ? body.customValues
      : [];

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama lead wajib diisi" },
        { status: 400 }
      );
    }
    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "Produk wajib dipilih" },
        { status: 400 }
      );
    }

    const defaultStage = await prisma.leadStage.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "KONTAK_AWAL" }, { name: { equals: "Kontak Awal" } }],
      },
      orderBy: { order: "asc" },
    });

    const defaultStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "NEW" }, { name: { equals: "Baru" } }],
      },
      orderBy: { order: "asc" },
    });

    const now = new Date();

    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          name,
          address,
          phone,
          photoUrl,
          priceOffering: priceOffering as any,
          priceNegotiation: priceNegotiation as any,
          priceClosing: priceClosing as any,
          stageId: defaultStage?.id ?? null,
          statusId: defaultStatus?.id ?? null,
          productId,
          sourceId,
          salesId: currentUser.id,
        },
      });

      // state default: ACTIVE (auto start)
      await tx.leadNurturingState.create({
        data: {
          leadId: createdLead.id,
          status: NurturingStatus.ACTIVE,
          manualPaused: false,
          pauseReason: null,
          pausedAt: null,
          currentStep: 0,
          nextSendAt: null,
          startedAt: now,
          lastSentAt: null,
          lastMessageKey: null,
        } as any,
      });

      // ASSIGN PLAN + set nextSendAt (biar siap jalan ketika diaktifkan)
      const plan = await pickPlanForLead({
        productId: createdLead.productId ?? null,
        sourceId: createdLead.sourceId ?? null,
        statusCode: defaultStatus?.code ?? null,
      });

      if (plan) {
        const delay = await getFirstStepDelayHours(plan.id);
        await tx.leadNurturingState.update({
          where: { leadId: createdLead.id },
          data: {
            planId: plan.id,
            nextSendAt: new Date(now.getTime() + delay * 60 * 60 * 1000),
          } as any,
        });
      }

      return createdLead;
    });

    if (customValuesRaw.length > 0) {
      const dataToInsert = customValuesRaw
        .filter((cv) => cv && cv.fieldId && typeof cv.value === "string")
        .map((cv) => ({
          leadId: lead.id,
          fieldId: Number(cv.fieldId),
          value: cv.value,
        }));

      if (dataToInsert.length > 0) {
        await prisma.leadCustomFieldValue.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true, data: lead });
  } catch (err: any) {
    console.error("POST /api/leads error", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal membuat lead baru" },
      { status: 500 }
    );
  }
}
