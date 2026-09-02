import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db/client";
import { domainPublishRequests, invitations } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { checkDomainAvailability, parseSupportedDomain } from "@/modules/domains/availability";
import { getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export const runtime = "nodejs";

const identifierPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;
const publishSchema = z.object({
  mode: z.enum(["path", "subdomain", "custom_domain"]),
  identifier: z.string().trim().toLowerCase().min(3).max(253),
});
const reservedNames = new Set(["www", "console", "api", "admin", "mail", "app", "assets", "demo", "editor"]);

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Alamat publish tidak valid." }, { status: 400 });

  const access = await getDraftAccess(draftId);
  const draft = access.draft;
  if (!access.user) return NextResponse.json({ error: "Silakan masuk sebelum publish." }, { status: 401 });
  if (!draft || !access.ownedByUser) return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 403 });

  const { mode, identifier } = parsed.data;
  const template = getTemplateById(draft.templateId);
  const templatePrice = getTemplateCatalogItem(draft.templateId)?.price ?? (template ? getTemplateCatalogItem(template.code)?.price : undefined) ?? template?.price ?? 0;
  const subdomainFee = 50_000;
  if (mode === "custom_domain") {
    if (!parseSupportedDomain(identifier)) return NextResponse.json({ error: "Pilih domain dengan ekstensi .com, .id, .co, atau .space." }, { status: 400 });
  } else if (!identifierPattern.test(identifier) || reservedNames.has(identifier)) {
    return NextResponse.json({ error: "Nama URL tidak valid atau sudah dicadangkan." }, { status: 400 });
  }

  if (mode === "path") {
    const [conflict] = await db.select({ id: invitations.id }).from(invitations).where(and(eq(invitations.slug, identifier), ne(invitations.id, draftId))).limit(1);
    if (conflict) return NextResponse.json({ error: "Nama URL sudah digunakan. Pilih nama lain." }, { status: 409 });
    try {
      await db.update(invitations).set({
        status: "published",
        publishMode: "path",
        slug: identifier,
        subdomain: null,
        styleOverrides: {
          ...(draft.styleOverrides as Record<string, unknown>),
          publishRequest: null,
          publishPricing: { templatePrice, additionalFee: 0, total: templatePrice, pricingStatus: "fixed", selectedAt: new Date().toISOString() },
        },
        publishedAt: new Date(),
      }).where(eq(invitations.id, draftId));
      await db.update(domainPublishRequests).set({ status: "cancelled" }).where(eq(domainPublishRequests.invitationId, draftId));
    } catch {
      return NextResponse.json({ error: "Nama URL baru saja digunakan. Pilih nama lain." }, { status: 409 });
    }
    const rootDomain = process.env.ROOT_DOMAIN ?? "undangan.co";
    return NextResponse.json({ ok: true, status: "published", url: `https://${rootDomain}/${identifier}`, pricing: { templatePrice, additionalFee: 0, total: templatePrice } });
  }

  const domainCheck = mode === "custom_domain" ? await checkDomainAvailability(identifier) : null;
  if (domainCheck?.status === "taken") return NextResponse.json({ error: "Domain baru saja terdeteksi sudah terdaftar. Silakan pilih domain lain.", domainCheck }, { status: 409 });
  if (domainCheck?.status === "unknown") return NextResponse.json({ error: "Ketersediaan domain belum dapat diverifikasi. Coba periksa kembali beberapa saat lagi.", domainCheck }, { status: 503 });

  if (domainCheck) {
    const [conflict] = await db.select({ invitationId: domainPublishRequests.invitationId }).from(domainPublishRequests).where(and(eq(domainPublishRequests.domain, identifier), ne(domainPublishRequests.invitationId, draftId))).limit(1);
    if (conflict) return NextResponse.json({ error: "Domain sudah dipilih pada request undangan lain. Silakan pilih domain lain." }, { status: 409 });

    const [existingRequest] = await db.select({ id: domainPublishRequests.id }).from(domainPublishRequests).where(eq(domainPublishRequests.invitationId, draftId)).limit(1);
    const domainRequest = {
      userId: access.user.id,
      domain: identifier,
      tld: domainCheck.tld,
      status: "requested" as const,
      availabilitySource: domainCheck.source,
      availabilityCheckedAt: new Date(domainCheck.checkedAt),
      templatePrice,
      additionalServiceFee: null,
      estimatedTotal: null,
      requestedAt: new Date(),
    };
    if (existingRequest) await db.update(domainPublishRequests).set(domainRequest).where(eq(domainPublishRequests.id, existingRequest.id));
    else await db.insert(domainPublishRequests).values({ id: randomUUID(), invitationId: draftId, ...domainRequest });
  } else {
    await db.update(domainPublishRequests).set({ status: "cancelled" }).where(eq(domainPublishRequests.invitationId, draftId));
  }

  const requestPayload = {
    type: mode,
    identifier,
    templatePrice,
    additionalFee: mode === "subdomain" ? subdomainFee : null,
    total: mode === "subdomain" ? templatePrice + subdomainFee : null,
    pricingStatus: mode === "custom_domain" ? "quotation_required" : "fixed",
    requestedAt: new Date().toISOString(),
    requestedBy: access.user.id,
    domainAvailability: domainCheck ? {
      status: domainCheck.status,
      checkedAt: domainCheck.checkedAt,
      source: domainCheck.source,
    } : null,
  };
  await db.update(invitations).set({
    status: "custom",
    publishMode: mode,
    slug: null,
    subdomain: null,
    styleOverrides: { ...(draft.styleOverrides as Record<string, unknown>), publishRequest: requestPayload },
    publishedAt: null,
  }).where(eq(invitations.id, draftId));

  return NextResponse.json({ ok: true, status: "custom", request: requestPayload });
}
