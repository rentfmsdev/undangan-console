"use client";

import {
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

export type GuestContact = {
  id: string;
  name: string;
  phone: string;
  group: string;
  status: "pending" | "sent";
  sentAt?: string;
};

type Props = {
  draftId: string | null;
  draftStatus: "draft" | "published" | "custom";
  templateCode: string;
  isPublished: boolean;
  publishUrl: string;
  publishMode: "path" | "subdomain";
  publishIdentifier: string;
  waPreset: "formal" | "islami" | "casual" | "english";
  onRequirePublish: () => void;
  getMessageForGuest: (guestName: string) => string;
};

// Normalize Indonesian phone numbers to standard 628...
export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith("08")) {
    cleaned = "628" + cleaned.slice(2);
  } else if (cleaned.startsWith("8")) {
    cleaned = "628" + cleaned.slice(1);
  }
  return cleaned;
}

export function BulkGuestManager({
  draftId,
  draftStatus,
  templateCode,
  isPublished,
  publishUrl,
  publishMode,
  publishIdentifier,
  waPreset,
  onRequirePublish,
  getMessageForGuest,
}: Props) {
  const storageKey = `undangan-console:guest-list:${draftId || templateCode}`;

  const [guests, setGuests] = useState<GuestContact[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "sent">("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestContact | null>(null);

  // Single Guest Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGroup, setFormGroup] = useState("Umum");

  // Paste Text Form State
  const [pasteText, setPasteText] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Database sync status
  const [dbSyncStatus, setDbSyncStatus] = useState<"synced" | "saving" | "error" | "offline">("synced");

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  // Load from Database (with localStorage fallback)
  useEffect(() => {
    let active = true;

    async function loadGuestList() {
      // 1. Initial load from localStorage for instant display
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGuests(parsed);
          }
        }
      } catch {
        // Ignore parse error
      }

      // 2. Fetch from MySQL Database if draftId is available
      if (draftId) {
        try {
          const res = await fetch(`/api/drafts/${draftId}/guests`);
          if (res.ok) {
            const data = await res.json();
            if (active && Array.isArray(data.guests)) {
              if (data.guests.length > 0) {
                setGuests(data.guests);
                window.localStorage.setItem(storageKey, JSON.stringify(data.guests));
              } else {
                // If DB is empty but localStorage has guests, sync them to DB!
                const stored = window.localStorage.getItem(storageKey);
                if (stored) {
                  const localGuests = JSON.parse(stored);
                  if (Array.isArray(localGuests) && localGuests.length > 0) {
                    await fetch(`/api/drafts/${draftId}/guests`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ guests: localGuests }),
                    });
                  }
                }
              }
            }
          }
        } catch {
          // Keep localStorage data if offline
        }
      }

      if (active) setIsLoaded(true);
    }

    loadGuestList();

    return () => {
      active = false;
    };
  }, [draftId, storageKey]);

  // Save to localStorage & Database (Debounced)
  useEffect(() => {
    if (!isLoaded) return;

    // 1. Save to localStorage immediately
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(guests));
    } catch {
      // Storage quota error handling
    }

    // 2. Sync to MySQL Database if draftId is available
    if (!draftId) return;

    setDbSyncStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/drafts/${draftId}/guests`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guests }),
        });
        if (res.ok) {
          setDbSyncStatus("synced");
        } else {
          setDbSyncStatus("error");
        }
      } catch {
        setDbSyncStatus("offline");
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [guests, isLoaded, draftId, storageKey]);

  // Distinct groups
  const groupsList = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.group.trim()) set.add(g.group.trim());
    });
    return Array.from(set).sort();
  }, [guests]);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Search
      const matchSearch =
        !searchQuery.trim() ||
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone.includes(searchQuery) ||
        guest.group.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchStatus =
        statusFilter === "all" || guest.status === statusFilter;

      // Group
      const matchGroup =
        selectedGroup === "all" || guest.group === selectedGroup;

      return matchSearch && matchStatus && matchGroup;
    });
  }, [guests, searchQuery, statusFilter, selectedGroup]);

  // Stats
  const stats = useMemo(() => {
    const total = guests.length;
    const sent = guests.filter((g) => g.status === "sent").length;
    const pending = total - sent;
    return { total, sent, pending };
  }, [guests]);

  // Download Sample Excel Template
  function downloadTemplate(type: "xlsx" | "csv") {
    const sampleData = [
      {
        "Nama Tamu": "Bpk. Budi Santoso & Keluarga",
        "Nomor WhatsApp": "081234567890",
        Kategori: "Keluarga",
      },
      {
        "Nama Tamu": "Sarah Wijaya, S.Kom",
        "Nomor WhatsApp": "085712345678",
        Kategori: "Teman Kantor",
      },
      {
        "Nama Tamu": "Dimas Pratama",
        "Nomor WhatsApp": "081398765432",
        Kategori: "Sahabat SMA",
      },
      {
        "Nama Tamu": "Prof. Dr. Ir. H. Ahmad",
        "Nomor WhatsApp": "081122334455",
        Kategori: "Tamu VIP",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    // Set column widths
    worksheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Tamu");

    if (type === "xlsx") {
      XLSX.writeFile(workbook, "template-daftar-tamu-undangan.xlsx");
    } else {
      XLSX.writeFile(workbook, "template-daftar-tamu-undangan.csv", {
        bookType: "csv",
      });
    }
    showToast(`Template ${type.toUpperCase()} berhasil diunduh!`);
  }

  // Export Data to Excel
  function exportGuestData() {
    if (guests.length === 0) {
      showToast("Daftar tamu masih kosong.");
      return;
    }

    const exportRows = guests.map((g, idx) => ({
      No: idx + 1,
      "Nama Tamu": g.name,
      "Nomor WhatsApp": g.phone,
      Kategori: g.group || "Umum",
      Status: g.status === "sent" ? "Sudah Dikirim" : "Belum Dikirim",
      "Waktu Kirim": g.sentAt || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu Undangan");
    XLSX.writeFile(workbook, `daftar-tamu-undangan-${templateCode}.xlsx`);
    showToast("Data tamu berhasil diexport ke Excel!");
  }

  // Handle Excel / CSV File Upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          showToast("File tidak berisi data atau format kosong.");
          return;
        }

        const newGuests: GuestContact[] = [];

        rawJson.forEach((row) => {
          // Normalize object keys
          const keys = Object.keys(row);
          let nameVal = "";
          let phoneVal = "";
          let groupVal = "Umum";

          keys.forEach((key) => {
            const lower = key.toLowerCase().trim();
            const val = String(row[key] ?? "").trim();
            if (
              lower.includes("nama") ||
              lower.includes("name") ||
              lower === "tamu"
            ) {
              nameVal = val;
            } else if (
              lower.includes("phone") ||
              lower.includes("nomor") ||
              lower.includes("wa") ||
              lower.includes("telepon") ||
              lower.includes("hp") ||
              lower.includes("handphone")
            ) {
              phoneVal = val;
            } else if (
              lower.includes("group") ||
              lower.includes("kategori") ||
              lower.includes("kelompok") ||
              lower.includes("ket")
            ) {
              groupVal = val || "Umum";
            }
          });

          if (nameVal) {
            newGuests.push({
              id: crypto.randomUUID(),
              name: nameVal,
              phone: normalizePhoneNumber(phoneVal),
              group: groupVal || "Umum",
              status: "pending",
            });
          }
        });

        if (newGuests.length === 0) {
          showToast("Tidak ada kolom Nama Tamu yang terdeteksi pada file.");
          return;
        }

        setGuests((prev) => [...prev, ...newGuests]);
        showToast(`Berhasil menambahkan ${newGuests.length} tamu dari file!`);
      } catch {
        showToast("Gagal membaca file Excel/CSV. Pastikan format valid.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  }

  // Handle Multi-line Text Paste
  function handlePasteImport() {
    if (!pasteText.trim()) return;

    const lines = pasteText.split("\n");
    const newGuests: GuestContact[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect separator: comma, semicolon, tab, or dash
      let parts: string[] = [];
      if (trimmed.includes(",")) parts = trimmed.split(",");
      else if (trimmed.includes(";")) parts = trimmed.split(";");
      else if (trimmed.includes("\t")) parts = trimmed.split("\t");
      else if (trimmed.includes(" - ")) parts = trimmed.split(" - ");
      else parts = [trimmed];

      const name = parts[0]?.trim() || "";
      const phone = parts[1]?.trim() || "";
      const group = parts[2]?.trim() || "Umum";

      if (name) {
        newGuests.push({
          id: crypto.randomUUID(),
          name,
          phone: normalizePhoneNumber(phone),
          group: group || "Umum",
          status: "pending",
        });
      }
    });

    if (newGuests.length > 0) {
      setGuests((prev) => [...prev, ...newGuests]);
      showToast(`Berhasil menambahkan ${newGuests.length} tamu!`);
      setPasteText("");
      setIsPasteModalOpen(false);
    } else {
      showToast("Tidak ada data tamu valid yang ditemukan.");
    }
  }

  // Add Single Guest Form Submit
  function handleAddSingleGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    const newGuest: GuestContact = {
      id: crypto.randomUUID(),
      name: formName.trim(),
      phone: normalizePhoneNumber(formPhone),
      group: formGroup.trim() || "Umum",
      status: "pending",
    };

    setGuests((prev) => [newGuest, ...prev]);
    setFormName("");
    setFormPhone("");
    setFormGroup("Umum");
    setIsAddModalOpen(false);
    showToast(`Tamu "${newGuest.name}" berhasil ditambahkan!`);
  }

  // Edit Guest Form Submit
  function handleSaveEditGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuest || !editingGuest.name.trim()) return;

    setGuests((prev) =>
      prev.map((g) =>
        g.id === editingGuest.id
          ? {
              ...editingGuest,
              phone: normalizePhoneNumber(editingGuest.phone),
              group: editingGuest.group.trim() || "Umum",
            }
          : g
      )
    );
    setIsEditModalOpen(false);
    setEditingGuest(null);
    showToast("Data tamu berhasil diperbarui!");
  }

  // Toggle single status
  function toggleGuestStatus(id: string) {
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === "sent" ? "pending" : "sent";
          return {
            ...g,
            status: nextStatus,
            sentAt: nextStatus === "sent" ? new Date().toLocaleString("id-ID") : undefined,
          };
        }
        return g;
      })
    );
  }

  // Delete Single Guest
  function deleteGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast("Tamu berhasil dihapus.");
  }

  // Batch actions
  function toggleSelectAll() {
    if (selectedIds.size === filteredGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGuests.map((g) => g.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function batchMarkStatus(status: "sent" | "pending") {
    if (selectedIds.size === 0) return;
    setGuests((prev) =>
      prev.map((g) => {
        if (selectedIds.has(g.id)) {
          return {
            ...g,
            status,
            sentAt: status === "sent" ? new Date().toLocaleString("id-ID") : undefined,
          };
        }
        return g;
      })
    );
    setSelectedIds(new Set());
    showToast(
      `${selectedIds.size} tamu ditandai sebagai ${
        status === "sent" ? "Sudah Dikirim" : "Belum Dikirim"
      }.`
    );
  }

  function batchDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(`Yakin ingin menghapus ${selectedIds.size} tamu terpilih?`)
    )
      return;

    setGuests((prev) => prev.filter((g) => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
    showToast("Tamu terpilih berhasil dihapus.");
  }

  // Send WhatsApp Action
  function handleSendWhatsApp(guest: GuestContact) {
    if (draftStatus === "custom") {
      showToast("Undangan berstatus Custom. Fitur kirim WA aktif setelah dipublish oleh admin.");
      return;
    }
    if (!isPublished || draftStatus !== "published") {
      onRequirePublish();
      return;
    }

    const message = getMessageForGuest(guest.name);
    let waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (guest.phone) {
      waUrl = `https://api.whatsapp.com/send?phone=${guest.phone}&text=${encodeURIComponent(
        message
      )}`;
    }

    // Auto mark as sent
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              status: "sent",
              sentAt: new Date().toLocaleString("id-ID"),
            }
          : g
      )
    );

    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  // Copy Personalized Message
  async function handleCopyMessage(guest: GuestContact) {
    if (draftStatus === "custom") {
      showToast("Undangan berstatus Custom. Fitur kirim WA aktif setelah dipublish oleh admin.");
      return;
    }
    if (!isPublished || draftStatus !== "published") {
      onRequirePublish();
      return;
    }
    const message = getMessageForGuest(guest.name);
    await navigator.clipboard.writeText(message);
    showToast(`Pesan untuk "${guest.name}" disalin!`);
  }

  // Copy Personalized Link
  async function handleCopyLink(guest: GuestContact) {
    if (draftStatus === "custom") {
      showToast("Undangan berstatus Custom. Fitur kirim WA aktif setelah dipublish oleh admin.");
      return;
    }
    if (!isPublished || draftStatus !== "published") {
      onRequirePublish();
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let link = `${origin}/i/ayuardi?for=${encodeURIComponent(guest.name)}`;
    if (isPublished) {
      if (publishMode === "path") {
        link = `${origin}/i/${publishIdentifier}?for=${encodeURIComponent(guest.name)}`;
      } else {
        link = `https://${publishIdentifier}.undangan.co?for=${encodeURIComponent(guest.name)}`;
      }
    }
    await navigator.clipboard.writeText(link);
    showToast(`Tautan personal "${guest.name}" disalin!`);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Tamu</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.total}{" "}
            <span className="text-xs font-medium text-slate-400">orang</span>
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Sudah Terkirim</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-200/70 text-emerald-800">
              <CheckCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-950">
            {stats.sent}{" "}
            <span className="text-xs font-medium text-emerald-700">
              ({stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Belum Terkirim</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-200/70 text-amber-800">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-950">
            {stats.pending}{" "}
            <span className="text-xs font-medium text-amber-700">tamu</span>
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Single Guest Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
          >
            <UserPlus size={14} />
            <span>Tambah Tamu</span>
          </button>

          {/* Import Excel / CSV Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95"
          >
            <Upload size={14} />
            <span>Import Excel / CSV</span>
          </button>

          {/* Paste Multi-line Text Button */}
          <button
            type="button"
            onClick={() => setIsPasteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95"
          >
            <FileSpreadsheet size={14} />
            <span>Tempel Teks</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Sample Template Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={14} />
              <span>Template Excel</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
            <div className="invisible absolute right-0 top-full z-30 mt-1 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100">
              <button
                type="button"
                onClick={() => downloadTemplate("xlsx")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span>Format .xlsx (Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate("csv")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span>Format .csv</span>
              </button>
            </div>
          </div>

          {/* Export Guest List Button */}
          <button
            type="button"
            onClick={exportGuestData}
            title="Download seluruh data tamu ke Excel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu, nomor HP, atau kategori..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                statusFilter === "pending"
                  ? "bg-white text-amber-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Belum ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("sent")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                statusFilter === "sent"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Terkirim ({stats.sent})
            </button>
          </div>

          {/* Group Category Filter Dropdown */}
          {groupsList.length > 0 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-600"
            >
              <option value="all">Semua Kategori</option>
              {groupsList.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-white text-[11px]">
              {selectedIds.size}
            </span>
            <span>Tamu Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => batchMarkStatus("sent")}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-800 active:scale-95"
            >
              <Check size={13} />
              <span>Tandai Terkirim</span>
            </button>

            <button
              type="button"
              onClick={() => batchMarkStatus("pending")}
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-emerald-300 px-3 py-1.5 text-xs text-emerald-900 hover:bg-emerald-100/60 active:scale-95"
            >
              <RotateCcw size={13} />
              <span>Tandai Belum</span>
            </button>

            <button
              type="button"
              onClick={batchDelete}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 active:scale-95"
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* Guest List Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredGuests.length > 0 &&
                      selectedIds.size === filteredGuests.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                  />
                </th>
                <th className="px-4 py-3.5">Nama Tamu Undangan</th>
                <th className="px-4 py-3.5">Nomor WhatsApp</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi Broadcast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {searchQuery || statusFilter !== "all" || selectedGroup !== "all"
                        ? "Tidak ada tamu yang cocok dengan filter"
                        : "Belum ada daftar tamu undangan"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Tambahkan tamu secara manual, tempel teks nama, atau import dari file Excel.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      <UserPlus size={14} />
                      <span>Tambah Tamu Pertama</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const isSelected = selectedIds.has(guest.id);
                  const isSent = guest.status === "sent";

                  return (
                    <tr
                      key={guest.id}
                      className={`group transition hover:bg-slate-50/70 ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(guest.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                        />
                      </td>

                      {/* Guest Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{guest.name}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(guest)}
                            title="Salin tautan personal tamu ini"
                            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-emerald-700"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        {guest.phone ? (
                          <span className="font-mono text-[11px] text-slate-600">
                            +{guest.phone}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">
                            Tanpa nomor
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {guest.group || "Umum"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleGuestStatus(guest.id)}
                          title="Klik untuk mengubah status"
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold transition active:scale-95 ${
                            isSent
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCheck size={11} />
                              <span>Terkirim</span>
                            </>
                          ) : (
                            <>
                              <Clock size={11} />
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp Button */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(guest)}
                            title="Kirim pesan langsung via WhatsApp"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                          >
                            <Send size={12} />
                            <span>Kirim WA</span>
                          </button>

                          {/* Copy Message Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(guest)}
                            title="Salin format pesan WhatsApp"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGuest(guest);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit data tamu"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => deleteGuest(guest.id)}
                            title="Hapus tamu"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Tamu Tunggal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Formulir Tamu
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                  Tambah Tamu Undangan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSingleGuest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nama Tamu Undangan <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Bpk. Budi Santoso / Dr. Sarah & Keluarga"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nomor WhatsApp
                </label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-mono"
                />
                <small className="mt-1 block text-[10px] text-slate-400">
                  Otomatis dinormalisasi ke format internasional (+62).
                </small>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Kategori / Grup
                </label>
                <input
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  placeholder="Contoh: Keluarga, Teman Kantor, VIP"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <Plus size={14} />
                  <span>Tambahkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Tamu */}
      {isEditModalOpen && editingGuest && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Ubah Data
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                  Edit Data Tamu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingGuest(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditGuest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nama Tamu Undangan <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={editingGuest.name}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nomor WhatsApp
                </label>
                <input
                  value={editingGuest.phone}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, phone: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Kategori / Grup
                </label>
                <input
                  value={editingGuest.group}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, group: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingGuest(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <Check size={14} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tempel Teks Massal */}
      {isPasteModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Import Cepat
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                  Tempel Daftar Tamu (Multi-line)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500">
                Tempel daftar tamu dari WhatsApp atau Catatan (1 tamu per baris).
                Gunakan koma <code className="font-mono text-emerald-700">,</code> untuk memisahkan nama, nomor, dan kategori:
              </p>

              <div className="mt-2 rounded-xl bg-slate-50 p-2.5 font-mono text-[10px] text-slate-600 border border-slate-200">
                Bpk. Budi Santoso, 081234567890, Keluarga<br />
                Sarah Wijaya, 085712345678, Teman Kantor<br />
                Dimas Pratama - 081398765432
              </div>

              <textarea
                rows={7}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Tempel baris teks di sini..."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePasteImport}
                disabled={!pasteText.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <Upload size={14} />
                <span>Import Tamu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
