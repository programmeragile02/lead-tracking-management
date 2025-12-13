import { prisma } from "@/lib/prisma";

// pilih plan paling cocok untuk lead
export async function pickPlanForLead(input: {
  productId: number | null;
  sourceId: number | null;
  statusCode: string | null;
}) {
  const { productId, sourceId, statusCode } = input;

  // prioritas: paling spesifik dulu
  // 1) product + source + status
  // 2) product + source
  // 3) product + status
  // 4) product only
  // 5) default (product null) + source + status
  // 6) default + source
  // 7) default + status
  // 8) default
  const tries: any[] = [
    { productId, sourceId, targetStatusCode: statusCode },
    { productId, sourceId, targetStatusCode: null },
    { productId, sourceId: null, targetStatusCode: statusCode },
    { productId, sourceId: null, targetStatusCode: null },

    { productId: null, sourceId, targetStatusCode: statusCode },
    { productId: null, sourceId, targetStatusCode: null },
    { productId: null, sourceId: null, targetStatusCode: statusCode },
    { productId: null, sourceId: null, targetStatusCode: null },
  ];

  for (const where of tries) {
    // skip kombinasi invalid (mis productId null tapi kita di bagian product specific)
    // (tetap aman walau tidak, tapi lebih rapi)
    if (where.productId === undefined) continue;

    const plan = await prisma.nurturingPlan.findFirst({
      where: {
        isActive: true,
        productId: where.productId ?? null,
        sourceId: where.sourceId ?? null,
        targetStatusCode: where.targetStatusCode ?? null,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    if (plan) return plan;
  }

  return null;
}

export async function getFirstStepDelayHours(planId: number) {
  const first = await prisma.nurturingPlanStep.findFirst({
    where: { planId, isActive: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { delayHours: true },
  });
  return first?.delayHours ?? 24;
}
