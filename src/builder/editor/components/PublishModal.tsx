"use client";

import { Check, CheckCircle2, Copy, Crown, ExternalLink, Globe2, Link2, LoaderCircle, MessageCircle, RefreshCw, ShieldCheck, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { makeAdminWhatsAppUrl } from "@/config/contact";
import { getAppBaseUrl } from "@/lib/app-url";

type PublishMode = "path" | "subdomain" | "custom_domain";
type Availability = "idle" | "checking" | "available" | "unavailable" | "invalid";
type DomainStatus = "available" | "taken" | "unknown";
type DomainCandidate = { domain: string; tld: "com" | "id" | "co" | "space"; status: DomainStatus; checkedAt: string; source: "rdap" | "whois"; message: string };

export type PublishResult =
  | { status: "published"; url: string; mode: "path"; identifier: string }
  | { status: "custom"; mode: "subdomain" | "custom_domain"; identifier: string };

const pathPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

function cleanPath(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function cleanDomainLabel(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").split(".")[0]?.replace(/[^a-z0-9-]/g, "") ?? "";
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function PublishModal({ open, draftId, draftReady, initialIdentifier, templatePrice, currentStatus = "draft", publishedUrl = "", onClose, onResult }: { open: boolean; draftId: string | null; draftReady: boolean; initialIdentifier: string; templatePrice: number; currentStatus?: "draft" | "published" | "custom"; publishedUrl?: string; onClose: () => void; onResult: (result: PublishResult) => void }) {
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
  const displayHost = getAppBaseUrl().replace(/^https?:\/\//, "");
  const rootDomain = "undangan.co";
  const subdomainFee = 50_000;
  const subdomainTotal = templatePrice + subdomainFee;

  const validPathIdentifier = useMemo(() => pathPattern.test(identifier), [identifier]);
  const validDomainLabel = useMemo(() => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domainLabel), [domainLabel]);
  const effectiveIdentifier = mode === "custom_domain" ? selectedDomain : identifier;

  useEffect(() => {
    if (!open || (mode !== "path" && mode !== "subdomain") || !validPathIdentifier || !draftId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/publish/availability?mode=${mode}&identifier=${encodeURIComponent(identifier)}&excludeDraftId=${encodeURIComponent(draftId)}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Pengecekan gagal."); return payload; })
        .then((payload) => { setAvailability(payload.available ? "available" : "unavailable"); setAvailabilityMessage(payload.reason ?? ""); })
        .catch((reason) => { if (!controller.signal.aborted) { setAvailability("unavailable"); setAvailabilityMessage(reason instanceof Error ? reason.message : "Pengecekan gagal."); } });
    }, 350);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [draftId, identifier, mode, open, validPathIdentifier]);

  useEffect(() => {
    if (!open || mode !== "custom_domain" || !validDomainLabel) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/domains/availability?name=${encodeURIComponent(domainLabel)}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Pengecekan domain gagal."); return payload; })
        .then((payload: { candidates: DomainCandidate[] }) => { setDomainCandidates(payload.candidates); setDomainCheck("done"); setDomainError(""); })
        .catch((reason) => { if (!controller.signal.aborted) { setDomainCandidates([]); setDomainCheck("error"); setDomainError(reason instanceof Error ? reason.message : "Pengecekan domain gagal."); } });
    }, 500);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [domainLabel, mode, open, validDomainLabel]);

  if (!open) return null;
  if (currentStatus === "published") return <PublishStatusModal status="published" identifier={initialIdentifier} publishedUrl={publishedUrl} onClose={onClose} />;
  if (currentStatus === "custom") return <PublishStatusModal status="custom" identifier={initialIdentifier} publishedUrl="" onClose={onClose} />;

  function selectMode(nextMode: PublishMode) {
    setMode(nextMode);
    setError("");
    if (nextMode === "path" || nextMode === "subdomain") setAvailability(pathPattern.test(identifier) ? "checking" : "invalid");
    if (nextMode === "custom_domain") {
      setSelectedDomain("");
      setDomainCheck(validDomainLabel ? "checking" : "idle");
    }
  }

  function changeIdentifier(value: string) {
    const cleaned = cleanPath(value);
    setIdentifier(cleaned);
    setError("");
    if (mode === "path" || mode === "subdomain") setAvailability(pathPattern.test(cleaned) ? "checking" : "invalid");
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

  async function submit() {
    if (!draftId || !draftReady || !effectiveIdentifier || (mode === "path" && (availability !== "available" || !validPathIdentifier))) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/drafts/${draftId}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, identifier: effectiveIdentifier }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Proses publish gagal.");
      if (payload.status === "published") onResult({ status: "published", url: payload.url, mode: "path", identifier: effectiveIdentifier });
      else {
        onResult({ status: "custom", mode: mode as "subdomain" | "custom_domain", identifier: effectiveIdentifier });
        if (mode === "custom_domain") {
          const message = `Halo Admin, saya ingin meminta domain ${effectiveIdentifier} untuk draft ${draftId}. Domain telah terdeteksi tersedia dan tersimpan pada request publish saya.`;
          window.open(makeAdminWhatsAppUrl(message), "_blank", "noopener,noreferrer");
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Proses publish gagal.");
      if (mode === "path") setAvailability("unavailable");
      if (mode === "custom_domain") {
        setSelectedDomain("");
        setDomainCheck("checking");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const buttonDisabled = !draftReady || submitting || ((mode === "path" || mode === "subdomain") && (!validPathIdentifier || availability !== "available")) || (mode === "custom_domain" && !selectedDomain);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.32)]">
        <header className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
          <div><span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700"><ShieldCheck size={14} /> Publish undangan</span><h2 id="publish-dialog-title" className="mt-1 text-2xl font-extrabold text-slate-900">Pilih alamat terbaik</h2><p className="mt-1 text-xs text-slate-500">Harga dasar mengikuti template. Alamat khusus memiliki biaya layanan tambahan.</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100" aria-label="Tutup"><X size={18} /></button>
        </header>

        <div className="max-h-[min(74vh,720px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <ModeCard active={mode === "path"} onClick={() => selectMode("path")} icon={<Link2 size={20} />} tone="emerald" title="Path standar" description={`${displayHost}/i/nama-anda`} pricingDetail="Harga template" badge={formatRupiah(templatePrice)} />
            <ModeCard active={mode === "subdomain"} onClick={() => selectMode("subdomain")} icon={<Crown size={20} />} tone="amber" title="Subdomain" description={`nama.${rootDomain}`} pricingDetail={`${formatRupiah(templatePrice)} + layanan ${formatRupiah(subdomainFee)}`} badge={`TOTAL ${formatRupiah(subdomainTotal)}`} />
            <ModeCard active={mode === "custom_domain"} onClick={() => selectMode("custom_domain")} icon={<Globe2 size={20} />} tone="violet" title="Custom domain" description="Pilih .com, .id, .co, atau .space" pricingDetail={`${formatRupiah(templatePrice)} + domain & layanan`} badge="PENAWARAN ADMIN" />
          </div>

          {mode !== "custom_domain" ? (
            <>
              <label className="mt-5 block text-xs font-bold text-slate-800">{mode === "subdomain" ? "Nama subdomain yang diinginkan" : "Nama path"}<div className="mt-2 flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-100">{mode === "path" && <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">{displayHost}/i/</span>}<input value={identifier} onChange={(event) => changeIdentifier(event.target.value)} placeholder="ayuardi" className="min-w-0 flex-1 border-0 px-3 py-3 text-sm outline-none" />{mode === "subdomain" && <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">.{rootDomain}</span>}</div></label>
              <AvailabilityNotice state={availability} message={availabilityMessage} />
              {mode === "subdomain" && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">Total {formatRupiah(subdomainTotal)} terdiri dari harga template {formatRupiah(templatePrice)} dan tambahan layanan subdomain {formatRupiah(subdomainFee)}. Permintaan dikonfirmasi admin sebelum aktif.</div>}
            </>
          ) : (
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-800">Nama domain<div className="mt-2 flex items-center rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-violet-500 focus-within:ring-3 focus-within:ring-violet-100"><input value={domainLabel} onChange={(event) => changeDomainLabel(event.target.value)} placeholder="ayuardi" className="min-w-0 flex-1 rounded-2xl border-0 px-4 py-3 text-sm outline-none" />{domainCheck === "checking" && <LoaderCircle size={17} className="mr-4 animate-spin text-violet-600" />}</div></label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2" aria-live="polite">
                {domainCheck === "checking" && domainCandidates.length === 0 ? ["com", "id", "co", "space"].map((tld) => <div key={tld} className="h-[74px] animate-pulse rounded-2xl bg-slate-100" />) : domainCandidates.map((candidate) => <DomainOption key={candidate.domain} candidate={candidate} selected={selectedDomain === candidate.domain} onSelect={() => setSelectedDomain(candidate.domain)} />)}
              </div>
              {domainCheck === "error" && <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700"><XCircle size={15} />{domainError}</div>}
              {!validDomainLabel && domainLabel && <p className="mt-2 text-xs font-semibold text-rose-600">Nama domain belum valid.</p>}
              <div className="mt-3 rounded-xl bg-violet-50 px-3 py-3 text-xs leading-5 text-violet-800">Biaya custom domain terdiri dari harga template {formatRupiah(templatePrice)} ditambah harga domain dan layanan konfigurasi. Nilai tambahannya dikonfirmasi admin. Pilihan dan waktu pengecekan tetap tersimpan agar domain tidak tertukar.</div>
            </div>
          )}

          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{error}</p>}
          <button type="button" disabled={buttonDisabled} onClick={submit} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-45 ${mode === "path" ? "bg-emerald-600 hover:bg-emerald-700" : mode === "subdomain" ? "bg-amber-600 hover:bg-amber-700" : "bg-violet-600 hover:bg-violet-700"}`}>{submitting ? <LoaderCircle size={18} className="animate-spin" /> : mode === "path" ? <CheckCircle2 size={18} /> : mode === "subdomain" ? <Crown size={18} /> : <MessageCircle size={18} />}{submitting ? "Memproses..." : mode === "path" ? `Publish · ${formatRupiah(templatePrice)}` : mode === "subdomain" ? `Request · ${formatRupiah(subdomainTotal)}` : selectedDomain ? <>Request {selectedDomain} <ExternalLink size={14} /></> : "Pilih domain tersedia"}</button>
        </div>
      </div>
    </div>
  );
}

function PublishStatusModal({ status, identifier, publishedUrl, onClose }: { status: "published" | "custom"; identifier: string; publishedUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const isPublished = status === "published";
  const liveUrl = publishedUrl || (typeof window !== "undefined" ? `${window.location.origin}/i/${identifier}` : "");
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
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="publish-status-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.32)]">
        <header className={`flex items-start justify-between px-6 py-5 ${isPublished ? "bg-gradient-to-r from-emerald-50 to-white" : "bg-gradient-to-r from-amber-50 to-white"}`}>
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] ${isPublished ? "text-emerald-700" : "text-amber-700"}`}>{isPublished ? <CheckCircle2 size={14} /> : <LoaderCircle size={14} />} {isPublished ? "Undangan telah published" : "Request custom sedang diproses"}</span>
            <h2 id="publish-status-title" className="mt-1 text-2xl font-extrabold text-slate-900">{isPublished ? "Undangan Anda sudah aktif" : "Menunggu konfirmasi admin"}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{isPublished ? "Alamat undangan sudah siap dibagikan kepada para tamu." : "Alamat khusus Anda telah dicatat dan akan diaktifkan setelah proses admin selesai."}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100" aria-label="Tutup"><X size={18} /></button>
        </header>
        <div className="p-6">
          {isPublished ? (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-emerald-700">URL undangan aktif</span>
                <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">{liveUrl}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={copyUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50">{copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />} {copied ? "Tersalin" : "Salin URL"}</button>
                <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700">Buka undangan <ExternalLink size={14} /></a>
              </div>
              <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Gunakan halaman Generator untuk membuat tautan personal dengan nama setiap tamu.</p>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-amber-700">Alamat yang diminta</span><p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">{identifier || "Alamat custom"}</p><p className="mt-2 text-xs leading-5 text-amber-800">Kami akan menghubungi Anda setelah domain atau subdomain selesai dikonfigurasi.</p></div>
              <a href={makeAdminWhatsAppUrl(`Halo Admin, saya ingin menindaklanjuti request custom ${identifier || "undangan saya"}.`)} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-amber-700">Hubungi admin <ExternalLink size={14} /></a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, tone, title, description, pricingDetail, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; tone: "emerald" | "amber" | "violet"; title: string; description: string; pricingDetail: string; badge: string }) {
  const activeClass = tone === "emerald" ? "border-emerald-600 bg-emerald-50 ring-emerald-100" : tone === "amber" ? "border-amber-500 bg-amber-50 ring-amber-100" : "border-violet-500 bg-violet-50 ring-violet-100";
  const iconClass = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-violet-600";
  const badgeClass = tone === "emerald" ? "bg-emerald-100 text-emerald-700" : tone === "amber" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-700";
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? `${activeClass} ring-2` : "border-slate-200 hover:border-slate-300"}`}><span className={iconClass}>{icon}</span><b className="mt-3 block text-sm text-slate-900">{title}</b><small className="mt-1 block text-[10px] leading-4 text-slate-500">{description}</small><small className="mt-2 block min-h-8 text-[9px] font-semibold leading-4 text-slate-600">{pricingDetail}</small><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ${badgeClass}`}>{badge}</span></button>;
}

function AvailabilityNotice({ state, message }: { state: Availability; message: string }) {
  return <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${state === "available" ? "bg-emerald-50 text-emerald-700" : state === "unavailable" || state === "invalid" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-500"}`}>{state === "checking" || state === "idle" ? <LoaderCircle size={15} className="animate-spin" /> : state === "available" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}<span>{state === "checking" || state === "idle" ? "Mengecek ketersediaan secara realtime..." : state === "invalid" ? "Gunakan 3–63 karakter: huruf kecil, angka, atau tanda hubung." : message}</span></div>;
}

function DomainOption({ candidate, selected, onSelect }: { candidate: DomainCandidate; selected: boolean; onSelect: () => void }) {
  const available = candidate.status === "available";
  const tone = available ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400" : candidate.status === "taken" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-amber-100 bg-amber-50 text-amber-800";
  return <button type="button" disabled={!available} onClick={onSelect} className={`relative rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed ${tone} ${selected ? "ring-2 ring-violet-500 ring-offset-2" : ""}`}><span className="block truncate text-sm font-extrabold">{candidate.domain}</span><span className="mt-1 flex items-center gap-1 text-[10px] font-bold">{available ? selected ? <Check size={12} /> : <CheckCircle2 size={12} /> : candidate.status === "taken" ? <XCircle size={12} /> : <RefreshCw size={12} />}{candidate.message}</span></button>;
}
