import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { ensureWaClient, fetchWaQr } from "@/lib/whatsapp-service";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  // hanya sales yang bisa connect WA sendiri
  if (user.roleSlug !== "sales") {
    return NextResponse.json(
      { ok: false, error: "only_sales_can_connect" },
      { status: 403 }
    );
  }

  try {
    await ensureWaClient(user.id);
    const qrInfo = await fetchWaQr(user.id);

    return NextResponse.json(qrInfo);
  } catch (err) {
    console.error("[qr] error:", err);
    return NextResponse.json(
      { ok: false, error: "qr_failed" },
      { status: 500 }
    );
  }
}
