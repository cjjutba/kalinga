import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic redirect only. A missing session cookie sends the visitor to sign
// in before any server work happens. Every page and action still validates
// the session and the membership on the server, because a cookie's presence
// is not a permission.

export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request);
  if (!cookie) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.startsWith("/me") ? "/me" : "/sign-in";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/me/appointments/:path*", "/me/pets/:path*"],
};
