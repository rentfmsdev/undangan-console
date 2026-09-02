import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { domainPublishRequests, invitations, users } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });

  const requestedStatus = new URL(request.url).searchParams.get("status");
  const allowedStatuses = ["requested", "processing", "registered", "rejected", "cancelled"] as const;
  const status = allowedStatuses.find((item) => item === requestedStatus);

  const baseQuery = db.select({
    id: domainPublishRequests.id,
    invitationId: domainPublishRequests.invitationId,
    invitationTitle: invitations.title,
    userId: domainPublishRequests.userId,
    userName: users.name,
    userEmail: users.email,
    domain: domainPublishRequests.domain,
    tld: domainPublishRequests.tld,
    status: domainPublishRequests.status,
    availabilitySource: domainPublishRequests.availabilitySource,
    availabilityCheckedAt: domainPublishRequests.availabilityCheckedAt,
    templatePrice: domainPublishRequests.templatePrice,
    additionalServiceFee: domainPublishRequests.additionalServiceFee,
    estimatedTotal: domainPublishRequests.estimatedTotal,
    requestedAt: domainPublishRequests.requestedAt,
    updatedAt: domainPublishRequests.updatedAt,
  }).from(domainPublishRequests)
    .innerJoin(invitations, eq(domainPublishRequests.invitationId, invitations.id))
    .innerJoin(users, eq(domainPublishRequests.userId, users.id))
    .orderBy(desc(domainPublishRequests.requestedAt));

  const requests = status ? await baseQuery.where(eq(domainPublishRequests.status, status)) : await baseQuery;
  return NextResponse.json({ requests });
}
