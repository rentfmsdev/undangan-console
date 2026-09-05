import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, invitations, payments } from "@/db/schema";
import { getAdminSession } from "@/modules/admin/auth";
import { getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) {
    return NextResponse.json(
      { error: "Akses ditolak. Endpoint ini khusus super administrator." },
      { status: 403 }
    );
  }

  // 1. Fetch Users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // 2. Fetch Invitations
  const allInvitations = await db
    .select({
      id: invitations.id,
      userId: invitations.userId,
      title: invitations.title,
      slug: invitations.slug,
      subdomain: invitations.subdomain,
      publishMode: invitations.publishMode,
      status: invitations.status,
      templateId: invitations.templateId,
      publishedAt: invitations.publishedAt,
      createdAt: invitations.createdAt,
      updatedAt: invitations.updatedAt,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.avatarUrl,
    })
    .from(invitations)
    .leftJoin(users, eq(invitations.userId, users.id))
    .orderBy(desc(invitations.updatedAt));

  // 3. Fetch Payments
  const allPayments = await db
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
      invitationTitle: invitations.title,
      invitationSlug: invitations.slug,
      userName: users.name,
      userEmail: users.email,
    })
    .from(payments)
    .leftJoin(invitations, eq(payments.invitationId, invitations.id))
    .leftJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.createdAt));

  // Map latest payment per invitation
  const latestPaymentByInvitation = new Map<string, (typeof allPayments)[0]>();
  for (const p of allPayments) {
    if (!latestPaymentByInvitation.has(p.invitationId)) {
      latestPaymentByInvitation.set(p.invitationId, p);
    } else {
      const existing = latestPaymentByInvitation.get(p.invitationId);
      if (existing?.status !== "paid" && p.status === "paid") {
        latestPaymentByInvitation.set(p.invitationId, p);
      }
    }
  }

  // Count invitations per user
  const userStats = new Map<string, { totalInvitations: number; paidInvitations: number }>();
  for (const inv of allInvitations) {
    if (!inv.userId) continue;
    const current = userStats.get(inv.userId) || { totalInvitations: 0, paidInvitations: 0 };
    current.totalInvitations += 1;
    const pmt = latestPaymentByInvitation.get(inv.id);
    if (pmt?.status === "paid" || inv.status === "published") {
      current.paidInvitations += 1;
    }
    userStats.set(inv.userId, current);
  }

  const enhancedUsers = allUsers.map((u) => {
    const stats = userStats.get(u.id) || { totalInvitations: 0, paidInvitations: 0 };
    return {
      ...u,
      totalInvitations: stats.totalInvitations,
      paidInvitations: stats.paidInvitations,
    };
  });

  const enhancedInvitations = allInvitations.map((inv) => {
    const payment = latestPaymentByInvitation.get(inv.id) || null;
    const template = getTemplateById(inv.templateId);
    const catalogItem = getTemplateCatalogItem(inv.templateId);
    return {
      ...inv,
      templateName: template?.name || catalogItem?.name || inv.templateId,
      templateCategory: template?.category || catalogItem?.category || "general",
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            method: payment.paymentMethod,
            channel: payment.paymentChannel,
            paidAt: payment.paidAt,
            createdAt: payment.createdAt,
          }
        : null,
      paymentStatus:
        payment?.status === "paid"
          ? "paid"
          : payment?.status === "pending"
          ? "pending"
          : inv.status === "published"
          ? "paid"
          : "unpaid",
    };
  });

  // Calculate metrics
  const totalUsers = allUsers.length;
  const totalInvitations = allInvitations.length;
  const publishedInvitations = allInvitations.filter((i) => i.status === "published").length;
  const draftInvitations = allInvitations.filter((i) => i.status === "draft").length;
  const totalPayments = allPayments.length;
  const paidPayments = allPayments.filter((p) => p.status === "paid");
  const pendingPayments = allPayments.filter((p) => p.status === "pending");
  const totalRevenue = paidPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return NextResponse.json({
    metrics: {
      totalUsers,
      totalInvitations,
      publishedInvitations,
      draftInvitations,
      totalPayments,
      paidPaymentsCount: paidPayments.length,
      pendingPaymentsCount: pendingPayments.length,
      totalRevenue,
    },
    users: enhancedUsers,
    invitations: enhancedInvitations,
    payments: allPayments,
  });
}
