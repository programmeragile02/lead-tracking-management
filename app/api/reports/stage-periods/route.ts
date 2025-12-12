import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const first = await prisma.leadStageHistory.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (!first) {
      // belum ada data
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      return NextResponse.json({ ok: true, periods: [ym], defaultPeriod: ym });
    }

    const start = new Date(first.createdAt);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    const end = new Date(now);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);

    const periods: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const ym = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;
      periods.push(ym);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const defaultPeriod = `${end.getFullYear()}-${String(
      end.getMonth() + 1
    ).padStart(2, "0")}`;

    return NextResponse.json({ ok: true, periods, defaultPeriod });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat periode" },
      { status: 500 }
    );
  }
}
