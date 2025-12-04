import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
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

    // untuk sekarang: hanya halaman sales → list lead milik dia sendiri
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
    const statusCodeParam = searchParams.get("status")?.trim().toUpperCase(); // contoh: HOT, WARM, COLD

    const where: any = {
      salesId: currentUser.id,
    };

    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { product: { name: { contains: q } } },
          ],
        },
      ];
    }

    if (statusCodeParam && statusCodeParam !== "ALL") {
      where.AND = (where.AND || []).concat({
        status: {
          code: statusCodeParam,
        },
      });
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        product: true,
        source: true,
        status: true,
        followUps: {
          orderBy: {
            doneAt: "desc",
          },
          take: 1,
          include: {
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = leads.map((lead) => {
      const latestFU = lead.followUps[0];

      return {
        id: lead.id,
        name: lead.name,
        productName: lead.product?.name ?? null,
        sourceName: lead.source?.name ?? null,
        statusCode: lead.status?.code ?? null, // COLD/WARM/HOT/...
        statusName: lead.status?.name ?? null,
        createdAt: lead.createdAt.toISOString(),
        nextActionAt: latestFU?.nextActionAt
          ? latestFU.nextActionAt.toISOString()
          : null,
        followUpTypeName: latestFU?.type?.name ?? null,
        followUpTypeCode: latestFU?.type?.code ?? null,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/leads error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil daftar lead" },
      { status: 500 }
    );
  }
}

// =================== POST: buat lead baru (sudah pernah kita buat) ===================

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
        {
          ok: false,
          message: "Hanya sales yang boleh menambahkan lead",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const address = body?.address ? String(body.address) : null;
    const phone = body?.phone ? String(body.phone) : null;
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

    // default Tahap: Kontak Awal
    const defaultStage = await prisma.leadStage.findFirst({
      where: {
        isActive: true,
        OR: [
          { code: "KONTAK_AWAL" },
          { name: { equals: "Kontak Awal" } },
        ],
      },
      orderBy: { order: "asc" },
    });

    // default Status: New
    const defaultStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [
          { code: "NEW" },
          { name: { equals: "Baru" } },
        ],
      },
      orderBy: { order: "asc" },
    });

    const lead = await prisma.lead.create({
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
