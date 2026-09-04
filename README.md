# Undangan Console

Console editor untuk Template Kit undangan digital. Template yang tersedia saat ini: `Wedding Lampung Elegance` (`hjydg`), `Celestial Birthday` (`bdcel`), dan `Ksatria Khitan Jawa` (`khtnn`).

## Jalankan lokal

```bash
npm install
npm run db:migrate
npm run dev
```

Buka `http://localhost:3000/hjydg`.

## MySQL lokal

Konfigurasi default ada di `.env`:

```text
mysql://root@127.0.0.1:3306/undangan_console
```

Migration awal membuat tabel template, undangan, section, asset, dan ucapan; juga menambahkan Template Kit `hjydg`.

## Fitur editor awal

- Tab Editor, Generator nama tamu, dan Ucapan.
- Tombol Publish di navigasi atas.
- Theme warna dan kombinasi font milik template.
- Section sortable dengan drag-and-drop.
- Panel edit judul/deskripsi dan pemilihan file foto di preview.
- Floating action `Tambah section` di sisi kanan.

## Kontrak wajib template baru

Bagian ini adalah aturan implementasi, bukan panduan opsional. Template baru **tidak boleh dianggap selesai** sebelum seluruh butir di bawah lulus di Editor, iframe preview, dan halaman undangan live.

### 1. Satu sumber kebenaran section

- Definisikan seluruh section pada `manifest.ts`, lengkap dengan `type`, `label`, `required`, `defaultData`, dan `defaultSections`.
- Setiap `type` di `defaultSections` wajib mempunyai satu elemen root yang nyata pada renderer: `data-template-section="<type>"`.
- Sertakan `opening-envelope` pada manifest, adapter, dan sidebar bila template memakai amplop. Amplop adalah section pertama, bukan elemen dekoratif di luar struktur.
- Pastikan nama type sama persis di manifest, normalizer, navigation adapter, bridge, dan JSX. Jangan memakai alias atau selector khusus yang tidak tercatat di manifest.

### 2. Kontrak navigasi iframe — WAJIB

**Semua template baru wajib memakai** `StandardTemplateNavigationAdapter` dari `src/templates/navigation/create-standard-navigation-adapter.ts`. Jangan menyalin adapter sendiri dari template lain. Helper ini adalah basis pola navigasi Wedding: menangani scroll root, amplop, section tersembunyi, dan kesiapan target secara konsisten.

```ts
import { StandardTemplateNavigationAdapter } from "@/templates/navigation/create-standard-navigation-adapter";

export class MyTemplateNavigationAdapter extends StandardTemplateNavigationAdapter {
  constructor() {
    super({
      sectionIds: ["opening-envelope", "hero", "event", "gallery", "closing"],
      prepareEvent: "my-template-preview-navigate",
      openingSectionId: "opening-envelope",
    });
  }
}
```

`sectionIds` wajib sama dengan urutan `defaultSections` pada manifest. Bila ada section yang tidak tercantum, editor tidak akan dapat menjamin klik sidebar, scroll iframe, dan inspector kanan sinkron.

Renderer template harus memasang runtime berikut di dalam scroll root:

```tsx
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { MyTemplateNavigationAdapter } from "../navigation-adapter";

function createNavigationAdapter() {
  return new MyTemplateNavigationAdapter();
}

<main data-template-scroll-root data-opened={opened ? "true" : "false"}>
  <TemplateNavigationRuntime createAdapter={createNavigationAdapter} />
  {/* seluruh section */}
</main>
```

- `data-template-scroll-root` harus menjadi satu-satunya area scroll preview (`height: 100dvh; overflow-y: auto; overscroll-behavior: contain`). Jangan gunakan `window.scroll`, `document.scrollIntoView()`, atau scroll root halaman editor.
- `navigation-adapter.ts` wajib mengembalikan semua section manifest dalam urutan render melalui `getSectionEntries()`, memfilter section `[hidden]`, `.is-hidden`, atau `display:none`.
- `prepareSection()` hanya boleh menyiapkan state (mis. membuka amplop). Pergerakan scroll selalu ditangani `TemplateNavigationRuntime` / `PreviewNavigationManager`.
- Tombol navbar di dalam template harus mengirim event `template:navigate`; jangan panggil `element.scrollIntoView()` secara langsung.

```tsx
window.dispatchEvent(new CustomEvent("template:navigate", {
  detail: { sectionId: "gallery", requestId: crypto.randomUUID(), source: "preview-navbar" },
}));
```

- Saat amplop sudah dibuka, opening envelope harus benar-benar tidak ter-mount atau `[hidden]`; jika masih terlihat secara logis, active-section akan selalu terbaca sebagai amplop.
- Dengarkan `template:active-section` jika navbar internal membutuhkan status aktif. Runtime akan meneruskan status tersebut ke sidebar kiri dan inspector kanan editor.

### 3. Enable / disable section — WAJIB realtime

Bridge preview wajib memproses `enabled` untuk **setiap** section sebelum memproses teks, gambar, background, atau komponen khusus:

```ts
if (!section.enabled) {
  node.style.setProperty("display", "none", "important");
  node.setAttribute("hidden", "");
  node.classList.add("is-hidden");
  return;
}
node.style.removeProperty("display");
node.removeAttribute("hidden");
node.classList.remove("is-hidden");
```

CSS template harus menjaga fallback berikut agar selector layout tidak mengalahkan state editor:

```css
[data-template-section][hidden],
[data-template-section].is-hidden { display: none !important; }
```

### 4. Data dan aset editor

- Semua teks yang dapat diedit memakai `data-field="fieldKey"` dan field key tersebut ada pada manifest.
- Foto tunggal memakai `data-single-img`; galeri menerima `imageUrls`; background section memakai `backgroundColor` dan `backgroundImageUrl`.
- Tautan Maps memakai `data-map-link` dan menerima `mapUrl` penuh, misalnya `https://www.google.com/maps/search/?api=1&query=-5.39714,105.26679`.
- Audio harus berupa `<audio loop><source /></audio>` dan bridge harus mendukung `musicUrl` serta `musicVolume`. Berkas audio diunggah melalui Asset Manager setelah pengguna login.
- Jangan hardcode data pengguna di luar fallback `defaultData`; perubahan editor harus langsung terlihat di iframe dan tersimpan dalam JSON section.

### 5. Checklist penerimaan template

Sebelum menyerahkan template baru, uji semua kondisi berikut.

- Klik tiap section di sidebar kiri: iframe menuju section yang benar dan inspector kanan berpindah ke section yang sama.
- Scroll mouse/touch di iframe: sidebar kiri dan inspector kanan **wajib** mengikuti section aktif secara realtime. Ini bukan fitur tambahan; template yang gagal meneruskan active section ke editor tidak boleh dirilis.
- Klik navbar internal preview: iframe, sidebar kiri, dan inspector kanan tetap sinkron tanpa menggeser window editor.
- Toggle off/on pada setiap section: section menghilang/muncul seketika di iframe dan daftar navigasi tidak menunjuk section tersembunyi.
- Klik amplop, kembali ke amplop dari sidebar, lalu kembali ke section lain.
- Uji iPhone, Android, dan Desktop viewport. Prioritas desain dan fungsionalitas tetap mobile-first.
- Uji semua field teks, warna, font, background, gambar/galeri, Maps, musik, QRIS/rekening bila tersedia.
- Jalankan `npm run build` tanpa error.

Kegagalan salah satu checklist di atas adalah bug kontrak template dan harus diperbaiki sebelum melanjutkan pekerjaan desain.
