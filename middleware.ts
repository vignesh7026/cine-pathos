import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROFILE_GATED_PATHS = ["/", "/results"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isGated = PROFILE_GATED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isGated) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.next();
  }

  const activeProfileId = req.cookies.get("activeProfileId")?.value;
  if (!activeProfileId) {
    const url = req.nextUrl.clone();
    url.pathname = "/profiles";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/results/:path*"],
};
