import { NextResponse } from "next/server";
import { checkDomainCandidates, isValidDomainLabel, normalizeDomainLabel } from "@/modules/domains/availability";
import { getSessionUser } from "@/modules/auth/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk mengecek domain." }, { status: 401 });

  const label = normalizeDomainLabel(new URL(request.url).searchParams.get("name") ?? "");
  if (!isValidDomainLabel(label)) return NextResponse.json({ error: "Gunakan huruf, angka, atau tanda hubung (maksimal 63 karakter)." }, { status: 400 });

  const candidates = await checkDomainCandidates(label);
  return NextResponse.json({ name: label, checkedAt: new Date().toISOString(), candidates });
}
