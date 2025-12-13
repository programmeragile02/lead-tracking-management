import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "link";
}

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function generateUniqueCode() {
  for (let i = 0; i < 6; i++) {
    const code = randomCode(6);
    const exists = await prisma.leadTrackedLink.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return randomCode(10);
}

export async function createTrackedLink(params: {
  leadId: number;
  salesId: number;
  leadMessageId?: number | null;
  kind?: "DEMO" | "TESTIMONIAL" | "EDUCATION" | "FILE" | "OTHER";
  label?: string | null;
  targetUrl: string;
  productId?: number | null;
  planId?: number | null;
  stepOrder?: number | null;
}) {
  const slugBase = slugify(params.label || "link");
  const code = await generateUniqueCode();

  const row = await prisma.leadTrackedLink.create({
    data: {
      leadId: params.leadId,
      salesId: params.salesId,
      leadMessageId: params.leadMessageId ?? null,
      kind: (params.kind as any) ?? "OTHER",
      slug: slugBase,
      code,
      label: params.label ?? null,
      targetUrl: params.targetUrl,
      productId: params.productId ?? null,
      planId: params.planId ?? null,
      stepOrder: params.stepOrder ?? null,
    } as any,
    select: { slug: true, code: true },
  });

  return row;
}

export function buildGoUrl(baseUrl: string, slug: string, code: string) {
  return new URL(`/go/${slug}-${code}`, baseUrl).toString();
}
