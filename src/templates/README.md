# Template Contract untuk AI Agent

Dokumen ini adalah kontrak implementasi template di Undangan Studio. Baca seluruh dokumen sebelum membuat atau mengubah template. Template boleh memiliki desain dan section berbeda (pernikahan, ulang tahun, khitanan, aqiqah, wisuda), tetapi **editor, state, media, tema, dan navigasi harus selalu mengikuti kontrak ini**.

## 1. Struktur folder dan registrasi

Setiap template dibuat di `src/templates/<template-id>/`.

```text
src/templates/<template-id>/
  manifest.ts                 # Kontrak section, field, tema, harga
  normalize-section-state.ts  # Migrasi dan default draft lama
  navigation-adapter.ts       # Sinkronisasi editor <-> preview
  source/
    <Template>Source.tsx      # Renderer invitation
    template-bridge.ts        # Menerapkan state editor ke renderer
    *.css                     # CSS khusus template
```

Daftarkan template di empat tempat berikut:

1. `src/templates/templates.json` untuk kartu marketplace, kategori, harga, thumbnail, opsi `defaultView` ("mobile" | "desktop"), dan `useContainer` (boolean).
2. `src/templates/registry.ts` untuk manifest.
3. `src/templates/runtime-registry.ts` untuk renderer, bridge, adapter, dan normalizer.
4. Bila diperlukan, aset statis di `public/assets/...`. Aset pengguna **tidak** boleh ditaruh di sini; gunakan Asset Manager/upload API.

`code` harus unik, huruf kecil/angka, dan tepat lima karakter.

## 2. Manifest dan section

Semua section wajib didefinisikan di `manifest.ts` dan memiliki:

```ts
{
  type: "event",            // id stabil, jangan diganti setelah dipakai draft
  label: "Detail Acara",
  description: "Waktu, tempat, dan peta.",
  required: true,
  reorderable: true,
  maxInstances: 1,
  capabilities: {
    textStyle: true,
    backgroundColor: true,
    backgroundImage: true,
    image: true,
    gallery: true,
    map: true,
  },
  fields: [
    { key: "title", label: "Judul", control: "text" },
    { key: "mapUrl", label: "URL Google Maps", control: "url" },
  ],
  defaultData: { title: "Acara Kami", mapUrl: "https://..." },
}
```

Aktifkan capability hanya jika renderer benar-benar mendukungnya. Semua field di manifest harus tampil dan berfungsi di preview; jangan membuat field pajangan.

### Data media standar

Gunakan key berikut agar komponen editor Asset Manager otomatis kompatibel:

| Kebutuhan | Key data section |
| --- | --- |
| Satu foto konten | `imageUrl`, `imageLabel` |
| Foto latar section | `backgroundImageUrl`, `backgroundImageLabel` |
| Galeri | `imageUrls` (`string[]`), `imageLabel` |
| Peta | `mapUrl`, `mapLabel` / `buttonLabel` |
| Audio undangan global | `settings.musicUrl`, `settings.musicVolume` |

Jangan menyimpan `File`, base64, atau object browser di data draft. Simpan URL upload yang dikembalikan API.

## 3. Renderer dan bridge state

Renderer wajib memiliki satu scroll root:

```tsx
<main data-template-scroll-root data-template-hydrated="true" data-opened={opened ? "true" : "false"}>
  <section data-template-section="hero">...</section>
  <section data-template-section="event">...</section>
</main>
```

Aturan penting:

- Setiap `data-template-section` harus identik dengan `type` di manifest.
- Semua text yang diedit diberi `data-field="namaKey"`, atau di-handle eksplisit di bridge bila struktur teks lebih kompleks.
- Bridge wajib menerapkan `enabled`, field text, gambar, galeri, background, map, text-style, token tema, serta musik yang didukung template.
- Jangan hard-code nama, tanggal, alamat, foto pengguna, URL peta, atau URL musik dalam hasil visual. Nilai default boleh ada di manifest, tetapi hasil preview harus menerima state editor.
- Bila section disembunyikan, bridge harus memakai `display: none`; section itu tidak boleh ikut navigasi aktif.
- **PENTING (CSS Specificity & `display: none`)**: Jangan pernah memakai `display: flex !important` atau `display: block !important` pada selector section di CSS template! Aturan `!important` di CSS akan mengabaikan inline `node.style.display = "none"` dari bridge sehingga section yang di-disable tetap muncul. Selalu gunakan `node.style.setProperty("display", "none", "important")` dan atribut `[hidden]` pada bridge, serta sediakan aturan fallback `[data-template-section][hidden] { display: none !important; }` di CSS.

Contoh minimum bridge untuk Google Maps:

```ts
if (section.type === "event" && typeof section.data.mapUrl === "string") {
  node.querySelector<HTMLAnchorElement>("[data-map-link]")
    ?.setAttribute("href", section.data.mapUrl);
}
```

Contoh renderer:

```tsx
<a data-map-link data-field="mapLabel" href={defaultMapUrl} target="_blank" rel="noreferrer">
  Buka Google Maps
</a>
```

Gunakan URL share Google Maps yang valid, contohnya `https://maps.app.goo.gl/...` atau `https://www.google.com/maps/search/?api=1&query=...`. URL dibuka dengan `target="_blank"` dan `rel="noreferrer"`.

### Musik global

Global editor sudah menyimpan musik pada `settings.musicUrl` dan volume pada `settings.musicVolume` (0 sampai 1). Template yang menawarkan musik wajib menyediakan elemen audio dan bridge:

```tsx
<audio loop preload="metadata">
  <source src="/assets/audio/default.webm" type="audio/webm" />
</audio>
```

```ts
const audio = document.querySelector<HTMLAudioElement>("[data-template-scroll-root] audio");
const source = audio?.querySelector("source");
if (audio && source && settings.musicUrl) {
  source.src = settings.musicUrl;
  audio.load();
}
if (audio && typeof settings.musicVolume === "number") {
  audio.volume = Math.max(0, Math.min(1, settings.musicVolume));
}
```

Jangan autoplay sebelum interaksi pengguna. Untuk template dengan envelope, mulai/lanjutkan audio setelah tamu menekan tombol buka. Pergantian musik di editor harus memperbarui `source`, memanggil `audio.load()`, dan tidak membuat error bila browser menolak `play()`.

## 4. Tema dan warna

Setiap preset harus menyediakan seluruh token:

`background`, `surface`, `primary`, `accent`, `text`, `dark`, `rich`, `mid`, `cream`, `border`, `muted`.

Arti ringkas:

- `background`, `surface`, `cream`: paper dan area terang.
- `primary`, `accent`: identitas dan highlight.
- `dark`, `rich`, `mid`: overlay, gradient, seal, navbar, card gelap.
- `text`, `muted`, `border`: teks dan detail.

Semua CSS visual harus memakai token CSS (`var(--...)`). Jangan hard-code warna brand pada overlay, envelope/seal, card, tombol, bottom navigation, atau bagian penutup. Custom warna dari editor juga harus menimpa token turunan yang relevan, bukan hanya `primary`.

### Typography per field

Jika sebuah section memakai `capabilities.textStyle`, bridge wajib menerapkan `data.textStyles` untuk setiap field text yang tersedia. Struktur nilainya:

```ts
textStyles: {
  title: {
    fontFamily: "great-vibes", // atau template, dancing-script, cormorant, manrope
    fontSize: 42,              // px, opsional
    color: "#5b3f88",        // opsional
    bold: false,
    italic: false,
  },
}
```

Style diterapkan pada target text yang benar di preview, termasuk target yang tidak memakai `data-field` langsung. Reset style harus mengembalikan tampilan bawaan template. Jangan mengaplikasikan satu style global ke seluruh section ketika user hanya mengedit satu field.

### Background, gambar, dan galeri

- `backgroundColor` hanya mengubah warna section pemiliknya, bukan warna section lain atau foto utama.
- `backgroundImageUrl` diterapkan ke elemen background yang tepat; kosongkan/reset harus menghapus inline image dan mengembalikan default template.
- `imageUrl` diterapkan pada `<img>` dengan `src`, serta pertahankan `alt` yang aman.
- `imageUrls` harus merender **persis** jumlah foto state editor. Jangan menyisakan foto fallback template ketika user sudah memilih/menghapus galeri.
- URL media tidak boleh dimasukkan dengan `innerHTML` atau dieksekusi sebagai script.

## 5. Opening envelope

Template yang memakai envelope wajib mengikuti semua aturan ini:

1. Tambahkan `opening-envelope` ke `sections`, `defaultSections`, dan `navigation.openingSectionId`.
2. `normalize-section-state.ts` wajib menambahkan `opening-envelope` pada draft lama yang belum memilikinya.
3. Renderer menampilkan opening sebagai layar tetap satu viewport, di luar konten scroll (`position: fixed`).
4. Scroll root memakai `height: 100dvh; overflow-y: auto; overscroll-behavior: contain`. `html` dan `body` tidak boleh ikut scroll.
5. Adapter: memilih section selain opening harus membuka konten dahulu; memilih opening harus mengembalikan amplop.
6. `isSectionReady()` hanya `true` ketika konten benar-benar sudah terbuka (`data-opened="true"`).
7. Factory adapter harus stabil (fungsi di luar komponen atau `useCallback`), jangan memakai inline factory yang membuat navigation manager ter-destroy ketika state envelope berubah.

## 6. Navigation adapter

Adapter menghubungkan sidebar kiri, click section preview, scroll iframe, dan bottom navigation. Implementasikan `getScrollRoot`, `getSectionElement`, `getSectionEntries`, `prepareSection`, `isSectionReady`, dan `getOpeningSectionId` bila ada envelope.

Tidak boleh ada scroll pada window editor utama ketika pengguna scroll/click di iframe. Hanya scroll root di dalam iframe yang bergerak. Setelah navigasi selesai, sidebar kiri dan inspector kanan harus memilih section yang sama.

Jika template memiliki bottom navigation, setiap item harus mengirim event navigasi ke adapter, memakai `type` section yang sama dengan manifest, dan menunjukkan indikator aktif dari section yang sedang terlihat. Item untuk section yang dinonaktifkan harus disembunyikan atau tidak dapat dipilih.

## 7. Mobile-first adalah aturan utama (UTAMA / CRITICAL)

> [!CAUTION]
> **MOBILE-FIRST ADALAH PRIORITAS MUTLAK.** Undangan digital 95%+ dibuka oleh tamu dari smartphone (iOS/Android). Desain TIDAK BOLEH dibuat untuk desktop lalu di-hack ke mobile. Seluruh layout dasar (terutama Opening Envelope dan Hero) WAJIB disusun dari viewport mobile terlebih dahulu.

Aturan ketat untuk AI Agent:
- **Target ukuran mobile wajib**: Uji pada lebar `320px` (iPhone SE kecil), `375px` (iPhone SE/8), dan `390px` (iPhone 13/14/15/16); serta tinggi `568px`, `667px`, dan `844px`.
- **DILARANG menggunakan absolute positioning bertumpuk** (misal `top: clamp(...)` untuk teks dan `bottom: ...` untuk foto secara terpisah) yang menyebabkan konten bertubrukan, terdorong keluar viewport, atau blank di layar mobile!
- **Gunakan Flexbox/Grid vertikal yang deterministik**: Gunakan `display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100dvh; max-height: 100dvh; box-sizing: border-box; overflow: hidden;` untuk section satu layar (Opening dan Hero).
- **Semua konten utama WAJIB langsung terlihat dalam 1 layar** tanpa perlu scroll dan tanpa menyisakan ruang kosong/blank:
  - Opening: Eyebrow/kicker, nama perayaan/mempelai, tanggal, amplop/undangan tamu, dan tombol buka.
  - Hero: Badge/kicker, pesan pembuka/ucapan, nama perayaan/mempelai, tanggal/waktu, avatar/foto (dengan fallback avatar yang estetis jika foto belum diunggah), serta indikator scroll.
- **Fallback teks wajib aman**: Bridge dan normalizer tidak boleh membiarkan string kosong (`""`) menghapus konten elemen visual menjadi kosong/blank. Selalu berikan fallback default yang bermakna bila data kosong.
- **Ukuran teks fleksibel**: Gunakan `clamp()` untuk font size, padding, dan ukuran avatar. Teks panjang wajib membungkus dengan aman (`overflow-wrap: anywhere; text-wrap: balance;`).
- **Safe area**: Perhatikan safe area bawah (`env(safe-area-inset-bottom)`) untuk indikator scroll dan navigation bar.
- **Preview mobile adalah kebenaran**: Tampilan tidak dianggap selesai sebelum diverifikasi di mobile preview tanpa ada elemen terpotong, blank, atau overflow.

## 8. Kontainer Desktop & Fleksibilitas Layout (`useContainer`)

> [!IMPORTANT]
> **DILARANG KERAS membuat container atau `max-width` pada layout Next.js (`app/**/layout.tsx`)!**
> Semua file layout route Next.js (`app/layout.tsx`, `app/demo/layout.tsx`, `app/i/layout.tsx`, `app/template-preview/layout.tsx`) WAJIB dibiarkan **100% full-width window**. Hal ini krusial agar header banner demo, tombol beranda, floating ad frame, floating WhatsApp share, dan switcher viewport desktop/mobile bekerja sempurna tanpa terhimpit atau terpotong.

### Konsep dan Aturan Pembuatan `useContainer`

Setiap template di Undangan Studio (baik kategori **Pernikahan**, **Khitanan**, **Ulang Tahun**, maupun **Aqiqah**) memiliki nilai bawaan `useContainer: true`. Nilai ini didaftarkan di manifest dan katalog, serta dapat diubah secara dinamis oleh pengguna melalui menu **Custom Global** ("Fokuskan untuk Layar" = [Mobile, Desktop]).

Aturan wajib untuk AI Agent saat membuat atau memelihara template:

1. **Default Template Wajib `useContainer: true`**:
   - Daftarkan `useContainer: true` di:
     - `src/templates/templates.json`: `"useContainer": true`
     - `src/templates/<template-id>/manifest.ts`: `useContainer: true`
   - Semua template (Pernikahan, Khitanan, Ulang Tahun, Aqiqah, dll.) secara default fokus pada pengalaman mobile card elegan (`max-width: 480px`) di tengah layar monitor desktop.

2. **Wajib Mendukung Toggle Dinamis (`useContainer: true` vs `false`)**:
   Pengguna di Editor memiliki opsi kustom global **Fokuskan untuk layar**:
   - **Mobile** (`useContainer: true`): Tampilan ter-container di kartu 480px di tengah desktop dengan background/backdrop dekoratif di sekelilingnya.
   - **Desktop** (`useContainer: false`): Tampilan membentang lebar penuh (`100%`) responsif di monitor desktop.

3. **Implementasi Wajib di Template Bridge**:
   Bridge template (`template-bridge.ts`) WAJIB membaca `settings.useContainer` dan menerapkannya sebagai atribut `data-use-container` pada shell container template:
   ```ts
   const shell = document.querySelector<HTMLElement>(".template-shell");
   if (shell) {
     shell.setAttribute("data-use-container", settings.useContainer === false ? "false" : "true");
   }
   ```

4. **Implementasi Wajib di CSS Template**:
   Setiap template harus memiliki struktur CSS berikut:
   ```css
   /* Default: Ter-container 480px di tengah layar desktop */
   .template-shell {
     width: 100%;
     max-width: 480px;
     height: 100dvh;
     margin: 0 auto;
     position: relative;
     box-shadow: 0 0 50px rgba(0, 0, 0, 0.28), 0 0 0 1px var(--template-border);
   }

   /* Ketika pengguna memilih fokus Desktop (useContainer: false) */
   .template-shell[data-use-container="false"] {
     max-width: 100% !important;
     box-shadow: none !important;
   }

   .template-shell[data-use-container="false"] .audio-btn {
     right: 24px;
   }
   ```

5. **Envelope & Stationary Audio Control**:
   - Opening envelope (`.envelope-screen`), ornamen sudut, atau modal preview WAJIB terikat pada container template (`position: absolute; inset: 0; width: 100%; height: 100dvh;`), **BUKAN** `position: fixed` ke viewport window browser.
   - Tombol audio harus diam (*stationary*) di sudut atas container template (misal `position: absolute; top: 16px; right: 16px; z-index: 50;` atau `top: 72px; right: calc(50% - 224px);`), tidak boleh diberi animasi transform/floating yang berjalan sendiri.


## 9. Normalizer dan draft lama

Normalizer menerima state tersimpan dan mengembalikan state valid untuk manifest saat ini. Ia wajib:

- membuang type yang tidak dikenal;
- menggabungkan `defaultData` dengan data tersimpan;
- menambahkan semua `defaultSections` yang belum ada;
- mempertahankan id dan urutan section yang ada.

Normalisasi berlaku untuk local draft, server draft, dan state kolaborasi. Setelah migrasi, section baru wajib ditulis kembali ke shared document agar tidak hilang saat reconnect.

## 10. Checklist wajib sebelum selesai

1. Buat draft baru dan buka draft lama yang tidak memiliki section terbaru.
2. Pastikan semua section, terutama opening envelope, muncul di Struktur Undangan.
3. Klik setiap sidebar section dan bottom navigation: loader harus selesai, preview berpindah, dan inspector sinkron.
4. Scroll preview: sidebar dan inspector ikut aktif tanpa menggeser window editor.
5. Edit setiap field, font style, warna, foto, galeri, background image, URL Maps, dan musik yang didukung; preview harus realtime.
6. Hapus sebagian lalu seluruh foto galeri; preview tidak boleh memunculkan foto bawaan yang sudah tidak ada di state.
7. Ganti URL Maps dan pastikan tombol membuka URL baru pada tab terpisah.
8. Ganti musik dan volume, buka envelope, lalu pastikan audio baru yang dipakai tanpa autoplay sebelum interaksi.
9. Uji hide/show, urutkan, tambah section, desktop/iOS/Android, dan seluruh preset tema.
10. Uji Hero dan Opening pada 320×568, 375×667, dan 390×844: tidak boleh blank, overflow, atau menyisakan layar kosong sebelum konten utama.
11. **Uji Layout & Container Desktop**:
    - Pastikan route layout global (`app/**/layout.tsx`) tidak memiliki class container/`max-w-[480px]`.
    - Jika template memakai `useContainer: true`, periksa di `/demo/[templateCode]` dan `/template-preview?template=[code]` bahwa pada mode Desktop kartu template terpusat 480px, ornamen amplop tetap berada di dalam kartu, dan tombol audio tetap diam.
    - Periksa halaman `/demo/[templateCode]` bahwa title/SEO dinamis, header logo brand, floating WhatsApp share, dan floating ad frame tampil sempurna.
12. Uji tanpa login (local-first) serta dengan login/kolaborator (cloud/CRDT).
13. Jalankan `npm run build` atau `npx tsc --noEmit`.

Template baru tidak perlu menyalin section Wedding Elegance. Yang harus konsisten adalah kontrak editor, state, media, tema, navigasi, dan isolasi containernya.
