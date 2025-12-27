import { prisma } from "../lib/prisma";

const BATCH_SIZE = 200;

async function backfillLastMessage() {
  console.log("🚀 Starting backfill lastMessageAt...");

  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;

  while (true) {
    const leads = await prisma.lead.findMany({
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
      select: {
        id: true,
        lastMessageAt: true,
      },
    });

    if (leads.length === 0) break;

    for (const lead of leads) {
      const lastMessage = await prisma.leadMessage.findFirst({
        where: { leadId: lead.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (
        lastMessage &&
        (!lead.lastMessageAt ||
          lead.lastMessageAt.getTime() !== lastMessage.createdAt.getTime())
      ) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            lastMessageAt: lastMessage.createdAt,
          },
        });
        totalUpdated++;
      }
    }

    totalProcessed += leads.length;
    console.log(
      `✅ Processed ${totalProcessed} leads | Updated ${totalUpdated}`
    );

    offset += BATCH_SIZE;
  }

  console.log("🎉 Backfill completed successfully!");
  await prisma.$disconnect();
}

backfillLastMessage().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
