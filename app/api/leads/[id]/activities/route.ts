import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/leads/[id]/activities
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, salesId: true, isExcluded: true },
  });

  if (!lead || lead.isExcluded) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  // kalau role SALES → hanya boleh akses lead-nya sendiri
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { happenedAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    data: activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      happenedAt: a.happenedAt,
      createdAt: a.createdAt,
      photoUrl: a.photoUrl,
      createdBy: a.createdBy
        ? { id: a.createdBy.id, name: a.createdBy.name }
        : null,
    })),
  });
}

// POST /api/leads/[id]/activities
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const leadId = Number(id);
  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid lead id" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, salesId: true, isExcluded: true },
  });

  if (!lead || lead.isExcluded) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  // kalau role SALES → hanya boleh tambah aktivitas di lead-nya sendiri
  if (user.roleSlug === "sales" && lead.salesId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const formData = await req.formData();

  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const time = String(formData.get("time") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const photo = formData.get("photo") as File | null;

  if (!title || !date || !time) {
    return NextResponse.json(
      {
        ok: false,
        error: "Title, date, dan time wajib diisi",
      },
      { status: 400 }
    );
  }

  // gabungkan date + time → Date
  // format input frontend: YYYY-MM-DD dan HH:mm (24 jam)
  const isoString = `${date}T${time}:00`;
  const happenedAt = new Date(isoString);
  if (Number.isNaN(happenedAt.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Format tanggal/jam tidak valid" },
      { status: 400 }
    );
  }

  let photoUrl: string | undefined;

  if (photo && typeof photo.arrayBuffer === "function") {
    try {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "lead-activities"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const ext = photo.name.split(".").pop() || "jpg";
      const fileName = `lead-${leadId}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await photo.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // path untuk diakses dari frontend
      photoUrl = `/uploads/lead-activities/${fileName}`;
    } catch (err) {
      console.error("Failed to save activity photo:", err);
      // kalau gagal simpan foto, tetap lanjut simpan aktivitas tanpa foto
    }
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId,
      title,
      description,
      happenedAt,
      photoUrl,
      createdById: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: activity.id,
    },
  });
}
