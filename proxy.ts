import { NextRequest, NextResponse } from "next/server";

const reservedSubdomains = new Set(["www", "console", "api", "admin", "mail", "app", "assets"]);

export function proxy(request: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN ?? "undangan.co";
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const { pathname } = request.nextUrl;

  if ((hostname === rootDomain || hostname === `www.${rootDomain}`) && /^\/[a-z0-9][a-z0-9-]*$/.test(pathname)) {
    return NextResponse.rewrite(new URL(`/i${pathname}`, request.url));
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -(rootDomain.length + 1));
    if (subdomain && !reservedSubdomains.has(subdomain) && pathname === "/") {
      return NextResponse.rewrite(new URL(`/i/${subdomain}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
