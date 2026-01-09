import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// default template sambutan WA
const DEFAULT_WELCOME_TEMPLATE =
  "Halo kak, terima kasih sudah menghubungi {{perusahaan}}. Saya {{nama_sales}}. Ada yang bisa saya bantu terkait kebutuhan kakak?";

// GET: ambil pengaturan umum
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.roleSlug !== "superadmin") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya superadmin yang boleh melihat pengaturan ini",
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
          welcomeMessageEnabled: true,
          welcomeMessageTemplate: DEFAULT_WELCOME_TEMPLATE,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        companyName: setting.companyName,
        autoNurturingEnabled: setting.autoNurturingEnabled,
        maxIdleHoursBeforeResume: setting.maxIdleHoursBeforeResume,

        noResponseAfterHours:
          typeof setting.noResponseAfterHours === "number"
            ? setting.noResponseAfterHours
            : 24,

        // === tambahan: dikirim ke frontend ===
        welcomeMessageEnabled:
          typeof setting.welcomeMessageEnabled === "boolean"
            ? setting.welcomeMessageEnabled
            : true,

        welcomeMessageTemplate:
          setting.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE,
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
    if (!user || user.roleSlug !== "superadmin") {
      return NextResponse.json(
        {
          ok: false,
          message: "Hanya superadmin yang boleh mengubah pengaturan ini",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const rawCompanyName = String(body.companyName || "").trim();
    if (!rawCompanyName) {
      return NextResponse.json(
        { ok: false, message: "Nama perusahaan wajib diisi" },
        { status: 400 }
      );
    }

    const autoNurturingEnabled =
      typeof body.autoNurturingEnabled === "boolean"
        ? body.autoNurturingEnabled
        : true;

    const maxIdleRaw = Number(body.maxIdleHoursBeforeResume);
    const maxIdleHoursBeforeResume =
      !Number.isNaN(maxIdleRaw) && maxIdleRaw > 0 ? maxIdleRaw : 48;

    const noResponseRaw = Number(body.noResponseAfterHours);
    const noResponseAfterHours =
      !Number.isNaN(noResponseRaw) && noResponseRaw > 0 ? noResponseRaw : 24;

    // === tambahan: baca sambutan WA dari body ===
    const welcomeMessageEnabled =
      typeof body.welcomeMessageEnabled === "boolean"
        ? body.welcomeMessageEnabled
        : true;

    const welcomeTemplateRaw =
      typeof body.welcomeMessageTemplate === "string"
        ? body.welcomeMessageTemplate.trim()
        : "";

    const welcomeMessageTemplate =
      welcomeTemplateRaw || DEFAULT_WELCOME_TEMPLATE;

    const setting = await prisma.generalSetting.upsert({
      where: { id: 1 },
      update: {
        companyName: rawCompanyName,
        autoNurturingEnabled,
        maxIdleHoursBeforeResume,
        noResponseAfterHours,
        welcomeMessageEnabled,
        welcomeMessageTemplate,
      },
      create: {
        id: 1,
        companyName: rawCompanyName,
        autoNurturingEnabled,
        maxIdleHoursBeforeResume,
        noResponseAfterHours,
        welcomeMessageEnabled,
        welcomeMessageTemplate,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        companyName: setting.companyName,
        autoNurturingEnabled: setting.autoNurturingEnabled,
        maxIdleHoursBeforeResume: setting.maxIdleHoursBeforeResume,
        noResponseAfterHours: setting.noResponseAfterHours,
        welcomeMessageEnabled: setting.welcomeMessageEnabled,
        welcomeMessageTemplate:
          setting.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE,
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
