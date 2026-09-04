import { NextRequest, NextResponse } from "next/server";

const reservedSubdomains = new Set(["www", "console", "api", "admin", "mail", "app", "assets"]);

const reservedRootPaths = new Set([
  "api",
  "demo",
  "template-preview",
  "editor",
  "login",
  "collaboration",
  "i",
  "uploads",
  "assets",
  "thumb",
  "admin",
  "console",
  "dashboard",
  "fav.png",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function proxy(request: NextRequest) {
  const rootDomain = (process.env.ROOT_DOMAIN ?? "undangan.co").toLowerCase();
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const { pathname } = request.nextUrl;

  // Files uploaded after `next build` are not part of Next.js' static public
  // manifest. Route them through a Node handler so files mounted from the
  // Docker volume are available immediately, including audio range requests.
  if (pathname.startsWith("/uploads/")) {
    const uploadUrl = request.nextUrl.clone();
    uploadUrl.pathname = `/api/upload-files${pathname.slice("/uploads".length)}`;
    return NextResponse.rewrite(uploadUrl);
  }

  // Extract first path segment (e.g. /demo/foo -> demo, /template-preview -> template-preview)
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  // Skip rewrite for reserved system routes or static files
  if (firstSegment && (reservedRootPaths.has(firstSegment) || pathname.includes("."))) {
    return NextResponse.next();
  }

  // Check if host is the root domain (configured in ROOT_DOMAIN or NEXT_PUBLIC_APP_URL)
  const isRootDomain =
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    (process.env.NEXT_PUBLIC_APP_URL &&
      (() => {
        try {
          const u = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
          return hostname === u || hostname === `www.${u}`;
        } catch {
          return false;
        }
      })());

  // Rewrite root domain invitation paths (e.g. undang.site/budi-ani -> /i/budi-ani)
  if (isRootDomain && segments.length === 1 && /^[a-z0-9][a-z0-9-]*$/.test(firstSegment)) {
    return NextResponse.rewrite(new URL(`/i/${firstSegment}`, request.url));
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
