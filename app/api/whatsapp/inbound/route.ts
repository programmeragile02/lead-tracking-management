// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// const WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

// function normalizeWaNumber(raw?: string | null): string | null {
//   if (!raw) return null;
//   return raw.replace(/@.*/, "");
// }

// export async function POST(req: NextRequest) {
//   if (WEBHOOK_KEY) {
//     const headerKey = req.headers.get("x-wa-webhook-key");
//     if (headerKey !== WEBHOOK_KEY) {
//       return NextResponse.json(
//         { ok: false, error: "invalid_webhook_key" },
//         { status: 401 }
//       );
//     }
//   }

//   const payload = await req.json();
//   const { userId, from, to, body, timestamp, waMessageId, waChatId } = payload;

//   if (!userId || !from || !to || !body) {
//     return NextResponse.json(
//       { ok: false, error: "missing_fields" },
//       { status: 400 }
//     );
//   }

//   const salesId = Number(userId);
//   const fromNumber = normalizeWaNumber(from);
//   const toNumber = normalizeWaNumber(to);

//   if (!fromNumber || !toNumber) {
//     return NextResponse.json(
//       { ok: false, error: "invalid_numbers" },
//       { status: 400 }
//     );
//   }

//   try {
//     // 1. cek apakah pengirim adalah sales lain (punya WA session) atau phone user
//     const fromIsSalesSession = await prisma.whatsAppSession.findFirst({
//       where: { phoneNumber: fromNumber },
//     });

//     const fromIsSalesUser = await prisma.user.findFirst({
//       where: { phone: fromNumber },
//       select: { id: true },
//     });

//     if (fromIsSalesSession || fromIsSalesUser) {
//       console.log(
//         "[inbound] message from another sales, skip auto lead",
//         fromNumber
//       );
//       return NextResponse.json({ ok: true, skipped: "from_is_sales" });
//     }

//     // 2. pastikan sales pemilik client ada
//     const sales = await prisma.user.findUnique({
//       where: { id: salesId },
//     });

//     if (!sales) {
//       console.warn("[inbound] sales not found:", salesId);
//       return NextResponse.json(
//         { ok: false, error: "sales_not_found" },
//         { status: 404 }
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

//     // 3. cari lead berdasarkan nomor pengirim + sales
//     let lead = await prisma.lead.findFirst({
//       where: {
//         phone: fromNumber,
//         salesId: sales.id,
//       },
//     });

//     // 4. kalau belum ada, buat lead baru dari WA
//     if (!lead) {
//       const waSource = await prisma.leadSource.findFirst({
//         where: { code: "WHATSAPP" },
//       });

//       lead = await prisma.lead.create({
//         data: {
//           name: `Lead WhatsApp ${fromNumber}`,
//           phone: fromNumber,
//           stageId: defaultStage?.id ?? null,
//           statusId: defaultStatus?.id ?? null,
//           salesId: sales.id,
//           sourceId: waSource?.id,
//         },
//       });

//       console.log("[inbound] lead created from WA:", lead.id, fromNumber);
//     }

//     // 5. simpan ke LeadMessage
//     const sentAt =
//       timestamp != null ? new Date(Number(timestamp) * 1000) : new Date();

//     await prisma.leadMessage.create({
//       data: {
//         leadId: lead.id,
//         salesId: sales.id,
//         channel: "WHATSAPP",
//         direction: "INBOUND",
//         waMessageId: waMessageId || null,
//         waChatId: waChatId || null,
//         fromNumber,
//         toNumber,
//         content: body,
//         sentAt,
//       },
//     });

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("[inbound] error:", err);
//     return NextResponse.json(
//       { ok: false, error: "server_error" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFirstNurturingForNewLead } from "@/lib/nurturing";
import { NurturingStatus } from "@prisma/client";

const WEBHOOK_KEY = process.env.WA_WEBHOOK_KEY || "";

function normalizeWaNumber(raw?: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/@.*/, "");
}

export async function POST(req: NextRequest) {
  if (WEBHOOK_KEY) {
    const headerKey = req.headers.get("x-wa-webhook-key");
    if (headerKey !== WEBHOOK_KEY) {
      return NextResponse.json(
        { ok: false, error: "invalid_webhook_key" },
        { status: 401 }
      );
    }
  }

  const payload = await req.json();
  const { userId, from, to, body, timestamp, waMessageId, waChatId } = payload;

  if (!userId || !from || !to || !body) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const salesId = Number(userId);
  const fromNumber = normalizeWaNumber(from);
  const toNumber = normalizeWaNumber(to);

  if (!fromNumber || !toNumber) {
    return NextResponse.json(
      { ok: false, error: "invalid_numbers" },
      { status: 400 }
    );
  }

  try {
    // 1. cek apakah pengirim adalah sales lain (punya WA session) atau phone user
    const fromIsSalesSession = await prisma.whatsAppSession.findFirst({
      where: { phoneNumber: fromNumber },
    });

    const fromIsSalesUser = await prisma.user.findFirst({
      where: { phone: fromNumber },
      select: { id: true },
    });

    if (fromIsSalesSession || fromIsSalesUser) {
      console.log(
        "[inbound] message from another sales, skip auto lead",
        fromNumber
      );
      return NextResponse.json({ ok: true, skipped: "from_is_sales" });
    }

    // 2. pastikan sales pemilik client ada
    const sales = await prisma.user.findUnique({
      where: { id: salesId },
    });

    if (!sales) {
      console.warn("[inbound] sales not found:", salesId);
      return NextResponse.json(
        { ok: false, error: "sales_not_found" },
        { status: 404 }
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

    // optional: cari status Warm (kalau mau auto naikkan status)
    const warmStatus = await prisma.leadStatus.findFirst({
      where: {
        isActive: true,
        OR: [{ code: "WARM" }, { name: { equals: "Warm" } }],
      },
    });

    // 3. cari lead berdasarkan nomor pengirim + sales
    let lead = await prisma.lead.findFirst({
      where: {
        phone: fromNumber,
        salesId: sales.id,
      },
    });

    let isNewLead = false;

    // 4. kalau belum ada, buat lead baru dari WA
    if (!lead) {
      const waSource = await prisma.leadSource.findFirst({
        where: { code: "WHATSAPP" },
      });

      lead = await prisma.lead.create({
        data: {
          name: `Lead WhatsApp ${fromNumber}`,
          phone: fromNumber,
          stageId: defaultStage?.id ?? null,
          statusId: defaultStatus?.id ?? null,
          salesId: sales.id,
          sourceId: waSource?.id ?? null,
          // nurturing: untuk lead dari WA, kita bisa langsung anggap engage,
          // nanti FO1 akan mengonfirmasi dan nurturingStatus akan di-set di helper
        },
      });

      isNewLead = true;

      console.log("[inbound] lead created from WA:", lead.id, fromNumber);
    }

    if (!lead) {
      // antisipasi saja, mestinya tidak mungkin masuk sini
      return NextResponse.json(
        { ok: false, error: "lead_not_found" },
        { status: 500 }
      );
    }

    // 5. simpan ke LeadMessage
    const sentAt =
      timestamp != null ? new Date(Number(timestamp) * 1000) : new Date();

    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        salesId: sales.id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        waMessageId: waMessageId || null,
        waChatId: waChatId || null,
        fromNumber,
        toNumber,
        content: body,
        sentAt,
      },
    });

    // 6. Treat inbound as engagement → boleh auto naikkan status & pause nurturing
    try {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          // kalau sebelumnya NEW/COLD dan ada status Warm, naikkan jadi Warm
          statusId: warmStatus?.id ?? lead.statusId,
          // kalau lagi ada sequence nurturing aktif, otomatis pause
          nurturingStatus: NurturingStatus.PAUSED,
        },
      });
    } catch (e) {
      console.warn("[inbound] gagal update status/nurturing lead:", e);
    }

    // 7. Kalau lead baru diciptakan dari WA → kirim FO1 auto (sambutan)
    if (isNewLead) {
      try {
        await sendFirstNurturingForNewLead(lead.id);
      } catch (e) {
        console.error(
          "[inbound] gagal menjalankan FO1 nurturing untuk lead baru:",
          e
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound] error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
