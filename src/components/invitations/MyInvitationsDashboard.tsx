"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, ExternalLink, FilePenLine, Layers, LoaderCircle, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Draft = {
  id: string;
  title: string;
  templateCode: string;
  templateName: string;
  category: string;
  coverImage: string;
  status: "draft" | "published" | "custom" | "archived";
  slug: string | null;
  subdomain: string | null;
  updatedAt: string;
  isCollaborator?: boolean;
};

const statusMeta = {
  draft: { label: "Draf", tone: "neutral" as const },
  published: { label: "Diterbitkan", tone: "success" as const },
  custom: { label: "Menunggu alamat", tone: "warning" as const },
  archived: { label: "Kedaluwarsa", tone: "danger" as const },
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function MyInvitationsDashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/drafts", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Gagal memuat undangan.");
        if (active) setDrafts(payload.drafts ?? []);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Gagal memuat undangan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    total: drafts.length,
    active: drafts.filter((draft) => draft.status === "published").length,
    draft: drafts.filter((draft) => draft.status === "draft").length,
    shared: drafts.filter((draft) => draft.isCollaborator).length,
  }), [drafts]);

  const summary = [
    { label: "Total undangan", value: stats.total, Icon: Layers },
    { label: "Sudah diterbitkan", value: stats.active, Icon: Check },
    { label: "Masih draf", value: stats.draft, Icon: FilePenLine },
    { label: "Kolaborasi", value: stats.shared, Icon: Users },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-700">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Undangan Saya</h1>
            <p className="mt-2 text-sm text-slate-500">Kelola draf, undangan aktif, dan kolaborasi Anda dalam satu tempat.</p>
          </div>
          <Link href="/#templates" className="ui-interactive inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus size={16} /> Buat undangan
          </Link>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map(({ label, value, Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <Icon size={17} className="text-slate-500" />
              <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Undangan terbaru</h2>
            <span className="text-xs text-slate-500">{drafts.length} undangan</span>
          </div>

          {loading ? (
            <div className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
              <span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Memuat undangan…</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
          ) : drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Layers className="mx-auto text-slate-400" size={24} />
              <h3 className="mt-3 text-sm font-semibold">Belum ada undangan</h3>
              <p className="mt-1 text-sm text-slate-500">Mulai dari template untuk membuat undangan pertama Anda.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {drafts.map((draft) => {
                const status = statusMeta[draft.status];
                const invitationUrl = draft.slug ? `/i/${draft.slug}` : draft.subdomain ? `https://${draft.subdomain}` : null;

                return (
                  <article key={draft.id} className="ui-interactive group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-md">
                    <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image src={draft.coverImage} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{draft.title}</h3>
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{draft.templateName} · {draft.category}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={13} /> Diperbarui {dateFormatter.format(new Date(draft.updatedAt))}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Link href={`/editor/${draft.templateCode}/${draft.id}`} className="ui-interactive inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                          <FilePenLine size={13} /> Buka editor
                        </Link>
                        {invitationUrl && <a href={invitationUrl} target="_blank" rel="noreferrer" className="ui-interactive inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><ExternalLink size={13} /> Lihat</a>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
