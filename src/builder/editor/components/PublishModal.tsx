"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  ExternalLink,
  Globe2,
  Link2,
  LoaderCircle,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { makeAdminWhatsAppUrl } from "@/config/contact";
import { getAppBaseUrl } from "@/lib/app-url";

type PublishMode = "path" | "subdomain" | "custom_domain";
type Availability = "idle" | "checking" | "available" | "unavailable" | "invalid";
type DomainStatus = "available" | "taken" | "unknown";
type DomainCandidate = {
  domain: string;
  tld: "com" | "id" | "co" | "space";
  status: DomainStatus;
  checkedAt: string;
  source: "rdap" | "whois";
  message: string;
};

type PaymentStep = "configure" | "payment_method" | "waiting_payment";

interface PaymentSessionData {
  status: string;
  reference_id: string;
  expires_at?: string;
  qr_content?: string | null;
  qr_image_url?: string;
}

export type PublishResult =
  | { status: "published"; url: string; mode: "path"; identifier: string }
  | { status: "custom"; mode: "subdomain" | "custom_domain"; identifier: string };

const pathPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

function cleanPath(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function cleanDomainLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(".")[0]
    ?.replace(/[^a-z0-9-]/g, "") ?? "";
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PublishModal({
  open,
  draftId,
  draftReady,
  initialIdentifier,
  templatePrice,
  userPhone,
  currentStatus = "draft",
  publishedUrl = "",
  onClose,
  onResult,
}: {
  open: boolean;
  draftId: string | null;
  draftReady: boolean;
  initialIdentifier: string;
  templatePrice: number;
  userPhone?: string | null;
  currentStatus?: "draft" | "published" | "custom";
  publishedUrl?: string;
  onClose: () => void;
  onResult: (result: PublishResult) => void;
}) {
  const [step, setStep] = useState<PaymentStep>("configure");
  const [mode, setMode] = useState<PublishMode>("path");
  const [identifier, setIdentifier] = useState(cleanPath(initialIdentifier || "ayuardi"));
  const [availability, setAvailability] = useState<Availability>("checking");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [domainLabel, setDomainLabel] = useState(cleanDomainLabel(initialIdentifier || "ayuardi"));
  const [domainCandidates, setDomainCandidates] = useState<DomainCandidate[]>([]);
  const [domainCheck, setDomainCheck] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [domainError, setDomainError] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Payment states (QRIS only)
  const [customerPhone, setCustomerPhone] = useState(userPhone || "");
  const [paymentData, setPaymentData] = useState<PaymentSessionData | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCopied, setPaymentCopied] = useState<string | null>(null);
  const [decodingQR, setDecodingQR] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync customerPhone from userPhone prop
  useEffect(() => {
    if (userPhone) {
      setCustomerPhone((prev) => prev || userPhone);
    }
  }, [userPhone]);

  const displayHost = getAppBaseUrl().replace(/^https?:\/\//, "");
  const rootDomain = "undangan.co";
  const subdomainFee = 50_000;
  const totalAmount = mode === "subdomain" ? templatePrice + subdomainFee : templatePrice;

  const validPathIdentifier = useMemo(() => pathPattern.test(identifier), [identifier]);
  const validDomainLabel = useMemo(
    () => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domainLabel),
    [domainLabel]
  );
  const effectiveIdentifier = mode === "custom_domain" ? selectedDomain : identifier;

  // Check path / subdomain availability
  useEffect(() => {
    if (!open || (mode !== "path" && mode !== "subdomain") || !validPathIdentifier || !draftId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(
        `/api/publish/availability?mode=${mode}&identifier=${encodeURIComponent(
          identifier
        )}&excludeDraftId=${encodeURIComponent(draftId)}`,
        { cache: "no-store", signal: controller.signal }
      )
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error ?? "Pengecekan gagal.");
          return payload;
        })
        .then((payload) => {
          setAvailability(payload.available ? "available" : "unavailable");
          setAvailabilityMessage(payload.reason ?? "");
        })
        .catch((reason) => {
          if (!controller.signal.aborted) {
            setAvailability("unavailable");
            setAvailabilityMessage(reason instanceof Error ? reason.message : "Pengecekan gagal.");
          }
        });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draftId, identifier, mode, open, validPathIdentifier]);

  // Check custom domain candidates
  useEffect(() => {
    if (!open || mode !== "custom_domain" || !validDomainLabel) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/domains/availability?name=${encodeURIComponent(domainLabel)}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error ?? "Pengecekan domain gagal.");
          return payload;
        })
        .then((payload: { candidates: DomainCandidate[] }) => {
          setDomainCandidates(payload.candidates);
          setDomainCheck("done");
          setDomainError("");
        })
        .catch((reason) => {
          if (!controller.signal.aborted) {
            setDomainCandidates([]);
            setDomainCheck("error");
            setDomainError(reason instanceof Error ? reason.message : "Pengecekan domain gagal.");
          }
        });
    }, 500);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [domainLabel, mode, open, validDomainLabel]);

  // Realtime Polling when in "waiting_payment"
  useEffect(() => {
    if (!open || step !== "waiting_payment" || !draftId) return;

    let active = true;
    const pollInterval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?draftId=${encodeURIComponent(draftId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.paid) {
          window.clearInterval(pollInterval);
          onResult({
            status: "published",
            url: data.url || `${window.location.origin}/i/${effectiveIdentifier}`,
            mode: "path",
            identifier: effectiveIdentifier,
          });
        }
      } catch {
        // Silently retry on next poll
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(pollInterval);
    };
  }, [draftId, effectiveIdentifier, onResult, open, step]);

  // Decode QR code without frame (tanpa bingkai) and render directly onto canvas
  useEffect(() => {
    if (step !== "waiting_payment" || !paymentData) return;

    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    // Option A: Raw QR string is available directly
    if (paymentData.qr_content) {
      QRCode.toCanvas(
        canvas,
        paymentData.qr_content,
        {
          width: 224,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        },
        (err) => {
          if (err) console.error("Error drawing QR canvas:", err);
        }
      );
      return;
    }

    // Option B: QR image URL is available (has flyer/frame) -> decode it with jsQR
    if (paymentData.qr_image_url) {
      setDecodingQR(true);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const offscreenCanvas = document.createElement("canvas");
          offscreenCanvas.width = img.naturalWidth || img.width;
          offscreenCanvas.height = img.naturalHeight || img.height;
          const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            setDecodingQR(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data && qrCanvasRef.current) {
            paymentData.qr_content = code.data;
            QRCode.toCanvas(
              qrCanvasRef.current,
              code.data,
              {
                width: 224,
                margin: 1,
                color: { dark: "#0f172a", light: "#ffffff" },
              },
              () => {
                setDecodingQR(false);
              }
            );
          } else {
            setDecodingQR(false);
          }
        } catch (e) {
          console.warn("jsQR decode error:", e);
          setDecodingQR(false);
        }
      };
      img.onerror = () => setDecodingQR(false);
      // Route through proxy to eliminate any CORS tainted canvas issues
      img.src = paymentData.qr_image_url.startsWith("http")
        ? `/api/payments/qr-proxy?url=${encodeURIComponent(paymentData.qr_image_url)}`
        : paymentData.qr_image_url;
    }
  }, [step, paymentData]);

  if (!open) return null;
  if (currentStatus === "published")
    return (
      <PublishStatusModal
        status="published"
        identifier={initialIdentifier}
        publishedUrl={publishedUrl}
        onClose={onClose}
      />
    );
  if (currentStatus === "custom")
    return (
      <PublishStatusModal
        status="custom"
        identifier={initialIdentifier}
        publishedUrl=""
        onClose={onClose}
      />
    );

  function selectMode(nextMode: PublishMode) {
    setMode(nextMode);
    setError("");
    if (nextMode === "path" || nextMode === "subdomain")
      setAvailability(pathPattern.test(identifier) ? "checking" : "invalid");
    if (nextMode === "custom_domain") {
      setSelectedDomain("");
      setDomainCheck(validDomainLabel ? "checking" : "idle");
    }
  }

  function changeIdentifier(value: string) {
    const cleaned = cleanPath(value);
    setIdentifier(cleaned);
    setError("");
    if (mode === "path" || mode === "subdomain")
      setAvailability(pathPattern.test(cleaned) ? "checking" : "invalid");
  }

  function changeDomainLabel(value: string) {
    const cleaned = cleanDomainLabel(value);
    setDomainLabel(cleaned);
    setSelectedDomain("");
    setDomainCandidates([]);
    setDomainError("");
    setDomainCheck(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(cleaned) ? "checking" : "idle");
    setError("");
  }

  // Step 1: Submit configuration
  async function handleConfigureSubmit() {
    if (
      !draftId ||
      !draftReady ||
      !effectiveIdentifier ||
      (mode === "path" && (availability !== "available" || !validPathIdentifier)) ||
      (mode === "subdomain" && (availability !== "available" || !validPathIdentifier))
    )
      return;

    setError("");

    // Custom domain handled via WhatsApp quotation
    if (mode === "custom_domain") {
      setSubmitting(true);
      try {
        const response = await fetch(`/api/drafts/${draftId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, identifier: effectiveIdentifier }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Proses request domain gagal.");

        onResult({ status: "custom", mode: "custom_domain", identifier: effectiveIdentifier });
        const message = `Halo Admin, saya ingin meminta domain ${effectiveIdentifier} untuk draft ${draftId}. Domain telah terdeteksi tersedia dan tersimpan pada request publish saya.`;
        window.open(makeAdminWhatsAppUrl(message), "_blank", "noopener,noreferrer");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Proses publish gagal.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Free template: directly publish
    if (totalAmount === 0) {
      setSubmitting(true);
      try {
        const response = await fetch(`/api/drafts/${draftId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, identifier: effectiveIdentifier }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Proses publish gagal.");
        onResult({ status: "published", url: payload.url, mode: "path", identifier: effectiveIdentifier });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Proses publish gagal.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Move to QRIS checkout step
    setStep("payment_method");
  }

  // Step 2: Create payment session via Payment Gateway
  async function handleCreatePayment() {
    if (!draftId) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          mode,
          identifier: effectiveIdentifier,
          method: "QR",
          channel: "QRIS",
          phone: customerPhone || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal membuat sesi pembayaran.");
      }

      setPaymentData(payload.payment);
      setStep("waiting_payment");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal membuat pembayaran.");
    } finally {
      setSubmitting(false);
    }
  }

  // Manual payment check
  async function handleManualCheckPayment() {
    if (!draftId) return;
    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/payments/status?draftId=${encodeURIComponent(draftId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.paid) {
        onResult({
          status: "published",
          url: data.url || `${window.location.origin}/i/${effectiveIdentifier}`,
          mode: "path",
          identifier: effectiveIdentifier,
        });
      } else {
        alert("Pembayaran belum terdeteksi. Silakan selesaikan pembayaran QRIS terlebih dahulu.");
      }
    } catch {
      alert("Gagal memeriksa status pembayaran. Coba lagi.");
    } finally {
      setCheckingPayment(false);
    }
  }

  function copyText(val: string, key: string) {
    navigator.clipboard.writeText(val);
    setPaymentCopied(key);
    window.setTimeout(() => setPaymentCopied(null), 1800);
  }

  const configureDisabled =
    !draftReady ||
    submitting ||
    ((mode === "path" || mode === "subdomain") && (!validPathIdentifier || availability !== "available")) ||
    (mode === "custom_domain" && !selectedDomain);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.32)]">
        {/* Header */}
        <header className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            {step !== "configure" && (
              <button
                type="button"
                onClick={() => setStep(step === "waiting_payment" ? "payment_method" : "configure")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                aria-label="Kembali"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">
                <ShieldCheck size={14} />
                {step === "configure"
                  ? "Publish undangan"
                  : step === "payment_method"
                  ? "Pembayaran QRIS"
                  : "Scan QRIS"}
              </span>
              <h2 id="publish-dialog-title" className="mt-1 text-2xl font-extrabold text-slate-900">
                {step === "configure"
                  ? "Pilih alamat terbaik"
                  : step === "payment_method"
                  ? "Konfirmasi Pembayaran"
                  : "Selesaikan Pembayaran"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body */}
        <div className="max-h-[min(74vh,720px)] overflow-y-auto p-5 sm:p-6">
          {/* STEP 1: CONFIGURE */}
          {step === "configure" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <ModeCard
                  active={mode === "path"}
                  onClick={() => selectMode("path")}
                  icon={<Link2 size={20} />}
                  tone="emerald"
                  title="Path standar"
                  description={`${displayHost}/i/nama-anda`}
                  pricingDetail="Harga template"
                  badge={formatRupiah(templatePrice)}
                />
                <ModeCard
                  active={mode === "subdomain"}
                  onClick={() => selectMode("subdomain")}
                  icon={<Crown size={20} />}
                  tone="amber"
                  title="Subdomain"
                  description={`nama.${rootDomain}`}
                  pricingDetail={`${formatRupiah(templatePrice)} + layanan ${formatRupiah(subdomainFee)}`}
                  badge={`TOTAL ${formatRupiah(templatePrice + subdomainFee)}`}
                />
                <ModeCard
                  active={mode === "custom_domain"}
                  onClick={() => selectMode("custom_domain")}
                  icon={<Globe2 size={20} />}
                  tone="violet"
                  title="Custom domain"
                  description="Pilih .com, .id, .co, atau .space"
                  pricingDetail={`${formatRupiah(templatePrice)} + domain & layanan`}
                  badge="PENAWARAN ADMIN"
                />
              </div>

              {mode !== "custom_domain" ? (
                <>
                  <label className="mt-5 block text-xs font-bold text-slate-800">
                    {mode === "subdomain" ? "Nama subdomain yang diinginkan" : "Nama path"}
                    <div className="mt-2 flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-100">
                      {mode === "path" && (
                        <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          {displayHost}/i/
                        </span>
                      )}
                      <input
                        value={identifier}
                        onChange={(event) => changeIdentifier(event.target.value)}
                        placeholder="ayuardi"
                        className="min-w-0 flex-1 border-0 px-3 py-3 text-sm outline-none"
                      />
                      {mode === "subdomain" && (
                        <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          .{rootDomain}
                        </span>
                      )}
                    </div>
                  </label>
                  <AvailabilityNotice state={availability} message={availabilityMessage} />
                  {mode === "subdomain" && (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">
                      Total {formatRupiah(templatePrice + subdomainFee)} terdiri dari harga template{" "}
                      {formatRupiah(templatePrice)} dan tambahan layanan subdomain {formatRupiah(subdomainFee)}.
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5">
                  <label className="block text-xs font-bold text-slate-800">
                    Nama domain
                    <div className="mt-2 flex items-center rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-violet-500 focus-within:ring-3 focus-within:ring-violet-100">
                      <input
                        value={domainLabel}
                        onChange={(event) => changeDomainLabel(event.target.value)}
                        placeholder="ayuardi"
                        className="min-w-0 flex-1 rounded-2xl border-0 px-4 py-3 text-sm outline-none"
                      />
                      {domainCheck === "checking" && (
                        <LoaderCircle size={17} className="mr-4 animate-spin text-violet-600" />
                      )}
                    </div>
                  </label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2" aria-live="polite">
                    {domainCheck === "checking" && domainCandidates.length === 0
                      ? ["com", "id", "co", "space"].map((tld) => (
                          <div key={tld} className="h-[74px] animate-pulse rounded-2xl bg-slate-100" />
                        ))
                      : domainCandidates.map((candidate) => (
                          <DomainOption
                            key={candidate.domain}
                            candidate={candidate}
                            selected={selectedDomain === candidate.domain}
                            onSelect={() => setSelectedDomain(candidate.domain)}
                          />
                        ))}
                  </div>
                  {domainCheck === "error" && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                      <XCircle size={15} />
                      {domainError}
                    </div>
                  )}
                  {!validDomainLabel && domainLabel && (
                    <p className="mt-2 text-xs font-semibold text-rose-600">Nama domain belum valid.</p>
                  )}
                  <div className="mt-3 rounded-xl bg-violet-50 px-3 py-3 text-xs leading-5 text-violet-800">
                    Biaya custom domain terdiri dari harga template {formatRupiah(templatePrice)} ditambah harga
                    domain dan layanan konfigurasi. Nilai tambahannya dikonfirmasi admin.
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={configureDisabled}
                onClick={handleConfigureSubmit}
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  mode === "path"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : mode === "subdomain"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {submitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : mode === "custom_domain" ? (
                  <MessageCircle size={18} />
                ) : (
                  <Sparkles size={18} />
                )}
                {submitting
                  ? "Memproses..."
                  : mode === "custom_domain"
                  ? selectedDomain
                    ? `Request ${selectedDomain}`
                    : "Pilih domain tersedia"
                  : `Lanjut ke Pembayaran · ${formatRupiah(totalAmount)}`}
              </button>
            </>
          )}

          {/* STEP 2: PAYMENT METHOD (QRIS ONLY) */}
          {step === "payment_method" && (
            <div className="space-y-5">
              {/* Order Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Ringkasan Pesanan
                </span>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Alamat Undangan ({mode === "path" ? "Path" : "Subdomain"})</span>
                    <span className="font-mono text-slate-900">
                      {mode === "path" ? `${displayHost}/i/${effectiveIdentifier}` : `${effectiveIdentifier}.${rootDomain}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Harga Template</span>
                    <span>{formatRupiah(templatePrice)}</span>
                  </div>
                  {mode === "subdomain" && (
                    <div className="flex justify-between text-slate-600">
                      <span>Layanan Subdomain</span>
                      <span>{formatRupiah(subdomainFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-emerald-700">
                    <span>Total Pembayaran</span>
                    <span>{formatRupiah(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* QRIS Card */}
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 ring-2 ring-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-extrabold text-slate-900">QRIS</strong>
                        <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[9px] font-extrabold text-emerald-900">
                          Otomatis Terverifikasi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        BCA, Livin, GoPay, OVO, Dana, ShopeePay & semua aplikasi m-Banking
                      </p>
                    </div>
                  </div>
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white">
                    <Check size={14} />
                  </div>
                </div>
              </div>

              {/* Phone number (defaulted from auth) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nomor Handphone / WhatsApp
                </label>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Smartphone size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full border-0 outline-none text-xs text-slate-800 font-semibold"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Nomor ini otomatis terisi dari akun Anda untuk penerbitan resi pembayaran.
                </p>
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={handleCreatePayment}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <QrCode size={18} />}
                {submitting ? "Membuat QRIS..." : `Bayar dengan QRIS · ${formatRupiah(totalAmount)}`}
              </button>
            </div>
          )}

          {/* STEP 3: WAITING PAYMENT (CLEAN DECODED QRIS WITHOUT FRAME) */}
          {step === "waiting_payment" && (
            <div className="space-y-5">
              {/* Total Amount Card */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Total yang harus dibayar
                </span>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-emerald-700">{formatRupiah(totalAmount)}</span>
                  <button
                    type="button"
                    onClick={() => copyText(String(totalAmount), "amount")}
                    className="rounded-lg bg-white/80 p-1 text-slate-600 hover:bg-white shadow-xs"
                    title="Salin nominal"
                  >
                    {paymentCopied === "amount" ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <Clock size={12} className="text-emerald-700" />
                  <span>Selesaikan sebelum 15 menit ke depan</span>
                </div>
              </div>

              {/* Clean QRIS Container without flyer / bingkai */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900">QRIS Standar Nasional</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    Semua Bank & E-Wallet
                  </span>
                </div>

                {/* Pure QR Code Canvas (without Seva / Pivot frame) */}
                <div className="relative my-3 flex items-center justify-center min-h-[240px] min-w-[240px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {decodingQR && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 rounded-2xl">
                      <LoaderCircle size={26} className="animate-spin text-emerald-600 mb-2" />
                      <span className="text-[11px] font-bold text-slate-600">Memuat QR Code...</span>
                    </div>
                  )}
                  <canvas ref={qrCanvasRef} className="rounded-xl" />
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-600 max-w-sm">
                  Buka BCA, Livin, GoPay, OVO, Dana, ShopeePay, atau m-Banking Anda, lalu scan QR di atas.
                </p>
              </div>

              {/* Realtime Status Indicator */}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 px-4 py-3 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <LoaderCircle size={16} className="animate-spin text-emerald-600" />
                  <span>Mengecek pembayaran secara realtime...</span>
                </div>
                <button
                  type="button"
                  disabled={checkingPayment}
                  onClick={handleManualCheckPayment}
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  <RefreshCw size={12} className={checkingPayment ? "animate-spin" : ""} />
                  Cek Sekarang
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("configure")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                >
                  Batal / Ganti Alamat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublishStatusModal({
  status,
  identifier,
  publishedUrl,
  onClose,
}: {
  status: "published" | "custom";
  identifier: string;
  publishedUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isPublished = status === "published";
  const liveUrl =
    publishedUrl || (typeof window !== "undefined" ? `${window.location.origin}/i/${identifier}` : "");

  const copyUrl = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-status-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.32)]">
        <header
          className={`flex items-start justify-between px-6 py-5 ${
            isPublished
              ? "bg-gradient-to-r from-emerald-50 to-white"
              : "bg-gradient-to-r from-amber-50 to-white"
          }`}
        >
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] ${
                isPublished ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isPublished ? <CheckCircle2 size={14} /> : <LoaderCircle size={14} />}{" "}
              {isPublished ? "Undangan telah published" : "Request custom sedang diproses"}
            </span>
            <h2 id="publish-status-title" className="mt-1 text-2xl font-extrabold text-slate-900">
              {isPublished ? "Undangan Anda sudah aktif" : "Menunggu konfirmasi admin"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isPublished
                ? "Alamat undangan sudah siap dibagikan kepada para tamu."
                : "Alamat khusus Anda telah dicatat dan akan diaktifkan setelah proses admin selesai."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-6">
          {isPublished ? (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-emerald-700">
                  URL undangan aktif
                </span>
                <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">{liveUrl}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                >
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  {copied ? "Tersalin" : "Salin URL"}
                </button>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700"
                >
                  Buka undangan <ExternalLink size={14} />
                </a>
              </div>
              <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">
                Gunakan menu Generator untuk membuat tautan personal dengan nama setiap tamu.
              </p>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-amber-700">
                  Alamat yang diminta
                </span>
                <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
                  {identifier || "Alamat custom"}
                </p>
                <p className="mt-2 text-xs leading-5 text-amber-800">
                  Kami akan menghubungi Anda setelah domain atau subdomain selesai dikonfigurasi.
                </p>
              </div>
              <a
                href={makeAdminWhatsAppUrl(
                  `Halo Admin, saya ingin menindaklanjuti request custom ${
                    identifier || "undangan saya"
                  }.`
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-amber-700"
              >
                Hubungi admin <ExternalLink size={14} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  tone,
  title,
  description,
  pricingDetail,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "violet";
  title: string;
  description: string;
  pricingDetail: string;
  badge: string;
}) {
  const activeClass =
    tone === "emerald"
      ? "border-emerald-600 bg-emerald-50 ring-emerald-100"
      : tone === "amber"
      ? "border-amber-500 bg-amber-50 ring-amber-100"
      : "border-violet-500 bg-violet-50 ring-violet-100";
  const iconClass =
    tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-violet-600";
  const badgeClass =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-violet-100 text-violet-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? `${activeClass} ring-2` : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className={iconClass}>{icon}</span>
      <b className="mt-3 block text-sm text-slate-900">{title}</b>
      <small className="mt-1 block text-[10px] leading-4 text-slate-500">{description}</small>
      <small className="mt-2 block min-h-8 text-[9px] font-semibold leading-4 text-slate-600">
        {pricingDetail}
      </small>
      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ${badgeClass}`}>
        {badge}
      </span>
    </button>
  );
}

function AvailabilityNotice({ state, message }: { state: Availability; message: string }) {
  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${
        state === "available"
          ? "bg-emerald-50 text-emerald-700"
          : state === "unavailable" || state === "invalid"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-50 text-slate-500"
      }`}
    >
      {state === "checking" || state === "idle" ? (
        <LoaderCircle size={15} className="animate-spin" />
      ) : state === "available" ? (
        <CheckCircle2 size={15} />
      ) : (
        <XCircle size={15} />
      )}
      <span>
        {state === "checking" || state === "idle"
          ? "Mengecek ketersediaan secara realtime..."
          : state === "invalid"
          ? "Gunakan 3–63 karakter: huruf kecil, angka, atau tanda hubung."
          : message}
      </span>
    </div>
  );
}

function DomainOption({
  candidate,
  selected,
  onSelect,
}: {
  candidate: DomainCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const available = candidate.status === "available";
  const tone = available
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
    : candidate.status === "taken"
    ? "border-rose-100 bg-rose-50 text-rose-700"
    : "border-amber-100 bg-amber-50 text-amber-800";

  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      className={`relative rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed ${tone} ${
        selected ? "ring-2 ring-violet-500 ring-offset-2" : ""
      }`}
    >
      <span className="block truncate text-sm font-extrabold">{candidate.domain}</span>
      <span className="mt-1 flex items-center gap-1 text-[10px] font-bold">
        {available ? (
          selected ? (
            <Check size={12} />
          ) : (
            <CheckCircle2 size={12} />
          )
        ) : candidate.status === "taken" ? (
          <XCircle size={12} />
        ) : (
          <RefreshCw size={12} />
        )}
        {candidate.message}
      </span>
    </button>
  );
}
