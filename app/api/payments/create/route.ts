import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, payments, users } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export const runtime = "nodejs";

const createPaymentSchema = z.object({
  draftId: z.string().min(1),
  mode: z.enum(["path", "subdomain", "custom_domain"]),
  identifier: z.string().trim().toLowerCase().min(3).max(253),
  method: z.enum(["QR", "VIRTUAL_ACCOUNT"]),
  channel: z.string().min(1),
  phone: z.string().trim().max(30).optional(),
});

function normalizeIndonesianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export async function POST(request: Request) {
  const parsed = createPaymentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
  }

  const { draftId, mode, identifier, method, channel, phone } = parsed.data;
  const access = await getDraftAccess(draftId);
  const draft = access.draft;
  const user = access.user;

  if (!user) {
    return NextResponse.json({ error: "Silakan masuk sebelum melakukan pembayaran." }, { status: 401 });
  }
  if (!draft || !access.ownedByUser) {
    return NextResponse.json({ error: "Draft tidak ditemukan atau tidak dapat diakses." }, { status: 403 });
  }

  const customerPhone = normalizeIndonesianPhone(phone || user.phone || "");
  if (!/^628\d{8,11}$/.test(customerPhone)) {
    return NextResponse.json(
      { error: "Masukkan nomor Handphone/WhatsApp Indonesia yang valid." },
      { status: 400 }
    );
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

  const topupPayload = {
    user_id: user.id,
    amount: totalAmount,
    currency: "IDR",
    method,
    channel,
    name: user.name,
    email: user.email,
    phone: customerPhone,
    description: `Publish Undangan: ${identifier}`,
    client_app: "undangan",
    metadata: {
      draftId,
      invitationId: draftId,
      mode,
      identifier,
      userId: user.id,
    },
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "http://127.0.0.1",
    };

    const pgsResponse = await fetch(`${pgsUrl}/api/proxy/v1/service_payment/payments/topup`, {
      method: "POST",
      headers,
      body: JSON.stringify(topupPayload),
    });

    const pgsRawText = await pgsResponse.text();
    let pgsData: any = {};
    try {
      pgsData = pgsRawText ? JSON.parse(pgsRawText) : {};
    } catch {
      console.error("❌ Non-JSON response from payment gateway service:", pgsRawText);
      return NextResponse.json(
        {
          error:
            pgsResponse.status === 502 || pgsResponse.status === 504
              ? `Layanan Payment Gateway (${pgsUrl}) sedang offline (${pgsResponse.status} Bad Gateway). Pastikan container/service di server sudah berjalan.`
              : `Respon payment gateway tidak valid (${pgsResponse.status}).`,
        },
        { status: 503 }
      );
    }

    if (!pgsResponse.ok) {
      return NextResponse.json(
        {
          error:
            pgsData.message ||
            pgsData.error ||
            (pgsResponse.status === 502
              ? "Layanan Payment Gateway sedang offline (502 Bad Gateway)."
              : "Gagal membuat sesi pembayaran di payment gateway."),
        },
        { status: pgsResponse.status === 502 ? 503 : pgsResponse.status }
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
    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        id: paymentRecordId,
        invitationId: draftId,
        userId: user.id,
        referenceId: referenceId ? String(referenceId) : null,
        amount: totalAmount,
        currency: "IDR",
        mode,
        identifier,
        paymentMethod: method,
        paymentChannel: channel,
        status: "pending",
        customerName: user.name,
        customerEmail: user.email,
        customerPhone,
        rawResponse: pgsData,
      });

      await tx
        .update(users)
        .set({ phone: customerPhone })
        .where(eq(users.id, user.id));

      // Persist the target address so the callback and admin activation use the same identifier.
      await tx
        .update(invitations)
        .set({
          publishMode: mode,
          slug: mode === "path" ? identifier : null,
          subdomain: mode === "subdomain" ? identifier : null,
        })
        .where(eq(invitations.id, draftId));
    });

    return NextResponse.json({
      ok: true,
      phone: customerPhone,
      payment: {
        ...paymentResult,
        qr_content: qrContent || null,
        qr_image_url: qrImageUrl || paymentResult.qr_image_url || null,
      },
    });
  } catch (error) {
    console.error("❌ Error contacting payment gateway service:", error);
    return NextResponse.json(
      { error: "Gagal terhubung ke service payment gateway. Pastikan service_payment sedang aktif." },
      { status: 503 }
    );
  }
}
