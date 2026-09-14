# Plan 02 — Card Style pada Inspector dan Preview Editor

## Tujuan

Menambahkan menu **Card Style** pada sidebar kanan editor. Saat tab dipilih, area live preview yang biasanya menampilkan mobile invitation berubah menjadi preview share card. Pengguna dapat memilih style, foto, warna, dan visibilitas informasi card; hasil tersimpan di draft dan dipakai oleh dynamic share card saat publish.

## Prasyarat

- `PLAN_01_DYNAMIC_SHARE_CARDS.md` bagian kontrak, resolver, dan renderer harus sudah tersedia.
- Jangan mulai dengan menambahkan state card langsung ke `ConsoleWorkspace.tsx` sebelum bentuk `CardStyleSettings` disepakati.

## Temuan Saat Audit

- Sidebar sekarang hanya memiliki tab `section | global` di `src/builder/editor/components/TabbedInspectorSidebar.tsx`.
- Preview utama menggunakan iframe `/template-preview` dan sinkronisasi `postMessage` dari `src/builder/editor/ConsoleWorkspace.tsx`.
- Global settings disimpan pada `invitations.styleOverrides`, local snapshot, autosave, history, dan Yjs `globalSettings`.
- Editor global berada di `src/builder/editor/components/collaborative/CollaborativeGlobalEditor.tsx`.
- Card preview harus dapat menampilkan perubahan draft yang belum dipublish; karena itu jangan mengambil PNG published sebagai satu-satunya preview editor.

## Keputusan UX

- Sidebar memiliki tiga tab: **Section**, **Global**, dan **Card Style**.
- Memilih **Card Style** otomatis mengubah central preview ke mode card.
- Kembali ke **Section/Global** mengembalikan preview invitation tanpa reload draft.
- Preview card memakai rasio `1200:630`, diskalakan di area device preview, dan memiliki label `Preview WhatsApp / Open Graph`.
- Navigation section, refresh iframe, dan device chrome yang tidak relevan dinonaktifkan/disembunyikan saat mode card.
- Nama tamu preview memakai sample yang dapat diedit lokal, misalnya `Bpk. Budi Santoso`; sample tidak ikut disimpan sebagai data undangan.

## Setting yang Disimpan

```ts
type CardStyleSettings = {
  styleId: string;
  imageUrl?: string;
  backgroundMode: "template" | "photo" | "solid";
  overlayOpacity: number;
  textAlign: "left" | "center";
  colors?: { background?: string; primary?: string; accent?: string; text?: string };
  showGuestName: boolean;
  showDate: boolean;
  showVenue: boolean;
  version: number;
};
```

Simpan sebagai `styleOverrides.cardStyle`. Naikkan `version` hanya ketika setting card yang memengaruhi output berubah agar URL OG dapat melakukan cache busting.

## Target File

- `src/builder/editor/components/TabbedInspectorSidebar.tsx` — tab ketiga dan keyboard navigation 3-tab.
- `src/builder/editor/components/CardStyleEditor.tsx` — form reusable.
- `src/builder/editor/components/CardPreviewCanvas.tsx` — preview realtime dari data draft.
- `src/builder/editor/ConsoleWorkspace.tsx` — state, persistensi, mode preview, dan wiring inspector.
- `src/builder/editor/preview-types.ts` — bila payload preview diperluas.
- `src/modules/share-card/contracts.ts` — `CardStyleSettings` dan default normalizer.
- `src/modules/share-card/resolve-invitation-share-data.ts` — data preview sama dengan server.
- `src/modules/collaboration/domain/crdt-mapper.ts` dan hook Yjs terkait — nested setting card.
- `src/modules/drafts/validation.ts` — validasi payload autosave.
- `app/api/drafts/[draftId]/route.ts` — pastikan read/write style override baru tidak dibuang.

## Checklist Implementasi

### Tab dan Mode Preview

- [ ] Perluas `InspectorSidebarTab` menjadi `section | global | card`.
- [ ] Ubah grid tab dari 2 ke 3 kolom dan tambahkan ikon card/image.
- [ ] Perbaiki keyboard ArrowLeft/ArrowRight agar berputar pada tiga tab.
- [ ] Tambahkan `cardContent` prop dan panel ARIA terpisah.
- [ ] Tambahkan state `previewSurface: "invitation" | "card"` atau derivasi langsung dari tab.
- [ ] Saat tab Card Style aktif, tampilkan `CardPreviewCanvas` menggantikan iframe mobile.
- [ ] Saat tab lain aktif, pertahankan state scroll dan section iframe sebelumnya.
- [ ] Pastikan collapse/resize sidebar tetap bekerja pada ketiga tab.

### Editor Card

- [ ] Tampilkan style yang hanya didukung manifest template aktif.
- [ ] Tampilkan thumbnail setiap style.
- [ ] Tambahkan pemilih background template/foto/solid.
- [ ] Reuse `AssetLibraryModal` dan upload image yang sudah ada untuk foto card.
- [ ] Tambahkan slider overlay dengan batas aman agar teks tetap terbaca.
- [ ] Tambahkan alignment dan toggle guest/date/venue.
- [ ] Tambahkan custom color dengan `CollaborativeColorInput`.
- [ ] Tambahkan tombol reset ke default template.
- [ ] Hormati mode viewer: seluruh kontrol read-only.
- [ ] Tampilkan warning jika foto tidak public/invalid untuk crawler.

### Persistensi dan Kolaborasi

- [ ] Tambahkan `cardStyle` ke `LocalDraftSnapshot`.
- [ ] Tambahkan `cardStyle` ke `HistorySnapshot`.
- [ ] Tambahkan `cardStyle` ke `previewSettings`, `autoSaveData`, load draft, dan publish payload.
- [ ] Tambahkan nested Y.Map `globalSettings.cardStyle` agar kolaborasi tidak menimpa global setting lain.
- [ ] Tambahkan normalizer default untuk draft lama.
- [ ] Pastikan undo/redo mencakup setiap perubahan Card Style.
- [ ] Pastikan autosave HTTP dan WebSocket menghasilkan bentuk JSON yang sama.
- [ ] Pastikan perubahan card menaikkan `cardStyle.version` secara deterministik/debounced.

### Preview Parity

- [ ] Pisahkan resolver data dari renderer agar client preview dan server `ImageResponse` menerima data identik.
- [ ] Buat renderer browser yang meniru layout renderer Satori tanpa memakai CSS yang tidak didukung server.
- [ ] Tambahkan frame rasio `1200/630` dan zoom-to-fit.
- [ ] Tambahkan sample guest input khusus preview.
- [ ] Bandingkan screenshot browser preview dengan PNG endpoint untuk setiap style.
- [ ] Jangan memuat endpoint published ketika draft belum terbit.

### Generator dan Publish

- [ ] Tampilkan mini preview card terpilih pada tab Generator setelah publish.
- [ ] Pastikan link WhatsApp tidak perlu berubah ketika style berubah; query version pada `og:image` yang berubah.
- [ ] Saat publish, validasi `styleId` masih tersedia pada manifest template.
- [ ] Jika style dihapus dari template versi baru, normalizer memilih default aman.

### Validasi

- [ ] Uji tab dengan mouse, touch, dan keyboard.
- [ ] Uji switching Card → Section tidak mereset scroll iframe.
- [ ] Uji reload editor memulihkan Card Style.
- [ ] Uji kolaborator melihat perubahan realtime.
- [ ] Uji viewer tidak dapat mengubah card.
- [ ] Uji draft lama tanpa `cardStyle`.
- [ ] Jalankan `npm run lint` dan `npm run build`.

## Pembagian Multi-Agent

- **Agent UI:** `TabbedInspectorSidebar`, `CardStyleEditor`, dan layout preview.
- **Agent State:** `ConsoleWorkspace`, autosave, snapshot, Yjs, undo/redo.
- **Agent Parity:** browser renderer dan screenshot comparison dengan renderer Plan 01.
- **Agent QA:** keyboard, responsive, collaboration, legacy draft.

Hindari Agent UI dan Agent State mengedit `ConsoleWorkspace.tsx` secara bersamaan. Agent UI sebaiknya membuat komponen mandiri dahulu; Agent State melakukan wiring terakhir.

## Acceptance Criteria

- Tab Card Style tersedia pada semua template yang mendeklarasikan share card.
- Central preview langsung berubah ke desain card tanpa publish/reload.
- Style yang dipilih bertahan setelah reload dan dipakai pada preview WhatsApp produksi.
- Draft lama, viewer, autosave offline, dan kolaborasi tetap bekerja.

