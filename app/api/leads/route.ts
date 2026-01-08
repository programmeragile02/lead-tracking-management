import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";
import {
  pickPlanForLead,
  getFirstStepDelayHours,
} from "@/lib/nurturing-assign";
import { createAutoFollowUps } from "@/lib/auto-followup";

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

function getMonthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;

  const start = new Date(y, m - 1, 1, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0);

  return { start, end };
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

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusCodeParam = searchParams.get("status")?.trim().toUpperCase();
    const subStatusCodeParam = searchParams
      .get("subStatus")
      ?.trim()
      .toUpperCase();
    const stageIdParam = searchParams.get("stageId");

    const teamLeaderIdParam = searchParams.get("teamLeaderId");
    const salesIdParam = searchParams.get("salesId");

    const sortParam = searchParams.get("sort"); // "created" | "last_chat" | "unreplied"

    const teamLeaderId = teamLeaderIdParam ? Number(teamLeaderIdParam) : null;

    const salesId = salesIdParam ? Number(salesIdParam) : null;

    const monthParam = searchParams.get("month"); // "YYYY-MM"

    const pageParam = searchParams.get("page");
    const page = Math.max(1, Number(pageParam || 1) || 1);
    const pageSize = 15;

    const baseWhere: any = {};

    // ====================
    // ROLE VISIBILITY
    // ====================
    if (currentUser.roleSlug === "sales") {
      baseWhere.salesId = currentUser.id;
    }

    if (currentUser.roleSlug === "team-leader") {
      baseWhere.sales = {
        teamLeaderId: currentUser.id,
      };

      if (salesId) {
        baseWhere.salesId = salesId;
      }
    }

    if (currentUser.roleSlug === "manager") {
      if (teamLeaderId) {
        baseWhere.sales = {
          teamLeaderId,
        };
      }

      if (salesId) {
        baseWhere.salesId = salesId;
      }
    }

    if (monthParam) {
      const range = getMonthRange(monthParam);
      if (range) {
        baseWhere.createdAt = {
          gte: range.start,
          lt: range.end,
        };
      }
    }

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

    if (subStatusCodeParam && subStatusCodeParam !== "ALL") {
      leadsWhere.AND = (leadsWhere.AND || []).concat({
        subStatus: { code: subStatusCodeParam },
      });
    }

    if (stageIdParam && stageIdParam !== "ALL") {
      leadsWhere.AND = [
        ...(leadsWhere.AND || []),
        { stageId: Number(stageIdParam) },
      ];
    }

    const skip = (page - 1) * pageSize;

    let orderBy: any[] = [];

    if (sortParam === "last_chat") {
      orderBy.push({ lastMessageAt: "desc" }, { createdAt: "desc" });
    } else {
      orderBy.push({ createdAt: "desc" });
    }

    if (sortParam === "unreplied") {
      orderBy = [
        {
          lastInboundAt: "desc",
        },
        {
          lastOutboundAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ];
    }

    const baseCountWhere: any = {
      isExcluded: false,
    };

    // role filter
    if (currentUser.roleSlug === "sales") {
      baseCountWhere.salesId = currentUser.id;
    }

    if (currentUser.roleSlug === "team-leader") {
      baseCountWhere.sales = { teamLeaderId: currentUser.id };
    }

    if (currentUser.roleSlug === "manager") {
      if (teamLeaderId) {
        baseCountWhere.sales = { teamLeaderId };
      }
      if (salesId) {
        baseCountWhere.salesId = salesId;
      }
    }

    // filter bulan (boleh dipakai juga di badge)
    if (monthParam) {
      const range = getMonthRange(monthParam);
      if (range) {
        baseCountWhere.createdAt = {
          gte: range.start,
          lt: range.end,
        };
      }
    }

    const leads = await prisma.lead.findMany({
      where: {
        ...leadsWhere,
        isExcluded: false,
      },
      include: {
        product: true,
        source: true,
        status: true,
        nurturingState: true,
        sales: {
          select: {
            id: true,
            name: true,
            teamLeader: {
              select: {
                name: true,
              },
            },
          },
        },
        followUps: {
          where: { doneAt: null, nextActionAt: { not: null } },
          orderBy: { nextActionAt: "asc" },
          take: 1,
          include: { type: true },
        },
        leadNotes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy,
      skip,
      take: pageSize + 1,
    });

    const hasNext = leads.length > pageSize;
    const leadsPage = hasNext ? leads.slice(0, pageSize) : leads;

    // badge counts
    const grouped = await prisma.lead.groupBy({
      where: baseCountWhere,
      by: ["statusId"],
      _count: { _all: true },
    });

    const groupedSubStatus = await prisma.lead.groupBy({
      where: {
        ...baseCountWhere,
        ...(statusCodeParam && statusCodeParam !== "ALL"
          ? { status: { code: statusCodeParam } }
          : {}),
      },
      by: ["subStatusId"],
      _count: { _all: true },
    });

    const statusIds = grouped
      .map((g) => g.statusId)
      .filter((id): id is number => id !== null);

    const statusList = statusIds.length
      ? await prisma.leadStatus.findMany({ where: { id: { in: statusIds } } })
      : [];

    const subStatusIds = groupedSubStatus
      .map((g) => g.subStatusId)
      .filter((id): id is number => id !== null);

    const subStatuses = subStatusIds.length
      ? await prisma.leadSubStatus.findMany({
          where: { id: { in: subStatusIds } },
        })
      : [];

    const subStatusMap = new Map<number, string>();
    for (const ss of subStatuses) {
      subStatusMap.set(ss.id, ss.code);
    }

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

    const countsBySubStatusCode: Record<string, number> = {};

    for (const g of groupedSubStatus) {
      if (!g.subStatusId) continue;
      const code = subStatusMap.get(g.subStatusId);
      if (code) {
        countsBySubStatusCode[code] =
          (countsBySubStatusCode[code] || 0) + g._count._all;
      }
    }

    const totalCount = await prisma.lead.count({
      where: {
        ...leadsWhere,
        isExcluded: false,
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const data = leadsPage.map((lead) => {
      const latestFU = lead.followUps[0];
      const nurturingEnabled =
        lead.nurturingState?.status === NurturingStatus.ACTIVE;

      // chat lead belum dibalas
      const isUnreplied =
        lead.lastInboundAt &&
        (!lead.lastOutboundAt ||
          new Date(lead.lastInboundAt) > new Date(lead.lastOutboundAt));

      const lastNote = lead.leadNotes?.[0]
        ? {
            content: lead.leadNotes[0].content,
            authorName: lead.leadNotes[0].author.name,
            createdAt: lead.leadNotes[0].createdAt.toISOString(),
          }
        : null;

      return {
        id: lead.id,
        name: lead.name,
        salesName: lead.sales?.name ?? null,
        teamLeaderName: lead.sales?.teamLeader?.name ?? null,
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
        isUnreplied,
        lastNote,
      };
    });

    return NextResponse.json({
      ok: true,
      data,
      countsByStatusCode,
      countsBySubStatusCode,
      page,
      pageSize,
      hasNext,
      totalCount,
      totalPages,
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

    // ============================
    // PRE-COMPUTE NURTURING PLAN
    // ============================
    const plan = await pickPlanForLead({
      productId,
      sourceId,
      statusCode: defaultStatus?.code ?? null,
    });

    let firstDelayHours: number | null = null;
    if (plan) {
      firstDelayHours = await getFirstStepDelayHours(plan.id);
    }

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

      // auto follow up
      const autoFUCreated = await createAutoFollowUps({
        tx,
        leadId: createdLead.id,
        salesId: currentUser.id,
        startAt: createdLead.createdAt,
      });

      if (autoFUCreated) {
        await tx.leadActivity.create({
          data: {
            leadId: createdLead.id,
            title: "Auto Follow Up dibuat",
            description:
              "FU1 (+1 hari), FU2 (+3 hari dari FU1), FU3 (+6 hari dari FU2)",
            happenedAt: new Date(),
            createdById: currentUser.id,
          },
        });
      }

      // state default: ACTIVE (auto start)
      await tx.leadNurturingState.create({
        data: {
          leadId: createdLead.id,
          status: NurturingStatus.ACTIVE,
          manualPaused: false,
          currentStep: 0,
          startedAt: now,
          nextSendAt:
            plan && firstDelayHours != null
              ? new Date(now.getTime() + firstDelayHours * 60 * 60 * 1000)
              : null,
          planId: plan?.id ?? null,
        } as any,
      });

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
