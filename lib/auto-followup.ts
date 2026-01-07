import { Prisma } from "@prisma/client";

const DAY = 24 * 60 * 60 * 1000;

export async function createAutoFollowUps(params: {
  tx: Prisma.TransactionClient;
  leadId: number;
  salesId: number;
  startAt: Date;
}): Promise<boolean> {
  const { tx, leadId, salesId, startAt } = params;

  // cek sudah ada atau tidak biar tidak duplicate
  const exists = await tx.leadFollowUp.findFirst({
    where: { leadId },
    select: { id: true },
  });

  if (exists) {
    console.log("[auto-fu] skip, follow up already exists for lead", leadId);
    return false;
  }

  // ambil tipe FU berurutan
  const types = await tx.leadFollowUpType.findMany({
    where: {
      code: { in: ["FU1", "FU2", "FU3"] },
      isActive: true,
    },
    orderBy: { order: "asc" },
  });

  if (types.length === 0) return false;

  // mapping delay hari
  const delaysInDays: Record<string, number> = {
    FU1: 1,
    FU2: 3,
    FU3: 6,
  };

  let cursorDate = new Date(startAt);

  for (const type of types) {
    const delayDays = delaysInDays[type.code];
    if (!delayDays) continue;

    cursorDate = new Date(cursorDate.getTime() + delayDays * DAY);

    await tx.leadFollowUp.create({
      data: {
        leadId,
        salesId,
        typeId: type.id,
        nextActionAt: cursorDate,
        isAutoNurturing: false,
        channel: "WHATSAPP",
      },
    });
  }

  return true;
}
