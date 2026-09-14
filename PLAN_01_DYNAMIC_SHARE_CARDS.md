# Plan 01 — Dynamic Share Cards untuk Semua Template

## Tujuan

Membuat Open Graph share card dinamis berformat PNG `1200x630` untuk setiap undangan terbit. Card harus mengikuti identitas template, menampilkan nama acara/subjek, tanggal, lokasi ringkas, dan nama tamu dari link Generator. WhatsApp harus dapat mengambil card tanpa menjalankan JavaScript.

## Temuan Saat Audit

- Metadata publik berada di `app/i/[slug]/page.tsx` dan saat ini memakai gambar statis dari `src/templates/invitation-seo.ts`.
- Data setiap template tidak memakai key yang seragam; contoh waktu dapat berada di `akadTime`, `receptionTime`, atau `subtitle`, sedangkan lokasi dapat berada di `venue`, `locationName`, `venueName`, `address`, atau `venueAddress`.
- Semua template terdaftar melalui `src/templates/registry.ts` dan `src/templates/runtime-registry.ts`.
- URL tamu sudah menggunakan query `?for=...`; nilai ini tersedia di `generateMetadata`, sehingga card dapat dipersonalisasi server-side.
- Endpoint card tidak boleh mengimpor renderer template client karena `ImageResponse` memiliki batas CSS/Satori sendiri.

## Keputusan Arsitektur

1. Tambahkan kontrak share lintas-template bernama `InvitationShareData`.
2. Tambahkan deklarasi `share` pada setiap `TemplateKit`, berisi resolver field dan daftar style card yang didukung template.
3. Buat resolver murni yang mengubah section template menjadi `InvitationShareData`.
4. Buat registry renderer card server yang terpisah dari runtime renderer undangan.
5. Buat endpoint publik `GET /api/share-card/[slug]` yang mengembalikan PNG melalui `ImageResponse` dari `next/og`.
6. Ubah metadata undangan publik agar `openGraph.images` dan `twitter.images` menunjuk endpoint dinamis dengan query tamu dan versi cache.
7. Gunakan fallback generik agar draft lama tetap memiliki preview saat konfigurasi share belum lengkap.

## Kontrak Data yang Disarankan

```ts
type InvitationShareData = {
  templateId: string;
  category: TemplateKit["category"];
  subject: string;
  secondarySubject?: string;
  guestName: string;
  guestLabel: string;
  eventDate?: string;
  primaryTime?: string;
  secondaryTime?: string;
  venue?: string;
  address?: string;
  cardStyleId: string;
  cardImageUrl?: string;
  colors: { background: string; primary: string; accent: string; text: string };
};
```

Konfigurasi manifest sebaiknya memakai locator deklaratif seperti `{ sectionTypes: ["event"], keys: ["venue", "locationName", "venueName"] }`, bukan rangkaian `if` baru di editor.

## Target File

- `src/templates/contracts.ts` — tipe `TemplateShareConfig` dan `TemplateShareCardStyle`.
- `src/templates/schema.ts` — validasi konfigurasi share pada manifest.
- `src/templates/*/manifest.ts` — mapping data dan style default untuk seluruh template aktif.
- `src/modules/share-card/contracts.ts` — bentuk data normalisasi dan setting card.
- `src/modules/share-card/resolve-invitation-share-data.ts` — resolver tunggal untuk card dan pesan WhatsApp.
- `src/modules/share-card/registry.tsx` — registry renderer berdasarkan `template.id` dan `cardStyleId`.
- `src/modules/share-card/renderers/*` — renderer Satori per keluarga desain.
- `src/modules/publishing/load-published-invitation.ts` — ekstraksi loader yang kini lokal di `app/i/[slug]/page.tsx` agar dapat dipakai endpoint card.
- `app/api/share-card/[slug]/route.tsx` — response PNG dinamis.
- `app/i/[slug]/page.tsx` — metadata OG/Twitter mengarah ke endpoint card.
- `src/templates/invitation-seo.ts` — memakai hasil normalisasi yang sama untuk title/description.

## Checklist Implementasi

### Fondasi Data

- [ ] Definisikan `InvitationShareData`, `ShareFieldLocator`, dan `TemplateShareConfig`.
- [ ] Buat helper sanitasi nama tamu: trim, normalisasi whitespace, decode `+/%20`, maksimal 120 karakter.
- [ ] Buat resolver field dengan urutan prioritas eksplisit dan hanya membaca section aktif.
- [ ] Pastikan resolver menggunakan data section tersimpan, bukan `defaultData` manifest.
- [ ] Tambahkan mapping untuk `wedding-lampung-elegance`.
- [ ] Tambahkan mapping untuk `wedding-verdant-vows`.
- [ ] Tambahkan mapping untuk `wedding-eternal-orbit`.
- [ ] Tambahkan mapping untuk `wedding-avant-vows` setelah perubahan template aktif selesai/merge.
- [ ] Tambahkan mapping untuk `birthday-celestial`.
- [ ] Tambahkan mapping untuk `khitan-ksatria-jawa`.
- [ ] Tambahkan mapping untuk `aqiqah-little-bloom`.
- [ ] Tambahkan mapping untuk `wisuda-elegance`.
- [ ] Tambahkan assertion registry agar template aktif tanpa konfigurasi share gagal saat development/build.

### Renderer Card

- [ ] Buat renderer fallback generik yang selalu aman.
- [ ] Buat renderer visual yang mengikuti font, warna, frame, dan motif setiap template.
- [ ] Tampilkan nama tamu dengan fallback `Bapak/Ibu/Saudara/i`.
- [ ] Batasi panjang subject, lokasi, dan nama tamu serta gunakan ukuran font adaptif.
- [ ] Pastikan asset gambar menjadi URL absolut yang dapat diakses crawler publik.
- [ ] Gunakan PNG, bukan SVG langsung, untuk kompatibilitas WhatsApp.
- [ ] Tambahkan alt text sesuai kategori dan subjek acara.
- [ ] Pastikan card tetap terbaca ketika foto gagal dimuat.

### Endpoint dan Metadata

- [ ] Pindahkan loader undangan terbit ke module server-only reusable.
- [ ] Endpoint menolak slug tidak terbit/expired dengan `404`.
- [ ] Endpoint menerima `for`, `style`, dan `v` sebagai query yang disanitasi.
- [ ] `v` memakai `invitation.updatedAt` atau version setting untuk cache busting.
- [ ] Set `Content-Type: image/png` dan cache publik yang tetap terpisah per URL query.
- [ ] `generateMetadata` mempertahankan canonical URL tanpa nama tamu.
- [ ] `openGraph.images` dan `twitter.images` memakai URL card personal.
- [ ] Jangan menaruh secret, token edit, atau data privat lain di URL card.

### Validasi

- [ ] Uji endpoint untuk guest default dan guest personal.
- [ ] Uji karakter spasi, `+`, `%20`, gelar, apostrof, ampersand, dan Unicode.
- [ ] Uji seluruh template registry menghasilkan PNG `1200x630`.
- [ ] Uji response tanpa foto dan dengan URL upload lokal/proxy.
- [ ] Periksa HTML publik mengandung `og:image`, width, height, dan alt yang benar.
- [ ] Jalankan `npm run lint` dan `npm run build`.
- [ ] Setelah deploy, uji URL baru di WhatsApp; gunakan query `v` baru untuk menghindari cache preview lama.

## Pembagian Multi-Agent

- **Agent Share Core:** kontrak, resolver, loader published, dan assertion registry.
- **Agent Card Renderer:** renderer Satori seluruh template; tidak mengubah `ConsoleWorkspace.tsx`.
- **Agent Metadata:** endpoint route, metadata publik, caching, dan smoke test.
- **Agent QA:** matriks semua template/nama tamu dan verifikasi ukuran/content-type.

## Dependensi dan Urutan Merge

1. Merge kontrak + resolver.
2. Merge renderer card.
3. Merge endpoint + metadata.
4. Baru kerjakan `PLAN_02_CARD_STYLE_EDITOR.md` dan konsumsi resolver ini di `PLAN_05_WHATSAPP_EVENT_DETAILS.md`.

## Acceptance Criteria

- Link Generator untuk seluruh template menampilkan preview WhatsApp berupa card sesuai template.
- Nama tamu pada card sama dengan nama pada konten undangan.
- Perubahan card style/foto ter-publish menghasilkan URL preview baru melalui cache version.
- Tidak ada template aktif yang diam-diam kembali ke foto SEO statis tanpa fallback yang terdeteksi.

