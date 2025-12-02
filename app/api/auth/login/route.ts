import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

type RoleSlug = "manager" | "team-leader" | "sales";

function mapRoleCodeToSlug(code?: string | null): RoleSlug | null {
  const c = (code ?? "").toUpperCase();
  switch (c) {
    case "MANAGER":
      return "manager";
    case "TEAM_LEADER":
      return "team-leader";
    case "SALES":
      return "sales";
    default:
      return null;
  }
}

function getDashboardByRole(role: RoleSlug): string {
  if (role === "manager") return "/dashboard/manager";
  if (role === "team-leader") return "/dashboard/team-leader";
  return "/dashboard/sales";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { ok: false, message: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { ok: false, message: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    const roleSlug = mapRoleCodeToSlug(user.role?.code);
    if (!roleSlug) {
      return NextResponse.json(
        { ok: false, message: "Role pengguna tidak valid" },
        { status: 403 }
      );
    }

    const dashboard = getDashboardByRole(roleSlug);

    const token = await new SignJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      roleCode: user.role?.code,
      role: roleSlug,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secretKey);

    const res = NextResponse.json({
      ok: true,
      role: roleSlug,
      redirectTo: dashboard,
    });

    res.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
