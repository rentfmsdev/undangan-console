# Plan 05 — Tambahkan Jam dan Lokasi pada Teks WhatsApp

## Tujuan

Memperbarui seluruh preset pesan WhatsApp agar menyertakan tanggal, jam, venue/alamat, dan link undangan personal secara eksplisit, seperti pola pada project Wedding. Berlaku untuk seluruh kategori dan template aktif.

## Prasyarat

- Gunakan `InvitationShareData` dari `PLAN_01_DYNAMIC_SHARE_CARDS.md` agar card dan teks WhatsApp tidak menampilkan data berbeda.
- Jika Plan 01 belum selesai, agent boleh membuat resolver event sebagai commit terpisah di module baru, lalu Plan 01 wajib mengadopsinya—jangan menambah heuristic langsung ke setiap branch pesan.

## Temuan Saat Audit

- Semua pesan saat ini berada dalam fungsi besar `getWhatsAppMessage` di `src/builder/editor/ConsoleWorkspace.tsx`.
- Pesan menyebut “detail/lokasi” tetapi tidak menampilkan nilai tanggal, jam, atau alamat.
- Function membaca `section.defaultData`, sedangkan data aktual editor perlu dinormalisasi secara jelas.
- Key event berbeda antar template: `date`, `akadTime`, `receptionTime`, `subtitle`, `venue`, `locationName`, `venueName`, `address`, dan `venueAddress`.
- Pembuatan URL path dan subdomain masih bercampur dengan format pesan dan memiliki hardcode domain.

## Keputusan Arsitektur

1. Ekstrak generator pesan dari `ConsoleWorkspace.tsx` ke module pure function.
2. Gunakan satu data normalisasi `InvitationShareData` untuk subject, tanggal, jam, venue, dan alamat.
3. Pisahkan pembentukan URL personal dari formatting pesan.
4. Definisikan formatter per kategori/preset, tetapi detail event menggunakan helper bersama.
5. Untuk field kosong, hilangkan baris terkait—jangan menampilkan `undefined`, label kosong, atau punctuation yatim.

## Bentuk Input yang Disarankan

```ts
type WhatsAppInvitationInput = {
  preset: "formal" | "islami" | "casual" | "english";
  category: TemplateKit["category"];
  guestName: string;
  invitationUrl: string;
  share: InvitationShareData;
};
```

Contoh blok event Indonesia:

```text
Yang akan dilaksanakan pada:
🗓️ Sabtu, 14 November 2026
⏰ Akad: 08.00 WIB
⏰ Resepsi: 11.00–14.00 WIB
📍 The Gaia Hotel
Jl. Dr. Setiabudi No. 430, Bandung
```

Kategori non-wedding memakai label netral `Waktu` atau label dari manifest, bukan memaksakan `Akad/Resepsi`.

## Target File

- `src/modules/generator/build-whatsapp-message.ts` — formatter pure.
- `src/modules/generator/build-event-detail-lines.ts` — detail conditional dan localized labels.
- `src/modules/generator/build-personal-invitation-url.ts` — path/subdomain/custom domain + guest.
- `src/modules/share-card/resolve-invitation-share-data.ts` — sumber data event bersama.
- `src/builder/editor/ConsoleWorkspace.tsx` — hanya wiring state ke module baru.
- `src/builder/editor/components/BulkGuestManager.tsx` — konsumsi builder tanpa duplikasi.
- `src/lib/app-url.ts` — normalisasi URL dan guest query untuk path/subdomain.

## Checklist Implementasi

### Normalisasi Data

- [ ] Ambil hanya section aktif.
- [ ] Prioritaskan section bertipe `event`; fallback ke `location`, `map`, `hero`, atau opening sesuai mapping manifest.
- [ ] Ambil tanggal dari locator manifest, bukan mencari sembarang `subtitle` terlebih dahulu.
- [ ] Dukung satu waktu umum dan dua waktu wedding.
- [ ] Dukung venue + alamat terpisah tanpa menggandakan teks yang sama.
- [ ] Trim whitespace, normalisasi line break, dan batasi panjang alamat.
- [ ] Pastikan data berasal dari state section editor terbaru.

### URL Personal

- [ ] Buat helper tunggal untuk publish mode `path`, `subdomain`, dan `custom_domain`.
- [ ] Selalu tambahkan guest ke URL meskipun `publishUrl` generik sudah tersedia.
- [ ] Gunakan konfigurasi `NEXT_PUBLIC_APP_URL/ROOT_DOMAIN`, bukan `undangan.co` hardcoded.
- [ ] Encode nama tamu dengan `URL`/`URLSearchParams` agar spasi, plus, gelar, dan Unicode aman.
- [ ] Pastikan URL pada pesan sama dengan URL yang disimpan Bulk Guest Manager.

### Formatter Preset

- [ ] Formal wedding: tanggal, akad, resepsi, venue, alamat.
- [ ] Islami wedding: detail event yang sama dengan pembuka/penutup Islami.
- [ ] Casual wedding: detail ringkas tetapi tetap lengkap.
- [ ] English wedding: `Date`, `Ceremony`, `Reception`, `Venue`.
- [ ] Khitanan: tanggal, waktu utama, lokasi.
- [ ] Aqiqah: tanggal, waktu utama, venue/alamat.
- [ ] Birthday: tanggal, waktu pesta, venue/alamat.
- [ ] Wisuda: tanggal, waktu ceremony/syukuran yang tersedia, venue/alamat.
- [ ] Default category: gunakan label netral.
- [ ] Baris kosong tidak meninggalkan lebih dari dua newline beruntun.

### UI Generator

- [ ] Preview chat langsung berubah ketika section tanggal/jam/lokasi diedit.
- [ ] Tambahkan indikator data event belum lengkap bila semua detail kosong.
- [ ] Pertahankan empat preset dan pilihan aktif.
- [ ] Bulk share dan single preview memakai function yang sama.
- [ ] Copy/share WhatsApp memakai string final yang sama dengan preview.

### Validasi

- [ ] Buat matriks fixture minimal satu undangan untuk setiap template aktif.
- [ ] Snapshot setiap kategori × empat preset.
- [ ] Uji event lengkap, sebagian, dan kosong.
- [ ] Uji alamat multiline dan karakter Unicode.
- [ ] Uji URL path/subdomain/custom-domain dengan nama tamu personal.
- [ ] Verifikasi pesan WhatsApp tidak mengandung `[object Object]`, `undefined`, atau link generik tanpa guest.
- [ ] Jalankan `npm run lint` dan `npm run build`.

## Pembagian Multi-Agent

- **Agent Resolver:** mapping event semua manifest dan `InvitationShareData`.
- **Agent Message Formatter:** module pure + semua preset/kategori.
- **Agent URL:** helper publish URL personal dan test encoding.
- **Agent Integration:** wiring tipis pada `ConsoleWorkspace` dan `BulkGuestManager`.
- **Agent QA:** fixture matrix dan pemeriksaan WhatsApp desktop/mobile.

Agent Integration dikerjakan terakhir agar tidak bentrok dengan Agent Card Style yang juga menyentuh `ConsoleWorkspace.tsx`.

## Acceptance Criteria

- Setiap pesan menampilkan detail event aktual yang tersedia sebelum link.
- Edit tanggal/jam/lokasi langsung tercermin di preview Generator.
- Semua mode publish menghasilkan link personal yang valid.
- Card dinamis dan teks WhatsApp memakai nama, tanggal, serta lokasi yang sama.

