import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, payments } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export const runtime = "nodejs";

const createPaymentSchema = z.object({
  draftId: z.string().min(1),
  mode: z.enum(["path", "subdomain", "custom_domain"]),
  identifier: z.string().trim().toLowerCase().min(3).max(253),
  method: z.enum(["QR", "VIRTUAL_ACCOUNT"]),
  channel: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = createPaymentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
  }

  const { draftId, mode, identifier, method, channel, phone } = parsed.data;
  const access = await getDraftAccess(draftId);
  const draft = access.draft;

  if (!access.user) {
    return NextResponse.json({ error: "Silakan masuk sebelum melakukan pembayaran." }, { status: 401 });
  }
  if (!draft || !access.ownedByUser) {
    return NextResponse.json({ error: "Draft tidak ditemukan atau tidak dapat diakses." }, { status: 403 });
  }

  const template = getTemplateById(draft.templateId);
  const templatePrice =
    getTemplateCatalogItem(draft.templateId)?.price ??
    (template ? getTemplateCatalogItem(template.code)?.price : undefined) ??
    template?.price ??
    0;

  const isTestingPrice = template?.category === "aqiqah" || templatePrice === 1_000;
  const subdomainFee = mode === "subdomain" ? (isTestingPrice ? 0 : 50_000) : 0;
  const totalAmount = isTestingPrice && mode === "subdomain" ? 1_000 : templatePrice + subdomainFee;

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Nominal pembayaran tidak valid." }, { status: 400 });
  }

  const pgsUrl = process.env.PAYMENT_GATEWAY_SERVICE_URL || "http://localhost:3003";
  const subMerchantId =
    process.env.SUB_MERCHANT_ID ||
    process.env.PIVOT_SUB_MERCHANT_ID ||
    "dfeee5f7-0e89-4d3d-8ad9-b1fceaaf8ead";

  const topupPayload = {
    user_id: access.user.id,
    amount: totalAmount,
    currency: "IDR",
    method,
    channel,
    name: access.user.name,
    email: access.user.email,
    phone: phone || access.user.phone || "081234567890",
    description: `Publish Undangan: ${identifier}`,
    client_app: "undangan",
    sub_merchant_id: subMerchantId,
    submerchant_id: subMerchantId,
    metadata: {
      draftId,
      invitationId: draftId,
      mode,
      identifier,
      userId: access.user.id,
      sub_merchant_id: subMerchantId,
    },
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "http://127.0.0.1",
    };
    if (subMerchantId) {
      headers["x-submerchant-id"] = subMerchantId;
      headers["X-Submerchant-Id"] = subMerchantId;
    }

    const pgsResponse = await fetch(`${pgsUrl}/api/proxy/v1/service_payment/payments/topup`, {
      method: "POST",
      headers,
      body: JSON.stringify(topupPayload),
    });

    const pgsData = await pgsResponse.json();
    if (!pgsResponse.ok) {
      return NextResponse.json(
        { error: pgsData.message || pgsData.error || "Gagal membuat sesi pembayaran di payment gateway." },
        { status: pgsResponse.status }
      );
    }

    const paymentResult = pgsData.data || pgsData;
    let qrContent = paymentResult.qr_content || pgsData.qr_content;
    if (!qrContent && paymentResult.charge_details?.[0]?.paymentMethod?.qr?.qrContent) {
      qrContent = paymentResult.charge_details[0].paymentMethod.qr.qrContent;
    }
    if (!qrContent && paymentResult.charge_details?.[0]?.qr?.qrContent) {
      qrContent = paymentResult.charge_details[0].qr.qrContent;
    }

    const qrImageUrl =
      paymentResult.qr_image_url ||
      paymentResult.qr_url ||
      paymentResult.qrUrl ||
      paymentResult.url ||
      paymentResult.charge_details?.[0]?.paymentMethod?.qr?.qrUrl ||
      paymentResult.charge_details?.[0]?.qr?.qrUrl ||
      pgsData.qr_url ||
      pgsData.qr_image_url;

    // Record pending transaction in dedicated payments table
    const referenceId =
      paymentResult.client_reference_id ||
      paymentResult.reference_id ||
      paymentResult.id ||
      null;

    const paymentRecordId = crypto.randomUUID();
    await db.insert(payments).values({
      id: paymentRecordId,
      invitationId: draftId,
      userId: access.user.id,
      referenceId: referenceId ? String(referenceId) : null,
      amount: totalAmount,
      currency: "IDR",
      mode,
      identifier,
      paymentMethod: method,
      paymentChannel: channel,
      status: "pending",
      customerName: access.user.name,
      customerEmail: access.user.email,
      customerPhone: phone || access.user.phone || null,
      rawResponse: pgsData,
    });

    // Also persist publishMode & target identifier on draft so callback knows user intention
    await db
      .update(invitations)
      .set({
        publishMode: mode,
        slug: mode === "path" ? identifier : null,
        subdomain: mode === "subdomain" ? identifier : null,
      })
      .where(eq(invitations.id, draftId));

    return NextResponse.json({
      ok: true,
      payment: {
        ...paymentResult,
        qr_content: qrContent || null,
        qr_image_url: qrImageUrl || paymentResult.qr_image_url || null,
      },
    });
  } catch (error) {
    console.error("❌ Error contacting payment gateway service:", error);
    return NextResponse.json(
      { error: "Gagal terhubung ke service payment gateway." },
      { status: 502 }
    );
  }
}
