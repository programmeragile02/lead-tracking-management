import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: ambil pengaturan umum
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.roleSlug !== "manager") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya manager yang boleh melihat pengaturan ini",
        },
        { status: 403 }
      );
    }

    let setting = await prisma.generalSetting.findUnique({
      where: { id: 1 },
    });

    // kalau belum ada, buat default
    if (!setting) {
      setting = await prisma.generalSetting.create({
        data: {
          id: 1,
          companyName: "Perusahaan Kami",
          autoNurturingEnabled: true,
          maxIdleHoursBeforeResume: 48,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        companyName: setting.companyName,
        autoNurturingEnabled: setting.autoNurturingEnabled,
        maxIdleHoursBeforeResume: setting.maxIdleHoursBeforeResume,
      },
    });
  } catch (err) {
    console.error("GET /api/settings/general error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil pengaturan umum." },
      { status: 500 }
    );
  }
}

// POST: simpan pengaturan umum
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.roleSlug !== "manager") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya manager yang boleh mengubah pengaturan ini",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawCompanyName = String(body.companyName || "").trim();
    const autoNurturingEnabled =
      typeof body.autoNurturingEnabled === "boolean"
        ? body.autoNurturingEnabled
        : true;

    const maxIdleRaw = Number(body.maxIdleHoursBeforeResume);
    const maxIdleHoursBeforeResume =
      !Number.isNaN(maxIdleRaw) && maxIdleRaw > 0 ? maxIdleRaw : 48;

    if (!rawCompanyName) {
      return NextResponse.json(
        { ok: false, message: "Nama perusahaan wajib diisi" },
        { status: 400 }
      );
    }

    const setting = await prisma.generalSetting.upsert({
      where: { id: 1 },
      update: {
        companyName: rawCompanyName,
        autoNurturingEnabled,
        maxIdleHoursBeforeResume,
      },
      create: {
        id: 1,
        companyName: rawCompanyName,
        autoNurturingEnabled,
        maxIdleHoursBeforeResume,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        companyName: setting.companyName,
        autoNurturingEnabled: setting.autoNurturingEnabled,
        maxIdleHoursBeforeResume: setting.maxIdleHoursBeforeResume,
      },
    });
  } catch (err) {
    console.error("POST /api/settings/general error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan pengaturan umum." },
      { status: 500 }
    );
  }
}
