import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";
import { releaseExpiredPublications } from "@/modules/publishing/retention";

const reservedNames = new Set(["www", "console", "api", "admin", "mail", "app", "assets", "demo", "editor", "undangan-saya"]);
const identifierPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk mengecek alamat undangan." }, { status: 401 });

  const query = new URL(request.url).searchParams;
  const mode = query.get("mode");
  const identifier = query.get("identifier")?.trim().toLowerCase() ?? "";
  const excludeDraftId = query.get("excludeDraftId")?.trim();
  if ((mode !== "path" && mode !== "subdomain") || !identifierPattern.test(identifier) || reservedNames.has(identifier)) {
    return NextResponse.json({ available: false, reason: "Nama belum valid atau termasuk alamat yang dicadangkan." });
  }

  await releaseExpiredPublications();

  const column = mode === "path" ? invitations.slug : invitations.subdomain;
  const condition = excludeDraftId ? and(eq(column, identifier), ne(invitations.id, excludeDraftId)) : eq(column, identifier);
  const [conflict] = await db.select({ id: invitations.id }).from(invitations).where(condition).limit(1);
  return NextResponse.json({ available: !conflict, reason: conflict ? "Alamat sudah digunakan undangan lain." : "Alamat tersedia." });
}
