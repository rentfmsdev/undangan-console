import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { invitations, wishes } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";

const wishSchema = z.object({
  name: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1000),
  attendance: z.enum(["Hadir", "Belum pasti", "Berhalangan hadir"]),
});

const attendanceToDatabase = {
  Hadir: "hadir",
  "Belum pasti": "masih_ragu",
  "Berhalangan hadir": "tidak_hadir",
} as const;

const attendanceToLabel = {
  hadir: "Hadir",
  masih_ragu: "Belum pasti",
  tidak_hadir: "Berhalangan hadir",
} as const;

async function getInvitation(invitationId: string) {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.id, invitationId)).limit(1);
  return invitation;
}

async function canReadInvitation(invitationId: string) {
  const invitation = await getInvitation(invitationId);
  if (!invitation) return false;
  if (invitation.status === "published") return true;
  const access = await getDraftAccess(invitationId);
  return access.authorized;
}

export async function GET(request: Request) {
  const invitationId = new URL(request.url).searchParams.get("invitationId")?.trim();
  if (!invitationId) return NextResponse.json({ wishes: [] });
  if (!(await canReadInvitation(invitationId))) return NextResponse.json({ error: "Undangan tidak dapat diakses." }, { status: 404 });

  const records = await db.select().from(wishes).where(eq(wishes.invitationId, invitationId)).orderBy(desc(wishes.createdAt)).limit(50);
  return NextResponse.json({
    wishes: records.map((wish) => ({
      id: wish.id,
      name: wish.guestName,
      attendance: attendanceToLabel[wish.attendance],
      message: wish.message,
      createdAt: wish.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const invitationId = new URL(request.url).searchParams.get("invitationId")?.trim();
  if (!invitationId) return NextResponse.json({ error: "Undangan belum dipublish." }, { status: 400 });
  const invitation = await getInvitation(invitationId);
  if (!invitation || invitation.status !== "published") return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
  const parsed = wishSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Nama, kehadiran, atau ucapan tidak valid." }, { status: 400 });

  const id = randomUUID();
  const now = new Date();
  await db.insert(wishes).values({
    id,
    invitationId,
    guestName: parsed.data.name,
    attendance: attendanceToDatabase[parsed.data.attendance],
    message: parsed.data.message,
    createdAt: now,
  });

  return NextResponse.json({
    wish: { id, name: parsed.data.name, attendance: parsed.data.attendance, message: parsed.data.message, createdAt: now.toISOString() },
  }, { status: 201 });
}
