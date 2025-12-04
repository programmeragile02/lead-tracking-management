import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function slugifyKey(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

// GET /api/lead-custom-fields?q=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    const where: Prisma.LeadCustomFieldDefWhereInput = {};

    if (q) {
      where.OR = [
        { label: { contains: q } },
        { key: { contains: q } },
      ];
    }

    const fields = await prisma.leadCustomFieldDef.findMany({
      where,
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ ok: true, data: fields });
  } catch (err) {
    console.error("GET /lead-custom-fields error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil konfigurasi field lead" },
      { status: 500 }
    );
  }
}

// POST /api/lead-custom-fields
// body: { label, key?, type, placeholder?, helpText?, isRequired?, isActive?, options?: [{label,value}] }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawLabel = String(body?.label ?? "").trim();
    const rawKey = String(body?.key ?? "").trim();
    const type = String(body?.type ?? "")
      .trim()
      .toUpperCase();
    const placeholder = body?.placeholder ? String(body.placeholder) : null;
    const helpText = body?.helpText ? String(body.helpText) : null;
    const isRequired = Boolean(body?.isRequired ?? false);
    const isActive = Boolean(body?.isActive ?? true);
    const options = Array.isArray(body?.options) ? body.options : [];

    if (!rawLabel) {
      return NextResponse.json(
        { ok: false, message: "Label field wajib diisi" },
        { status: 400 }
      );
    }
    if (!type) {
      return NextResponse.json(
        { ok: false, message: "Tipe field wajib dipilih" },
        { status: 400 }
      );
    }

    const key = rawKey || slugifyKey(rawLabel);

    // cari sortOrder terbesar, lalu +1
    const last = await prisma.leadCustomFieldDef.findFirst({
      orderBy: { sortOrder: "desc" },
    });
    const nextOrder = (last?.sortOrder ?? 0) + 1;

    const field = await prisma.leadCustomFieldDef.create({
      data: {
        label: rawLabel,
        key,
        type: type as any,
        placeholder,
        helpText,
        isRequired,
        isActive,
        sortOrder: nextOrder,
        options:
          type === "SINGLE_SELECT" || type === "MULTI_SELECT"
            ? {
                create: options.map((opt: any, idx: number) => ({
                  label: String(opt?.label ?? "").trim(),
                  value:
                    String(opt?.value ?? "").trim() ||
                    slugifyKey(opt?.label ?? ""),
                  sortOrder: idx,
                })),
              }
            : undefined,
      },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ ok: true, data: field });
  } catch (err: any) {
    console.error("POST /lead-custom-fields error", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Gagal membuat field lead" },
      { status: 500 }
    );
  }
}
