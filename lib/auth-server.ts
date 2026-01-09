import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export type RoleSlug = "manager" | "team-leader" | "sales" | "superadmin";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  roleSlug: RoleSlug;
  roleCode: string | null;
  roleName: string | null;
};

export async function getCurrentUser(
  req: NextRequest
): Promise<AuthUser | null> {
  try {
    const token = req.cookies.get("auth")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey);

    const userId = (payload as any)?.userId as number | undefined;
    const roleSlug = (payload as any)?.role as RoleSlug | undefined;

    if (!userId || !roleSlug) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      roleSlug,
      roleCode: user.role?.code ?? null,
      roleName: user.role?.name ?? null,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
