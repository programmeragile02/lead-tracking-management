import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ====== CONFIG ======
const BATCH_SIZE = 300; // aman untuk production
const DRY_RUN = true; // ubah ke false untuk eksekusi real
const ONLY_WRONG = true; // hanya update yang salah arah
// ====================

function normalize(phone?: string | null) {
  if (!phone) return null;
  return phone.replace(/[^\d]/g, "");
}

async function main() {
  console.log("🚀 Starting WA direction fix");
  console.log("DRY_RUN:", DRY_RUN);
  console.log("BATCH:", BATCH_SIZE);

  let offset = 0;
  let fixed = 0;
  let skipped = 0;
  let scanned = 0;

  while (true) {
    const messages = await prisma.leadMessage.findMany({
      where: {
        channel: "WHATSAPP",
      },
      include: {
        sales: {
          include: {
            whatsappSession: true,
          },
        },
      },
      orderBy: { id: "asc" },
      skip: offset,
      take: BATCH_SIZE,
    });

    if (messages.length === 0) break;

    for (const msg of messages) {
      scanned++;

      const salesPhone = normalize(msg.sales?.whatsappSession?.phoneNumber);

      if (!salesPhone) {
        skipped++;
        continue;
      }

      const from = normalize(msg.fromNumber);
      const to = normalize(msg.toNumber);

      if (!from || !to) {
        skipped++;
        continue;
      }

      let expectedDirection: "INBOUND" | "OUTBOUND" | null = null;

      if (from === salesPhone) {
        expectedDirection = "OUTBOUND";
      } else if (to === salesPhone) {
        expectedDirection = "INBOUND";
      }

      if (!expectedDirection) {
        skipped++;
        continue;
      }

      if (msg.direction === expectedDirection) {
        continue; // sudah benar
      }

      if (!DRY_RUN) {
        await prisma.leadMessage.update({
          where: { id: msg.id },
          data: {
            direction: expectedDirection,
          },
        });
      }

      fixed++;
    }

    offset += BATCH_SIZE;
    console.log(`Processed ${offset} messages...`);
  }

  console.log("===================================");
  console.log("✅ DONE");
  console.log("Scanned :", scanned);
  console.log("Fixed   :", fixed);
  console.log("Skipped :", skipped);
  console.log("===================================");
}

main()
  .catch((err) => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
