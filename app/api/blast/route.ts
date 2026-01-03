import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, filters } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!filters?.status || filters.status === "ALL") {
      return NextResponse.json(
        { ok: false, error: "Status harus dipilih" },
        { status: 400 }
      );
    }

    if (!filters?.subStatus || filters.subStatus === "ALL") {
      return NextResponse.json(
        { ok: false, error: "Sub status harus dipilih" },
        { status: 400 }
      );
    }

    // ===============================
    // BUILD FILTER QUERY
    // ===============================
    const cleanFilters = {
      status: filters.status !== "ALL" ? filters.status : null,
      subStatus: filters.subStatus !== "ALL" ? filters.subStatus : null,
      stage: filters.stage !== "ALL" ? Number(filters.stage) : null,
    };

    const where: any = {
      isExcluded: false,
    };

    if (cleanFilters.status) {
      where.status = { code: cleanFilters.status };
    }

    if (cleanFilters.subStatus) {
      where.subStatus = { code: cleanFilters.subStatus };
    }

    if (cleanFilters.stage) {
      where.stageId = cleanFilters.stage;
    }

    if (user.roleCode === "SALES") {
      where.salesId = user.id;
    }

    // =============================
    // 2. Ambil lead
    // =============================
    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tidak ada lead yang cocok dengan filter tersebut",
        },
        { status: 400 }
      );
    }

    // =============================
    // 3. Buat job (Transaction)
    // =============================
    const job = await prisma.$transaction(async (tx) => {
      const createdJob = await tx.leadBlastJob.create({
        data: {
          createdById: user.id,
          message,
          total: leads.length,
          status: "PENDING",
        },
      });

      // =============================
      // 4. Insert item (bulk)
      // =============================
      await tx.leadBlastItem.createMany({
        data: leads.map((lead) => ({
          jobId: createdJob.id,
          leadId: lead.id,
        })),
      });

      return createdJob;
    });

    console.log("[BLAST] job created", {
      jobId: job.id,
      total: leads.length,
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      total: leads.length,
    });
  } catch (err: any) {
    console.error("[BLAST_CREATE_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
