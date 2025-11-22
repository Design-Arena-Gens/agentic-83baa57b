import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const adminPaths = ["/admin"];
const guardPaths = ["/guard"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }
    if (pathname === "/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    adminPaths.some((path) => pathname.startsWith(path)) &&
    token.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/guard", req.url));
  }

  if (
    guardPaths.some((path) => pathname.startsWith(path)) &&
    token.role !== "GUARD"
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guard/:path*", "/login"]
};
