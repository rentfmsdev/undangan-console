# Undangan Console — Plan Fase 1

## Scope project

Builder dibuat sebagai project baru di `D:\Development\App\undangan-console`, terpisah dari `App/wedding`.

Project `App/wedding` menjadi referensi visual untuk Template Kit pertama. Engine editor, domain publishing, dan Template Kit akan dibangun di project baru ini.

Fase pertama mencakup:

1. Memilih/membuka template dengan kode 5 karakter.
2. Drag-and-drop section yang didukung template.
3. Edit teks dan data acara.
4. Upload serta mengatur foto.
5. Mengganti warna dan font dari pilihan template.
6. Preview desktop/mobile.
7. Publish ke path atau subdomain.

Tidak termasuk dahulu: payment, paket premium, analytics, dan marketplace template. Login Google serta ownership draft sudah masuk fase editor karena dibutuhkan untuk upload dan sinkronisasi cloud.

## Checklist Implementasi Saat Ini

- [x] Project baru `App/undangan-console`.
- [x] Next.js, Tailwind, Drizzle, MySQL driver, dan `dnd-kit`.
- [x] Database MySQL `undangan_console` serta migration awal.
- [x] Seed Template Kit Wedding Lampung `hjydg`.
- [x] UI console: navbar Editor/Generator/Ucapan dan tombol Publish.
- [x] UI section sortable, inspector teks/foto lokal, theme/font picker, dan floating add section.
- [x] Draft anonim dengan token cookie dan recovery code.
- [x] Autosave editor ke MySQL.
- [x] API publish dan halaman publik berdasarkan slug.
- [x] Upload foto lokal terautorisasi untuk preview/publish fase editor (object storage signed URL tetap pekerjaan deployment production).
- [x] Resolver host path/subdomain di Next.js proxy (DNS wildcard production masih perlu dikonfigurasi di provider domain).
- [x] Renderer visual realtime memakai source penuh `App/wedding`: opening envelope sampai penutup, termasuk peta, lightbox, musik, dan ucapan publik.
- [x] Schema editor per section: seluruh teks utama, font per field, foto, background color/image, Maps, rekening, serta data acara tersimpan sebagai JSON section.
- [x] Pengaturan global theme dan musik tersimpan di draft dan digunakan renderer publish.
- [x] Navigation runtime modular per template: scroll root terisolasi, adapter section, sinkronisasi dua arah editor-preview, pembatalan animasi, serta loading state.
- [x] Runtime registry untuk renderer, normalizer JSON, state bridge, navigation adapter, preview, dan publish sehingga template baru tidak mengubah core editor.
- [x] Validasi manifest template dengan Zod serta dokumentasi kontrak add-on template.
- [x] Uji regresi sidebar, bottom navbar, scroll manual, preview iframe, route publish, lint, type-check, dan production build.
- [x] Inspector kanan terisolasi dan resizable seperti IDE; upload foto/background memiliki error recovery tanpa menggeser viewport editor.
- [x] Komponen field editor reusable dengan font family, font size, font color, bold, italic, reset style, dan realtime preview berbasis JSON section.
- [x] Local-first autosave untuk pengguna anonim serta migrasi otomatis local draft ke customization milik user setelah login.
- [x] Login gate Google untuk upload gambar, background, musik, publish, dan daftar ucapan pada console.
- [x] Ownership customization berbasis `user_id`, endpoint daftar draft user, claim draft lama, serta storage asset `uploads/{userId}/{draftId}`.
- [x] Ucapan terikat ke invitation/custom template dan akses console diverifikasi berdasarkan pemilik user.
- [x] Route editor kanonis `/editor/{templateCode}/{draftId}`; route lama `/{templateCode}` hanya redirect dan tidak mengekspos `userId`.
- [x] Route read-only `/demo/{templateCode}` dengan banner demo dan penolakan parameter personalisasi `?for=`.
- [x] Komponen upload gambar reusable dengan preview realtime, aksi update, serta tombol hapus di pojok preview.
- [x] Modal `Asset Saya` untuk memakai ulang seluruh foto dan musik milik user lintas draft.
- [x] Status autentikasi dan kesiapan draft dipisahkan sehingga user login tidak menerima modal login palsu saat draft sedang dimuat.
- [x] Public route hanya merender invitation berstatus `published` yang memiliki owner; record legacy anonim dan draft/custom menghasilkan 404.
- [x] Modal publish modular dengan availability slug realtime, publish path langsung, serta request subdomain/custom domain.
- [x] Workflow status `custom` dan metadata `publishRequest` untuk layanan domain yang memerlukan admin.
- [ ] Template Kit kedua.
- [ ] Payment dan paket komersial.

## Paket URL undangan

Satu undangan dapat dipublish dengan salah satu mode berikut.

### Paket path

```text
undangan.co/ayuardi
```

```ts
publishMode: "path"
slug: "ayuardi"
```

### Paket subdomain

```text
ayuardi.undangan.co
```

```ts
publishMode: "subdomain"
subdomain: "ayuardi"
```

Subdomain memerlukan wildcard DNS `*.undangan.co`, wildcard SSL, dan middleware yang membaca host. Nama sistem seperti `www`, `console`, `api`, dan `admin` tidak boleh dipakai sebagai subdomain pelanggan.

## Console dan template code

```text
console.undangan.co/editor/hjydg/[draftId]
```

`hjydg` adalah kode template. Gunakan 5 karakter alfanumerik huruf kecil (`a-z`, `0-9`) agar URL pendek tetapi masih banyak kombinasi. Contoh lain: `w9a2k` dan `a2b3c`.

Pengguna anonim bekerja local-first di `/editor/hjydg`. Setelah login, draft dimuat atau dibuat lalu URL kanonis menjadi `/editor/hjydg/{draftId}`. `userId` tidak diletakkan di URL.

## Routing domain

```text
console.undangan.co/editor/[templateCode]/[draftId]
  → console untuk memilih/membuat draft dari Template Kit

undangan.co/[slug]
  → undangan publik mode path

[subdomain].undangan.co
  → undangan publik mode subdomain
```

`middleware.ts` membaca host request:

1. `console.undangan.co` menuju route console.
2. `undangan.co` atau `www.undangan.co` membaca path sebagai slug.
3. Subdomain selain nama terlarang dibaca sebagai identifier undangan.

Console dan halaman publik dapat tetap satu deployment Next.js. Middleware hanya melakukan rewrite internal ke route yang sesuai.

## Template Kit sebagai add-on mandiri

Satu template bukan hanya file warna. Template adalah add-on yang membawa:

- Manifest dan kode template.
- Renderer halaman undangan publik.
- Daftar section yang boleh digunakan.
- Susunan section default.
- Theme palette warna.
- Daftar kombinasi font yang aman untuk desainnya.
- Asset dekoratif dan preview template.
- Schema validasi, renderer, dan panel editor untuk section-nya.

```ts
type TemplateKit = {
  id: string;
  code: string; // contoh: hjydg
  version: number;
  category: "wedding" | "birthday" | "khitanan" | "aqiqah";
  name: string;
  preview: { cover: string; thumbnail: string };
  themes: TemplateTheme[];
  sections: SectionDefinition[];
  defaultSections: DraftSection[];
  Renderer: React.ComponentType<TemplateRendererProps>;
};
```

Contoh Template Kit pertama:

```text
id: wedding-lampung-elegance
code: hjydg
nama: Wedding Lampung Elegance
```

Kit tersebut membawa section `opening-envelope`, `hero`, `couple`, `wedding-events`, `unduh-mantu`, `gallery`, `quote`, `map`, `gift`, `rsvp`, dan `closing`.

Template ulang tahun atau khitanan dapat membawa section, layout, font, theme, serta aset yang berbeda tanpa memengaruhi kit ini.

## Theme warna dan font

Theme adalah preset milik Template Kit. Pengguna tidak memasukkan CSS bebas; pengguna hanya memilih kombinasi visual yang disediakan template.

```ts
type TemplateTheme = {
  id: string;
  label: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
  };
  fonts: {
    display: "dancing-script" | "great-vibes" | "playfair";
    heading: "cormorant" | "playfair" | "manrope";
    body: "manrope" | "lora" | "inter";
  };
};
```

Contoh Theme untuk Wedding Lampung:

```text
maroon-gold → maroon, emas, Dancing Script
ivory-gold  → ivory, emas antik, Great Vibes
sage-gold   → sage, emas lembut, Dancing Script
```

Theme picker mengubah CSS variables pada preview. Halaman publik memakai `themeId` yang tersimpan saat publish.

## Section dan drag-and-drop

Section hanya terlihat di editor bila terdaftar di manifest template aktif.

```ts
type SectionDefinition<TData = unknown> = {
  type: string;
  label: string;
  required: boolean;
  reorderable: boolean;
  maxInstances: number;
  defaultData: TData;
  schema: ZodSchema<TData>;
  Renderer: React.ComponentType<SectionRendererProps<TData>>;
  Editor: React.ComponentType<SectionEditorProps<TData>>;
};
```

Aturan editor:

- Section wajib dapat dikunci dari hapus/pindah, misalnya `opening-envelope` dan `hero`.
- Section opsional dapat ditambah, disembunyikan, dihapus, dan diurutkan.
- Batas instance berlaku per section, misalnya galeri satu kali dan quote maksimal tiga kali.
- Drag-and-drop menggunakan `dnd-kit`.
- Semua perubahan masuk ke autosave dan undo/redo.

## Editor fase 1

```text
Section library + sortable list | Live preview desktop/mobile | Inspector
```

Fitur:

- Buka Template Kit dari `console.undangan.co/editor/[templateCode]`, lalu arahkan ke URL draft kanonis setelah login.
- Buat draft anonim.
- Drag-and-drop section.
- Tambah/hapus/sembunyikan section opsional.
- Ubah theme warna + font dari daftar kit.
- Edit teks, tanggal, jam, alamat, Maps, rekening, dan link.
- Upload/ganti/urutkan foto serta alt text.
- Preview mobile dan desktop.
- Autosave, undo/redo, validasi publish.

## Model data

Database menyimpan data undangan, bukan komponen React atau CSS bebas.

## Database: MySQL + Drizzle

Database fase pertama menggunakan MySQL pada port `3306` dengan Drizzle ORM dan migration SQL versioned.

Database lokal:

```text
host: 127.0.0.1
port: 3306
user: root
password: kosong (hanya development lokal)
database: undangan_console
```

Tabel awal:

```text
templates             → Template Kit dan manifest, termasuk code hjydg
invitations           → draft anonim serta konfigurasi publish path/subdomain
invitation_sections   → urutan, visibilitas, dan data setiap section
invitation_assets     → referensi foto/audio di object storage
wishes                → ucapan dan kehadiran tamu
```

Perintah yang tersedia:

```bash
npm run db:migrate    # Jalankan migration MySQL
npm run db:generate   # Buat migration baru dari schema Drizzle
npm run db:studio     # Buka Drizzle Studio
```

Konfigurasi koneksi disimpan lokal pada `.env` / `.env.local`; gunakan password database yang kuat untuk production.

```ts
type InvitationDraft = {
  id: string;
  editTokenHash: string;
  templateId: string;
  templateVersion: number;
  themeId: string;
  status: "draft" | "published" | "archived";
  publishMode: "path" | "subdomain" | null;
  slug: string | null;
  subdomain: string | null;
  sections: Array<{
    id: string;
    type: string;
    order: number;
    enabled: boolean;
    data: Record<string, unknown>;
  }>;
  assets: AssetReference[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};
```

Saat editor atau halaman publik dibuka:

```text
templateId → Template Kit registry → themeId → validasi section → renderer kit
```

## Akses tanpa login

```text
Pengguna membuka console template
→ server membuat draft anonim
→ server menerbitkan edit token acak
→ token tersimpan di HttpOnly cookie
→ API menyimpan perubahan hanya jika token valid
```

Pengguna harus menerima tautan kelola atau kode pemulihan agar draft dapat diakses setelah ganti perangkat. Database menyimpan hash token/kode, bukan nilai mentahnya.

Tambahkan rate limit pada pembuatan draft, API update, dan upload asset.

## Upload foto

```text
Editor → signed upload URL → object storage → metadata asset di draft → preview/public renderer
```

Gunakan Cloudflare R2, Amazon S3, atau Cloudinary. Validasi jenis file, ukuran, dan jumlah asset sesuai section/template. Buat thumbnail serta optimasi WebP/AVIF.

## Publish

```text
Publish
→ validasi template, theme, section wajib, schema, dan asset
→ pilih path atau subdomain
→ cek slug/subdomain unik dan tidak reserved
→ simpan snapshot published
→ tampilkan URL publik
```

Perubahan setelah publish tersimpan sebagai draft. Pengguna menekan `Update publish` untuk memperbarui halaman publik.

## Struktur folder modular

```text
undangan-console/
  app/
    (console)/
      [templateCode]/page.tsx
      editor/[draftId]/page.tsx
    (public)/
      i/[slug]/page.tsx
      subdomain/[subdomain]/page.tsx
    api/
      drafts/route.ts
      drafts/[draftId]/route.ts
      drafts/[draftId]/publish/route.ts
      assets/sign/route.ts
    layout.tsx
    globals.css

  src/
    builder/
      contracts/
        template.ts
        section.ts
        invitation.ts
      editor/
        BuilderShell.tsx
        SectionLibrary.tsx
        SortableSectionList.tsx
        Inspector.tsx
        ThemePicker.tsx
      renderer/
        InvitationRenderer.tsx
        ThemeProvider.tsx
      state/
        draft-store.ts
        history-store.ts
      validation/
        validate-draft.ts

    templates/
      registry.ts
      shared/
        fonts/
        sections/
          gallery/
          map/
          rsvp/
          gift/
      wedding-lampung-elegance/
        manifest.ts
        themes.ts
        assets/
        sections/
          opening-envelope/
          hero/
          couple/
          wedding-events/
          unduh-mantu/
          closing/
        renderer.tsx
      wedding-modern-editorial/
        manifest.ts
        themes.ts
        assets/
        sections/
        renderer.tsx

    modules/
      drafts/
      assets/
      anonymous-access/
      domains/
    db/
      schema.ts
      migrations/

  middleware.ts
  next.config.ts
  package.json
```

Menambah template berarti menambahkan folder Template Kit dan satu registrasi di `src/templates/registry.ts`; engine editor tidak diubah.

## Urutan implementasi

### Sprint 1 — Project skeleton dan Template Kit contract

- Buat Next.js project baru di `App/undangan-console`.
- Siapkan MySQL, Drizzle ORM, schema draft, dan template registry.
- Buat Template Kit `wedding-lampung-elegance` berkode `hjydg`.

### Sprint 2 — Editor dasar

- Console route untuk kode template.
- Draft anonim, token cookie, recovery code, dan autosave.
- Live preview, edit teks/data, dan theme picker.

### Sprint 3 — Builder section dan foto

- Drag-and-drop memakai `dnd-kit`.
- Aturan section wajib/opsional dari manifest.
- Signed upload foto, galeri sortable, undo/redo.

### Sprint 4 — Publish dua paket URL

- Publish path `undangan.co/[slug]`.
- Host resolver/middleware untuk wildcard subdomain.
- Publish `[subdomain].undangan.co`.

### Sprint 5 — Template kedua

- Tambahkan Template Kit kedua dengan section, font, theme, dan renderer berbeda.
- Pastikan penambahan hanya berupa folder kit + registry entry.

## Keputusan sebelum coding

1. Provider hosting yang mendukung wildcard domain, misalnya Vercel atau Cloudflare.
2. Provider MySQL dan object storage untuk production.
3. Apakah subdomain menjadi fitur paket premium di masa depan.
4. Batas foto/audio dan masa aktif draft anonim.
5. Section wajib/opsional serta daftar theme/font untuk kit `hjydg`.
