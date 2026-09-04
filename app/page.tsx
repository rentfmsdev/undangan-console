"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Search,
  Heart,
  Calendar,
  SlidersHorizontal,
  ArrowRight,
  Eye,
  Check,
  Palette,
  Layers,
  Smartphone,
  ExternalLink,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  Wand2,
  Send,
  CheckCircle2,
  Instagram,
} from "lucide-react";
import { templatesCatalog } from "@/templates/registry";
import type { TemplateCatalogItem } from "@/templates/contracts";
import { UserAuthDropdown } from "@/components/auth/UserAuthDropdown";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { MyInvitationsModal } from "@/components/invitations/MyInvitationsModal";

export type TemplateItem = TemplateCatalogItem;

// Ambil template langsung dari database / file standar templates.json
const TEMPLATES: TemplateItem[] = templatesCatalog;

const CATEGORIES = [
  { id: "all", label: "Semua Kategori" },
  { id: "pernikahan", label: "Pernikahan" },
  { id: "khitanan", label: "Khitanan" },
  { id: "aqiqah", label: "Aqiqah" },
  { id: "ulang-tahun", label: "Ulang Tahun" },
  { id: "wisuda", label: "Wisuda" },
] as const;

export default function MarketplaceHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"release-desc" | "release-asc" | "favorite-desc" | "name-asc">("release-desc");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ hjydg: true });
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isMyInvitationsOpen, setIsMyInvitationsOpen] = useState(false);
  const [coverIndices, setCoverIndices] = useState<Record<string, number>>({});

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleNextCover = (code: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCoverIndices((prev) => ({ ...prev, [code]: ((prev[code] ?? 0) + 1) % total }));
  };

  const handlePrevCover = (code: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCoverIndices((prev) => ({ ...prev, [code]: ((prev[code] ?? 0) - 1 + total) % total }));
  };

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAvailable = onlyAvailable ? item.status === "available" : true;
      return matchesCategory && matchesSearch && matchesAvailable;
    }).sort((a, b) => {
      if (sortBy === "release-desc") {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      if (sortBy === "release-asc") {
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      }
      if (sortBy === "favorite-desc") {
        const favA = (favorites[a.code] ? a.favoriteCount + 1 : a.favoriteCount);
        const favB = (favorites[b.code] ? b.favoriteCount + 1 : b.favoriteCount);
        return favB - favA;
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, sortBy, onlyAvailable, favorites]);

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; avatarUrl: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => { })
      .finally(() => setAuthResolved(true));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <GoogleOneTap enabled={authResolved && !currentUser} onAuthenticated={setCurrentUser} />
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl transition group-hover:scale-105">
              <Image src="/assets/fav.png" width={40} height={40} alt="Undangan Studio" className="h-full w-full object-cover" priority />
            </div>
            <div>
              <span className="block text-base font-extrabold text-slate-900 leading-tight">Undangan Studio</span>
              <span className="block text-[11px] font-semibold text-slate-500">Marketplace & Builder</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <UserAuthDropdown
              user={currentUser}
              onLoginClick={() => setIsAuthModalOpen(true)}
              onLogout={() => setCurrentUser(null)}
              onMyInvitationsClick={() => setIsMyInvitationsOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Product landing hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_8%_18%,rgba(16,185,129,.15),transparent_28%),radial-gradient(circle_at_90%_6%,rgba(59,130,246,.12),transparent_26%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)] px-4 py-12 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-[.42] [background-image:linear-gradient(rgba(16,185,129,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.10)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="max-w-2xl">
            <h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl sm:leading-[1.04]">
              Buat undangan yang terasa <span className="text-emerald-600">istimewa.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Pilih template, ubah isi dan visual secara realtime, lalu ajak pasangan atau keluarga menyempurnakan undangan dari satu studio yang sama.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#templates" className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:-translate-y-0.5">Mulai undangan pertama <ArrowRight size={16} /></a>
              {/* <Link href="/demo/wedding-elegance" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"><Eye size={16} /> Lihat demo</Link> */}
            </div>
            <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              {["Tanpa instal aplikasi", "Tersimpan otomatis", "Manajemen Tamu", "Siap dibagikan"].map((item) => <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" />{item}</div>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[630px]">
            <div className="absolute -inset-5 rounded-[40px] bg-emerald-200/35 blur-3xl" />
            <Image src="/assets/landing/sparkle-orbit.svg" width={180} height={160} alt="" aria-hidden="true" className="pointer-events-none absolute -left-16 -top-12 z-10 w-32 sm:w-40" />
            <Image src="/assets/landing/leafy-corner.svg" width={215} height={180} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-14 -right-12 z-10 w-36 sm:w-48" />
            <Image src="/assets/landing/collab-cursor.svg" width={92} height={100} alt="" aria-hidden="true" className="pointer-events-none absolute -right-5 top-1/4 z-20 hidden w-16 sm:block" />
            <div className="relative rounded-[30px] border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-2 shadow-[0_28px_70px_rgba(15,23,42,.22)]">
              <div className="pointer-events-none absolute inset-3 rounded-[23px] border border-white/90" />
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-1 shadow-inner">
                <Image
                  src="/assets/editor-mockup.png"
                  width={2859}
                  height={1671}
                  priority
                  alt="Tampilan visual editor Undangan Studio dengan preview undangan realtime"
                  className="h-auto w-full rounded-[19px]"
                />
              </div>
            </div>
            <div className="absolute -bottom-4 left-6 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-700 shadow-lg shadow-slate-300/50"><span className="h-2 w-2 rounded-full bg-emerald-500" />Perubahan tersimpan realtime</div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {[
            [Wand2, "Edit dengan visual", "Teks, warna, font, foto, musik, dan section tampil langsung di preview."],
            [UsersRound, "Kolaborasi dengan pasangan", "Undang pasangan atau keluarga untuk ikut menyempurnakan satu undangan."],
            [Send, "Terbitkan & bagikan", "Generator nama tamu dan link undangan siap dibagikan setelah dipublikasikan."],
          ].map(([Icon, title, description], index) => { const FeatureIcon = Icon as typeof Wand2; return <article key={title as string} className="landing-feature-card group relative flex gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-4" style={{ animationDelay: `${index * 3.33}s` }}><span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-600/25"><FeatureIcon size={19} /></span><div className="relative z-10"><h2 className="text-sm font-extrabold text-slate-900 transition group-hover:text-emerald-700">{title as string}</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">{description as string}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 opacity-0 transition duration-300 group-hover:opacity-100">Pelajari fitur <ArrowRight size={11} /></span></div></article>; })}
        </div>
      </section>

      {/* Main Content Area */}
      <main id="templates" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-8 sm:py-12">
        {/* Filter and Sorting Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Right Filters: Sort By & Toggle Ready */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Hanya Siap Pakai</span>
            </label>

            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <SlidersHorizontal size={14} className="text-slate-400" />
              <span>Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-emerald-700 outline-none cursor-pointer"
              >
                <option value="release-desc">Terbaru (Date Release)</option>
                <option value="release-asc">Terlama</option>
                <option value="favorite-desc">Paling Favorit</option>
                <option value="name-asc">Nama (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count Summary */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">
            Menampilkan <strong className="text-slate-900">{filteredTemplates.length}</strong> template
            {selectedCategory !== "all" && ` dalam kategori "${CATEGORIES.find((c) => c.id === selectedCategory)?.label}"`}
          </p>
        </div>

        {/* Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="my-16 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Search size={26} />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-900">Tidak ada template ditemukan</h3>
            <p className="mt-1 text-xs text-slate-500">Coba ubah kata kunci pencarian atau ganti filter kategori.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setOnlyAvailable(false);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredTemplates.map((template) => {
              const isFav = Boolean(favorites[template.code]);
              const effectiveFavCount = isFav ? template.favoriteCount + 1 : template.favoriteCount;
              const isReady = template.status === "available";

              return (
                <div
                  key={template.code}
                  className="group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
                >
                  {/* Left Column: Phone Mockup Showcase */}
                  <div className="relative w-full md:w-[260px] lg:w-[280px] shrink-0 bg-gradient-to-b from-slate-100 via-[#f8f5ee] to-slate-200/90 p-5 flex flex-col justify-between items-center min-h-[360px] md:min-h-[400px]">
                    {/* Top Badges */}
                    <div className="w-full flex items-center justify-between gap-2 z-10">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 backdrop-blur-md shadow-sm">
                        {template.categoryLabel}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(template.code);
                        }}
                        className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md shadow-sm transition active:scale-90 ${isFav ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-white/90 text-slate-700 hover:bg-white"
                          }`}
                        aria-label="Simpan ke favorit"
                      >
                        <Heart size={15} className={isFav ? "fill-white" : ""} />
                      </button>
                    </div>

                    {/* Centered Phone Mockup with Slider support */}
                    <div className="relative w-full h-[270px] md:h-[290px] my-auto flex items-center justify-center">
                      {(() => {
                        const covers = template.covers && template.covers.length > 0 ? template.covers : ["/thumb/wedding-elegance.png"];
                        const activeCoverIdx = (coverIndices[template.code] ?? 0) % covers.length;
                        const currentCover = covers[activeCoverIdx] ?? covers[0];
                        const hasMultipleCovers = covers.length > 1;

                        return (
                          <>
                            <Image
                              key={currentCover}
                              src={currentCover}
                              alt={`${template.name} cover ${activeCoverIdx + 1}`}
                              fill
                              className="object-contain drop-shadow-[0_18px_35px_rgba(15,23,42,0.22)] transition duration-500 group-hover:scale-[1.04]"
                              sizes="(max-width: 768px) 100vw, 300px"
                              priority
                            />

                            {hasMultipleCovers && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handlePrevCover(template.code, covers.length, e)}
                                  className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition hover:bg-white hover:scale-110 active:scale-95"
                                  aria-label="Cover sebelumnya"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleNextCover(template.code, covers.length, e)}
                                  className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition hover:bg-white hover:scale-110 active:scale-95"
                                  aria-label="Cover selanjutnya"
                                >
                                  <ChevronRight size={16} />
                                </button>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                  {covers.map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`h-1.5 rounded-full transition-all ${idx === activeCoverIdx ? "w-3 bg-white" : "w-1.5 bg-white/50"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="w-full z-10 flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs text-white backdrop-blur-md shadow-md">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span>{template.rating}</span>
                        <span className="text-white/70 font-normal">({effectiveFavCount} suka)</span>
                      </div>

                      <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur">
                        code: {template.code}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Description & Details */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                    <div>
                      {/* Title, Price & Status */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                            {template.name}
                          </h2>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-emerald-700">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(template.price ?? 50000)}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Sekali bayar
                            </span>
                          </div>
                        </div>

                        {isReady ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200/60">
                            <Check size={12} /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                            Segera
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {template.description}
                      </p>

                      {/* Section Features */}
                      <div className="mt-5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Fitur & Komponen Section ({template.features.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {template.features.slice(0, 6).map((feat) => (
                            <span
                              key={feat}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200/60"
                            >
                              {feat}
                            </span>
                          ))}
                          {template.features.length > 6 && (
                            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                              +{template.features.length - 6} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Themes Palette & Release Info */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Palette size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">Pilihan Tema:</span>
                          <div className="flex -space-x-1 ml-1">
                            {template.themeColors.map((color) => (
                              <span
                                key={color}
                                className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span>Rilis {new Date(template.releaseDate).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100">
                      <Link
                        href={`/demo/${template.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 whitespace-nowrap transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                      >
                        <Eye size={14} />
                        <span>Demo</span>
                      </Link>

                      {isReady ? (
                        <Link
                          href={`/editor/${template.code}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white whitespace-nowrap shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          <span>Customize</span>
                          <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-400 whitespace-nowrap cursor-not-allowed"
                        >
                          Segera Hadir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <section aria-labelledby="upcoming-templates-title" className="px-4 pb-2 sm:px-8">
        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[32px] bg-slate-950 px-6 py-9 text-white shadow-[0_28px_70px_rgba(15,23,42,.2)] sm:px-10 sm:py-12 lg:grid-cols-[1fr_.72fr] lg:items-center lg:gap-12">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 max-w-2xl">
            <h2 id="upcoming-templates-title" className="text-xl font-black tracking-[-.035em] sm:text-2xl">
              Nantikan template-template baru yang lebih modern.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Undangan Studio akan terus diperbarui dengan desain yang lebih segar, kategori acara yang semakin lengkap, dan pengalaman editor yang makin nyaman digunakan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Desain modern", "Kategori baru", "Update berkelanjutan"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-200">
                  <CheckCircle2 size={13} className="text-emerald-400" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-9 grid grid-cols-3 items-end gap-3 lg:mt-0" aria-hidden="true">
            {[
              ["Pernikahan", "from-emerald-300 to-teal-500", "h-28 sm:h-36"],
              ["Perayaan", "from-violet-300 to-indigo-500", "h-36 sm:h-48"],
              ["Acara spesial", "from-amber-200 to-orange-500", "h-24 sm:h-32"],
            ].map(([label, gradient, height], index) => (
              <div key={label} className={`${height} relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br ${gradient} p-3 shadow-2xl ${index === 1 ? "-translate-y-2" : ""}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,.55),transparent_30%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <Sparkles size={16} className="text-white/90" />
                  <span className="text-[9px] font-black uppercase tracking-[.12em] text-white sm:text-[10px]">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{previewTemplate.name}</h3>
                <p className="text-[10px] text-slate-500">Live Preview & Template Inspector</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Mockup Body */}
            <div className="relative flex-1 bg-slate-100 p-4 flex justify-center items-center">
              <div className="relative h-[605px] w-[325px] rounded-[36px] bg-[#171719] p-[7px] shadow-2xl border-[3px] border-[#323235]">
                <iframe
                  title={`Live Preview ${previewTemplate.name}`}
                  src={`/template-preview?template=${encodeURIComponent(previewTemplate.code)}&for=Nama+Tamu`}
                  className="h-full w-full rounded-[28px] border-0 bg-white"
                />
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white p-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kode Template · Harga</span>
                <p className="font-mono text-xs font-extrabold text-slate-800">{previewTemplate.code} · <span className="text-emerald-700 font-sans font-black">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(previewTemplate.price ?? 50000)}</span></p>
              </div>

              {previewTemplate.status === "available" ? (
                <Link
                  href={`/${previewTemplate.code}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <span>Customize Template Ini</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
                  Segera Hadir
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Auth Modal */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mx-auto -mt-2 mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
              <Sparkles size={24} />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">Masuk Akun</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Masuk atau daftar otomatis dengan akun Google Anda untuk mengkustomisasi template dan menyimpan draf.
            </p>

            {/* Direct Google OAuth Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  router.push(`/api/auth/google?returnTo=${encodeURIComponent(window.location.pathname)}`);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-xs font-extrabold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-95"
              >
                <svg width="19" height="19" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Lanjutkan dengan Google</span>
              </button>
            </div>

            <p className="mt-5 text-[10px] text-slate-400">
              *1 Action: Jika belum terdaftar, akun dibuat otomatis seketika.
            </p>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-white/10 bg-slate-950 px-4 py-9 text-center text-xs text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-xl"><Image src="/assets/fav.png" width={32} height={32} alt="Undangan Studio" className="h-full w-full object-cover" /></div>
            <div className="text-left"><span className="block text-sm font-extrabold text-white">Undangan Studio</span><span className="block text-[10px] text-slate-500">&copy; {new Date().getFullYear()} · Semua hak dilindungi</span></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400">Powered by <b className="font-bold text-slate-200">CV. Twin Digital Investama</b></span>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram Twin Digital Investama" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-emerald-400 hover:bg-emerald-400 hover:text-slate-950"><Instagram size={16} /></a>
          </div>
        </div>
      </footer>
      {/* My Invitations Modal */}
      <MyInvitationsModal open={isMyInvitationsOpen} onClose={() => setIsMyInvitationsOpen(false)} />
    </div>
  );
}
