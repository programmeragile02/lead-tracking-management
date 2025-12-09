// import { prisma } from "@/lib/prisma";
// import {
//   Lead,
//   User,
//   Product,
//   LeadMessageChannel,
//   MessageDirection,
//   LeadMessageType,
//   FollowUpChannel,
//   NurturingStatus,
// } from "@prisma/client";

// import { ensureWaClient, sendWaMessage } from "@/lib/whatsapp-service";

// // ==== helper multi-link product ====
// type ProductLinkItem = {
//   label?: string | null;
//   url?: string | null;
// };

// function buildLinkBlock(raw: any): string {
//   if (!raw) return "";

//   let arr: ProductLinkItem[] = [];

//   try {
//     if (Array.isArray(raw)) {
//       arr = raw as ProductLinkItem[];
//     } else {
//       arr = [];
//     }
//   } catch {
//     return "";
//   }

//   const clean = arr
//     .map((i) => ({
//       label: (i.label ?? "").toString().trim() || "Link",
//       url: (i.url ?? "").toString().trim(),
//     }))
//     .filter((i) => i.url);

//   if (!clean.length) return "";

//   return clean.map((item) => `• ${item.label}\n${item.url}`).join("\n\n");
// }

// // Render template: {{nama_lead}}, {{nama_sales}}, {{produk}}, {{brand}}, dll
// function renderTemplate(
//   template: string | null | undefined,
//   vars: Record<string, string | null | undefined>
// ): string {
//   if (!template) return "";
//   return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
//     const v = vars[key.trim()];
//     return (v ?? "").toString();
//   });
// }

// type LeadWithRelations = Lead & {
//   sales?: (User & { whatsappSession?: any | null }) | null;
//   product?: Product | null;
// };

// /**
//  * Kirim FU1 otomatis saat lead baru dibuat (kalau FU1 dikonfigurasi di master).
//  * - baca FollowUpType FU1 dari DB
//  * - render template
//  * - kirim WA via WA service (pakai userId = salesId)
//  * - catat LeadFollowUp + LeadMessage
//  * - update state nurturing di Lead
//  */
// export async function sendFirstNurturingForNewLead(leadId: number) {
//   // 0. baca general setting dulu
//   const general = await prisma.generalSetting.findFirst({ where: { id: 1 } });
//   if (general && !general.autoNurturingEnabled) {
//     console.log("[NURTURING] autoNurturingEnabled = false, skip FU1.");
//     return;
//   }

//   const perusahaanName = general?.companyName || "Perusahaan Kami";

//   // 1. Ambil lead + sales + product + WA session (kalau perlu)
//   const lead = (await prisma.lead.findUnique({
//     where: { id: leadId },
//     include: {
//       sales: {
//         include: {
//           whatsappSession: true,
//         },
//       },
//       product: true,
//     },
//   })) as LeadWithRelations | null;

//   if (!lead) return;

//   // 2. Cari config FU1 di master tindak lanjut
//   const fo1 = await prisma.leadFollowUpType.findFirst({
//     where: {
//       deletedAt: null,
//       isActive: true,
//       isNurturingStep: true,
//       nurturingOrder: 1,
//       autoOnLeadCreate: true,
//     },
//   });

//   if (!fo1) {
//     console.log(
//       "[NURTURING] FU1 tidak dikonfigurasi (isNurturingStep=1, order=1, autoOnLeadCreate=1), skip."
//     );
//     return;
//   }

//   // Kalau tidak ada nomor telepon lead, kita tidak bisa kirim WA
//   if (!lead.phone) {
//     console.warn(
//       `[NURTURING] Lead ${lead.id} tidak punya nomor telepon, skip kirim FU1 WA.`
//     );
//     return;
//   }

//   // 3. Tentukan WA client userId (pakai salesId)
//   const waUserId = lead.salesId ?? null;
//   if (!waUserId) {
//     console.warn(
//       `[NURTURING] Lead ${lead.id} belum punya salesId, skip kirim FU1 WA.`
//     );
//     return;
//   }

//   const now = new Date();

//   // 4. Render isi pesan dari template FU1
//   const demoBlock = buildLinkBlock(lead.product?.demoLinks);
//   const testiBlock = buildLinkBlock(lead.product?.testimonialLinks);
//   const edukasiBlock = buildLinkBlock(lead.product?.educationLinks);

//   const messageContent = renderTemplate(fo1.waTemplateBody, {
//     nama_lead: lead.name,
//     nama_sales: lead.sales?.name,
//     produk: lead.product?.name,
//     perusahaan: perusahaanName,
//     video_demo_links: demoBlock,
//     testimoni_links: testiBlock,
//     edukasi_links: edukasiBlock,
//   });

//   let waMessageId: string | null = null;
//   let waChatId: string | null = null;
//   let fromNumber: string | null = null;

//   // 5. Kirim WA via WA service kalau memungkinkan
//   if (waUserId && lead.phone && messageContent) {
//     const toNumber = lead.phone.replace(/[^0-9]/g, ""); // normalisasi simpel
//     try {
//       // Pastikan WA client jalan (idempotent di service)
//       await ensureWaClient(waUserId);

//       const result = await sendWaMessage({
//         userId: waUserId,
//         to: toNumber,
//         body: messageContent,
//       });

//       waMessageId = result.waMessageId ?? null;
//       // kalau service kamu mengembalikan meta.chatId, bisa dipakai:
//       // @ts-ignore
//       waChatId = result.meta?.chatId ?? null;
//       fromNumber = lead.sales?.whatsappSession?.phoneNumber ?? null;
//     } catch (err) {
//       console.error(
//         `[NURTURING] Gagal kirim FU1 WA untuk lead ${lead.id}:`,
//         err
//       );
//       return;
//     }
//   }

//   // 6. Follow up + message + state dalam 1 transaction biar konsisten
//   await prisma.$transaction(async (tx) => {
//     await tx.leadFollowUp.create({
//       data: {
//         leadId: lead.id,
//         salesId: lead.salesId,
//         typeId: fo1.id,
//         note: "Pesan Otomatis Nurturing",
//         channel: FollowUpChannel.WHATSAPP,
//         doneAt: now,
//         isAutoNurturing: true,
//       },
//     });

//     await tx.leadMessage.create({
//       data: {
//         leadId: lead.id,
//         salesId: lead.salesId,
//         channel: LeadMessageChannel.WHATSAPP,
//         direction: MessageDirection.OUTBOUND,
//         content: messageContent,
//         type: LeadMessageType.TEXT,
//         sentAt: now,
//         fromNumber,
//         toNumber: lead.phone ?? null,
//         waMessageId,
//         waChatId,
//       },
//     });

//     await tx.lead.update({
//       where: { id: lead.id },
//       data: {
//         nurturingStatus: NurturingStatus.ACTIVE,
//         nurturingCurrentStep: fo1.nurturingOrder ?? 1,
//         nurturingLastSentAt: now,
//         nurturingStartedAt: lead.nurturingStartedAt ?? now,
//         nurturingPausedAt: null, // start fresh
//       },
//     });
//   });
// }
