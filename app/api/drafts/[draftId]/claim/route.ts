import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";

export async function POST(_: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (!access.draft || !access.authorized) return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 403 });
  if (access.draft.userId && access.draft.userId !== access.user.id) return NextResponse.json({ error: "Draft sudah dimiliki akun lain." }, { status: 409 });
  await db.update(invitations).set({ userId: access.user.id }).where(eq(invitations.id, draftId));
  return NextResponse.json({ ok: true, draftId });
}
