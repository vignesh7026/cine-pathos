import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Pages that require both auth + an active profile
const PROFILE_GATED_PATHS = ["/", "/results", "/movie"];
// Pages that only require auth (no profile needed)
const AUTH_ONLY_PATHS = ["/profiles"];
// Pages that are fully public (no auth needed)
const PUBLIC_PATHS = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check if it's a public page
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublic) return NextResponse.next();

  const token = await getToken({
    req,
    secret:
      process.env.NEXTAUTH_SECRET ||
      "mood-movies-secret-auth-token-key-32-chars-long",
  });

  // Not logged in → redirect to login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logged in but auth-only path (like /profiles) → allow through
  const isAuthOnly = AUTH_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAuthOnly) return NextResponse.next();

  // Profile-gated path → must have an active profile cookie
  const isProfileGated = PROFILE_GATED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProfileGated) {
    const activeProfileId = req.cookies.get("activeProfileId")?.value;
    if (!activeProfileId) {
      const url = req.nextUrl.clone();
      url.pathname = "/profiles";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

