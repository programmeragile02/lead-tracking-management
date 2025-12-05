// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-please-change";
const secretKey = new TextEncoder().encode(JWT_SECRET);

type RoleSlug = "manager" | "team-leader" | "sales";

function getDashboardByRole(role: RoleSlug): string {
  if (role === "manager") return "/dashboard/manager";
  if (role === "team-leader") return "/dashboard/team-leader";
  return "/dashboard/sales";
}

function isPublicPath(pathname: string) {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/auth/login")) return true;
  // kalau ada landing page public nanti bisa ditambah di sini
  return false;
}

function isAllowed(pathname: string, role: RoleSlug): boolean {
  // Manager area khusus
  if (
    pathname.startsWith("/dashboard/manager") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/settings")
  ) {
    return role === "manager";
  }

  // Team Leader area
  if (
    pathname.startsWith("/dashboard/team-leader") ||
    pathname.startsWith("/team")
  ) {
    return role === "team-leader";
  }

  // Sales area
  if (pathname.startsWith("/dashboard/sales")) {
    return role === "sales";
    // return role === "sales" || role === "team-leader" || role === "manager";
  }

  // Halaman bersama: leads, tasks, profile – semua role boleh
  if (
    pathname.startsWith("/leads") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/profile")
  ) {
    return true;
  }

  // default: izinkan
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/whatsapp")) {
    return NextResponse.next();
  }

  // skip static & asset
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Halaman public (login)
  if (isPublicPath(pathname)) {
    const token = req.cookies.get("auth")?.value;
    if (!token) {
      return NextResponse.next();
    }

    try {
      const { payload } = await jwtVerify(token, secretKey);
      const role = (payload as any)?.role as RoleSlug | undefined;
      if (!role) return NextResponse.next();

      const url = req.nextUrl.clone();
      url.pathname = getDashboardByRole(role);
      return NextResponse.redirect(url);
    } catch {
      // token invalid → tetap boleh lihat /login
      return NextResponse.next();
    }
  }

  // Selain public → wajib login
  const token = req.cookies.get("auth")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const role = (payload as any)?.role as RoleSlug | undefined;

    if (!role) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Cek permission
    if (!isAllowed(pathname, role)) {
      const url = req.nextUrl.clone();
      url.pathname = getDashboardByRole(role);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("middleware jwt error:", err);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
