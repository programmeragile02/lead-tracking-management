import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { logoutWaClient } from "@/lib/whatsapp-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  if (user.roleSlug !== "sales") {
    return NextResponse.json(
      { ok: false, error: "only_sales_can_logout" },
      { status: 403 }
    );
  }

  try {
    await logoutWaClient(user.id);

    // update status session di DB
    await prisma.whatsAppSession.updateMany({
      where: { userId: user.id },
      data: {
        status: "DISCONNECTED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wa-logout] error:", err);
    return NextResponse.json(
      { ok: false, error: "logout_failed" },
      { status: 500 }
    );
  }
}
