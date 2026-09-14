import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getAdminSession } from "@/modules/admin/auth";

const ALLOWED_AVATAR_HOSTS = new Set(["api.dicebear.com", "lh3.googleusercontent.com"]);

function isAllowedAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_AVATAR_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getAdminSession();
  if (!session.user || !session.isAuthorized || session.mustChangePassword) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { userId } = await params;
  const [user] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.avatarUrl || !isAllowedAvatarUrl(user.avatarUrl)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const response = await fetch(user.avatarUrl, {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml" },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
