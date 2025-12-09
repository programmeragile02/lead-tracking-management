// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth-server";
// import { sendFirstNurturingForNewLead } from "@/lib/nurturing";
// import { NurturingStatus } from "@prisma/client";

// function toNumberOrNull(value: any): number | null {
//   if (value === null || value === undefined) return null;
//   const s = String(value).trim();
//   if (!s) return null;
//   const n = Number(s.replace(/,/g, ""));
//   return Number.isNaN(n) ? null : n;
// }

// function normalizePhoneTo62(input: string | null | undefined): string | null {
//   if (!input) return null;

//   // hilangkan spasi, dash, dsb
//   let s = input.trim().replace(/[^\d+]/g, "");

//   // kalau ada + di depan, buang dulu
//   if (s.startsWith("+")) {
//     s = s.slice(1);
//   }

//   // 0812xxxxxx -> 62812xxxxxx
//   if (s.startsWith("0")) {
//     return "62" + s.slice(1);
//   }

//   // sudah 62xxxx -> biarkan
//   if (s.startsWith("62")) {
//     return s;
//   }

//   // kalau format lain (misal 812xxxx), optional mau dipaksa 62 atau dibiarkan
//   // di sini aku pilih dipaksa ke 62xxxx
//   if (/^\d+$/.test(s)) {
//     return "62" + s;
//   }

//   return s;
// }

// type CustomValueInput = {
//   fieldId: number;
//   value: string;
// };

// // =================== GET: daftar lead per sales ===================

// export async function GET(req: NextRequest) {
//   try {
//     const currentUser = await getCurrentUser(req);
//     if (!currentUser) {
//       return NextResponse.json(
//         { ok: false, message: "Belum login" },
//         { status: 401 }
//       );
//     }

//     // untuk sekarang: hanya halaman sales → list lead milik dia sendiri
//     if (currentUser.roleSlug !== "sales") {
//       return NextResponse.json(
//         {
//           ok: false,
//           message: "Hanya sales yang dapat melihat daftar lead di halaman ini",
//         },
//         { status: 403 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const q = searchParams.get("q")?.trim() || "";
//     const statusCodeParam = searchParams.get("status")?.trim().toUpperCase(); // contoh: HOT, WARM, COLD

//     // ---- baseWhere: filter sales + keyword (tanpa status) ----
//     const baseWhere: any = {
//       salesId: currentUser.id,
//     };

//     if (q) {
//       baseWhere.AND = [
//         {
//           OR: [
//             { name: { contains: q } },
//             { phone: { contains: q } },
//             { product: { name: { contains: q } } },
//           ],
//         },
//       ];
//     }

//     // ---- where untuk list lead utama (ikut status pill) ----
//     const leadsWhere: any = { ...baseWhere };

//     if (statusCodeParam && statusCodeParam !== "ALL") {
//       leadsWhere.AND = (leadsWhere.AND || []).concat({
//         status: {
//           code: statusCodeParam,
//         },
//       });
//     }

//     // ---- query utama: list lead sesuai status pill ----
//     const leads = await prisma.lead.findMany({
//       where: leadsWhere,
//       include: {
//         product: true,
//         source: true,
//         status: true,
//         followUps: {
//           orderBy: {
//             doneAt: "desc",
//           },
//           take: 1,
//           include: {
//             type: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // ---- query tambahan: hitung jumlah per status (untuk badge) ----
//     const grouped = await prisma.lead.groupBy({
//       where: baseWhere,
//       by: ["statusId"],
//       _count: { _all: true },
//     });

//     const statusIds = grouped
//       .map((g) => g.statusId)
//       .filter((id): id is number => id !== null);

//     const statusList = statusIds.length
//       ? await prisma.leadStatus.findMany({
//           where: { id: { in: statusIds } },
//         })
//       : [];

//     const statusMapById = new Map<number, string>(); // id → code
//     for (const st of statusList) {
//       statusMapById.set(st.id, st.code.toUpperCase());
//     }

//     const countsByStatusCode: Record<string, number> = {};
//     let totalAll = 0;

//     for (const g of grouped) {
//       const count = g._count._all;
//       totalAll += count;

//       if (g.statusId) {
//         const code = statusMapById.get(g.statusId);
//         if (code) {
//           const key = code.toUpperCase();
//           countsByStatusCode[key] = (countsByStatusCode[key] || 0) + count;
//         }
//       } else {
//         countsByStatusCode["UNASSIGNED"] =
//           (countsByStatusCode["UNASSIGNED"] || 0) + count;
//       }
//     }

//     countsByStatusCode["ALL"] = totalAll;

//     const data = leads.map((lead) => {
//       const latestFU = lead.followUps[0];

//       return {
//         id: lead.id,
//         name: lead.name,
//         productName: lead.product?.name ?? null,
//         sourceName: lead.source?.name ?? null,
//         statusCode: lead.status?.code ?? null,
//         statusName: lead.status?.name ?? null,
//         createdAt: lead.createdAt.toISOString(),
//         nextActionAt: latestFU?.nextActionAt
//           ? latestFU.nextActionAt.toISOString()
//           : null,
//         followUpTypeName: latestFU?.type?.name ?? null,
//         followUpTypeCode: latestFU?.type?.code ?? null,
//       };
//     });

//     return NextResponse.json({
//       ok: true,
//       data,
//       countsByStatusCode,
//     });
//   } catch (err: any) {
//     console.error("GET /api/leads error", err);
//     return NextResponse.json(
//       { ok: false, message: "Gagal mengambil daftar lead" },
//       { status: 500 }
//     );
//   }
// }

// // =================== POST: buat lead baru + auto FO1 ===================

// export async function POST(req: NextRequest) {
//   try {
//     const currentUser = await getCurrentUser(req);
//     if (!currentUser) {
//       return NextResponse.json(
//         { ok: false, message: "Belum login" },
//         { status: 401 }
//       );
//     }

//     if (currentUser.roleSlug !== "sales") {
//       return NextResponse.json(
//         {
//           ok: false,
//           message: "Hanya sales yang boleh menambahkan lead",
//         },
//         { status: 403 }
//       );
//     }

//     const body = await req.json();

//     const name = String(body?.name ?? "").trim();
//     const address = body?.address ? String(body.address) : null;
//     const rawPhone = body?.phone ? String(body.phone) : null;
//     const phone = normalizePhoneTo62(rawPhone);
//     const photoUrl = body?.photoUrl ? String(body.photoUrl) : null;

//     const priceOffering = toNumberOrNull(body?.priceOffering);
//     const priceNegotiation = toNumberOrNull(body?.priceNegotiation);
//     const priceClosing = toNumberOrNull(body?.priceClosing);

//     const productIdRaw = body?.productId;
//     const productId =
//       productIdRaw !== null &&
//       productIdRaw !== undefined &&
//       String(productIdRaw).trim()
//         ? Number(String(productIdRaw).trim())
//         : null;

//     const sourceIdRaw = body?.sourceId;
//     const sourceId =
//       sourceIdRaw !== null &&
//       sourceIdRaw !== undefined &&
//       String(sourceIdRaw).trim()
//         ? Number(String(sourceIdRaw).trim())
//         : null;

//     const customValuesRaw: CustomValueInput[] = Array.isArray(
//       body?.customValues
//     )
//       ? body.customValues
//       : [];

//     if (!name) {
//       return NextResponse.json(
//         { ok: false, message: "Nama lead wajib diisi" },
//         { status: 400 }
//       );
//     }

//     if (!productId) {
//       return NextResponse.json(
//         { ok: false, message: "Produk wajib dipilih" },
//         { status: 400 }
//       );
//     }

//     // default Tahap: Kontak Awal
//     const defaultStage = await prisma.leadStage.findFirst({
//       where: {
//         isActive: true,
//         OR: [{ code: "KONTAK_AWAL" }, { name: { equals: "Kontak Awal" } }],
//       },
//       orderBy: { order: "asc" },
//     });

//     // default Status: New
//     const defaultStatus = await prisma.leadStatus.findFirst({
//       where: {
//         isActive: true,
//         OR: [{ code: "NEW" }, { name: { equals: "Baru" } }],
//       },
//       orderBy: { order: "asc" },
//     });

//     // Lead baru
//     const lead = await prisma.lead.create({
//       data: {
//         name,
//         address,
//         phone,
//         photoUrl,
//         priceOffering: priceOffering as any,
//         priceNegotiation: priceNegotiation as any,
//         priceClosing: priceClosing as any,
//         stageId: defaultStage?.id ?? null,
//         statusId: defaultStatus?.id ?? null,
//         productId,
//         sourceId,
//         salesId: currentUser.id,
//         // nurturingStatus: NurturingStatus.ACTIVE,
//       },
//     });

//     if (customValuesRaw.length > 0) {
//       const dataToInsert = customValuesRaw
//         .filter((cv) => cv && cv.fieldId && typeof cv.value === "string")
//         .map((cv) => ({
//           leadId: lead.id,
//           fieldId: Number(cv.fieldId),
//           value: cv.value,
//         }));

//       if (dataToInsert.length > 0) {
//         await prisma.leadCustomFieldValue.createMany({
//           data: dataToInsert,
//           skipDuplicates: true,
//         });
//       }
//     }

//     // FO1 auto sambutan via WA
//     try {
//       await sendFirstNurturingForNewLead(lead.id);
//     } catch (e) {
//       console.error("[POST /api/leads] Error menjalankan FO1 nurturing:", e);
//       // sengaja tidak di-throw supaya lead tetap berhasil dibuat
//     }

//     return NextResponse.json({ ok: true, data: lead });
//   } catch (err: any) {
//     console.error("POST /api/leads error", err);
//     return NextResponse.json(
//       { ok: false, message: err?.message || "Gagal membuat lead baru" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { NurturingStatus } from "@prisma/client";

function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function normalizePhoneTo62(input: string | null | undefined): string | null {
  if (!input) return null;

  // hilangkan spasi, dash, dsb
  let s = input.trim().replace(/[^\d+]/g, "");

  // kalau ada + di depan, buang dulu
  if (s.startsWith("+")) {
    s = s.slice(1);
  }

  // 0812xxxxxx -> 62812xxxxxx
  if (s.startsWith("0")) {
    return "62" + s.slice(1);
  }

  // sudah 62xxxx -> biarkan
  if (s.startsWith("62")) {
    return s;
  }

  // kalau format lain (misal 812xxxx), optional mau dipaksa 62 atau dibiarkan
  // di sini aku pilih dipaksa ke 62xxxx
  if (/^\d+$/.test(s)) {
    return "62" + s;
  }

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

    // ---- baseWhere: filter sales + keyword (tanpa status) ----
    const baseWhere: any = {
      salesId: currentUser.id,
    };

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

    // ---- where untuk list lead utama (ikut status pill) ----
    const leadsWhere: any = { ...baseWhere };

    if (statusCodeParam && statusCodeParam !== "ALL") {
      leadsWhere.AND = (leadsWhere.AND || []).concat({
        status: {
          code: statusCodeParam,
        },
      });
    }

    // ---- query utama: list lead sesuai status pill ----
    const leads = await prisma.lead.findMany({
      where: leadsWhere,
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

    // ---- query tambahan: hitung jumlah per status (untuk badge) ----
    const grouped = await prisma.lead.groupBy({
      where: baseWhere,
      by: ["statusId"],
      _count: { _all: true },
    });

    const statusIds = grouped
      .map((g) => g.statusId)
      .filter((id): id is number => id !== null);

    const statusList = statusIds.length
      ? await prisma.leadStatus.findMany({
          where: { id: { in: statusIds } },
        })
      : [];

    const statusMapById = new Map<number, string>(); // id → code
    for (const st of statusList) {
      statusMapById.set(st.id, st.code.toUpperCase());
    }

    const countsByStatusCode: Record<string, number> = {};
    let totalAll = 0;

    for (const g of grouped) {
      const count = g._count._all;
      totalAll += count;

      if (g.statusId) {
        const code = statusMapById.get(g.statusId);
        if (code) {
          const key = code.toUpperCase();
          countsByStatusCode[key] = (countsByStatusCode[key] || 0) + count;
        }
      } else {
        countsByStatusCode["UNASSIGNED"] =
          (countsByStatusCode["UNASSIGNED"] || 0) + count;
      }
    }

    countsByStatusCode["ALL"] = totalAll;

    const data = leads.map((lead) => {
      const latestFU = lead.followUps[0];

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
      };
    });

    return NextResponse.json({
      ok: true,
      data,
      countsByStatusCode,
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

    // default Tahap: Kontak Awal
    const defaultStage = await prisma.leadStage.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "KONTAK_AWAL" }, { name: { equals: "Kontak Awal" } }],
      },
      orderBy: { order: "asc" },
    });

    // default Status: New
    const defaultStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "NEW" }, { name: { equals: "Baru" } }],
      },
      orderBy: { order: "asc" },
    });

    const now = new Date();

    // Lead baru → nurturing DI-PAUSE dulu, belum pernah jalan
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
        nurturingStatus: NurturingStatus.PAUSED,
        nurturingCurrentStep: null,
        nurturingLastSentAt: null,
        nurturingStartedAt: null,
        nurturingPausedAt: now,
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
