export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LeadTargetSettingResponse = {
  leadTargetPerDay: number;
  closingTargetAmount: string; // kirim sebagai string supaya aman untuk decimal
};

// GET /api/settings/lead-target
export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.leadTargetSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      // kalau belum ada, kembalikan default 0
      const data: LeadTargetSettingResponse = {
        leadTargetPerDay: 0,
        closingTargetAmount: "0",
      };
      return NextResponse.json({ ok: true, data });
    }

    const data: LeadTargetSettingResponse = {
      leadTargetPerDay: setting.leadTargetPerDay,
      closingTargetAmount: setting.closingTargetAmount.toString(),
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET /api/settings/lead-target error", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengambil pengaturan target global." },
      { status: 500 }
    );
  }
}

// POST /api/settings/lead-target
// body: { leadTargetPerDay, closingTargetAmount }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const leadTargetPerDay =
      body.leadTargetPerDay != null ? Number(body.leadTargetPerDay) : 0;

    const closingTargetAmountRaw = body.closingTargetAmount ?? "0";
    const closingTargetAmount = String(closingTargetAmountRaw || "0");

    if (Number.isNaN(leadTargetPerDay)) {
      return NextResponse.json(
        { ok: false, message: "leadTargetPerDay harus berupa angka." },
        { status: 400 }
      );
    }

    // singleton id = 1
    const saved = await prisma.leadTargetSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        leadTargetPerDay,
        closingTargetAmount,
      },
      update: {
        leadTargetPerDay,
        closingTargetAmount,
      },
    });

    return NextResponse.json({ ok: true, data: saved });
  } catch (err: any) {
    console.error("POST /api/settings/lead-target error", err);
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || "Gagal menyimpan pengaturan target global.",
      },
      { status: 500 }
    );
  }
}
