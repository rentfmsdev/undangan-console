import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { payments, invitations, users } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    // Also allow if user is authenticated or checking self payments
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const isAdmin = user.role === "admin";

    // Query transactions (admins see all, normal users see their own)
    const baseQuery = db
      .select({
        id: payments.id,
        invitationId: payments.invitationId,
        userId: payments.userId,
        referenceId: payments.referenceId,
        amount: payments.amount,
        currency: payments.currency,
        mode: payments.mode,
        identifier: payments.identifier,
        paymentMethod: payments.paymentMethod,
        paymentChannel: payments.paymentChannel,
        status: payments.status,
        customerName: payments.customerName,
        customerEmail: payments.customerEmail,
        customerPhone: payments.customerPhone,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments);

    const records = isAdmin
      ? await baseQuery.orderBy(desc(payments.createdAt)).limit(100)
      : await baseQuery.where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(50);

    // Compute revenue stats
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const record of records) {
      if (record.status === "paid") {
        totalRevenue += record.amount;
        paidCount++;
      } else if (record.status === "pending") {
        pendingCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue,
        paidCount,
        pendingCount,
        totalCount: records.length,
      },
      payments: records,
    });
  } catch (error) {
    console.error("Failed to load payments:", error);
    return NextResponse.json({ error: "Gagal memuat data pembayaran" }, { status: 500 });
  }
}
