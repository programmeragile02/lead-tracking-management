import { prisma } from "@/lib/prisma";
import { ensureWaClient, fetchWaHistory } from "@/lib/whatsapp-service";
import { LeadMessageChannel, MessageDirection } from "@prisma/client";

export async function syncSingleLead(leadId: number) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      phone: true,
      salesId: true,
      isExcluded: true,
    },
  });

  if (!lead || !lead.phone || lead.isExcluded) {
    throw new Error("Lead tidak valid");
  }

  const waUserId = lead.salesId;
  await ensureWaClient(waUserId);

  const peer = lead.phone.replace(/[^\d]/g, "");
  const { data } = await fetchWaHistory({
    userId: waUserId,
    peer,
    limit: 200,
  });

  let inserted = 0;

  for (const msg of data.messages) {
    try {
      await prisma.leadMessage.create({
        data: {
          leadId: lead.id,
          salesId: waUserId,
          channel: "WHATSAPP",
          direction: msg.fromMe ? "OUTBOUND" : "INBOUND",
          waMessageId: msg.waMessageId,
          content: msg.body,
          createdAt: new Date(msg.timestamp * 1000),
        },
      });
      inserted++;
    } catch {
      // duplicate = skip
    }
  }

  return { inserted };
}
