import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/generate", "/projects", "/billing", "/settings", "/images", "/videos", "/prompts"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("intellix_token")?.value;
  const path = req.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/generate/:path*", "/projects/:path*", "/billing/:path*", "/settings/:path*", "/images/:path*", "/videos/:path*", "/prompts/:path*"],
};
