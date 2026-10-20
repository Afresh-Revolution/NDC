import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/workspace", "/admin", "/onboarding", "/chapter"];
const AUTH_PAGES = ["/login", "/register", "/reset"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("ndc_session")?.value;

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (session && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
