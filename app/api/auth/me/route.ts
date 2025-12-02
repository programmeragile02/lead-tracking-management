import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

type RoleSlug = "manager" | "team-leader" | "sales";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secretKey);

    const userId = (payload as any)?.userId as number | undefined;
    const roleSlug = (payload as any)?.role as RoleSlug | undefined;

    if (!userId || !roleSlug) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message: "Token tidak valid",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message: "Pengguna tidak ditemukan atau nonaktif",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleSlug,
        roleCode: user.role?.code ?? null, 
        roleName: user.role?.name ?? null,
      },
    });
  } catch (error) {
    console.error("auth/me error:", error);
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message: "Token tidak valid atau kedaluwarsa",
      },
      { status: 401 }
    );
  }
}
