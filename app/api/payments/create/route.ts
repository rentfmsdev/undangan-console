import { NextResponse } from "next/server";
import { z } from "zod";
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

  const subdomainFee = mode === "subdomain" ? 50_000 : 0;
  const totalAmount = templatePrice + subdomainFee;

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Nominal pembayaran tidak valid." }, { status: 400 });
  }

  const pgsUrl = process.env.PAYMENT_GATEWAY_SERVICE_URL || "http://localhost:3003";

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
    metadata: {
      draftId,
      invitationId: draftId,
      mode,
      identifier,
      userId: access.user.id,
    },
  };

  try {
    const pgsResponse = await fetch(`${pgsUrl}/api/proxy/v1/service_payment/payments/topup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-Host": "http://127.0.0.1",
      },
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
