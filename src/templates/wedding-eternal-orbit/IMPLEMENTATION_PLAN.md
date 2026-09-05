# Eternal Orbit — Rencana Implementasi

Rencana dekoratif premium dan kontrol kustomisasi per section dijabarkan di `DECORATIVE_ASSET_PLAN.md`.

## Arah kreatif

Template pernikahan sinematik bertema **midnight sapphire dan champagne gold**. Ilusi kedalaman dibuat dengan CSS 3D, SVG berlapis, dan transisi berbasis `IntersectionObserver`; bukan WebGL. Tujuannya adalah pengalaman mewah yang tetap cepat pada ponsel.

Musik bawaan template adalah `Can't-Help-Falling-In-Love-Piano-Version.mp3`; pemutaran baru dimulai setelah interaksi membuka envelope dan tetap dapat diganti melalui pustaka musik editor.

Foto pengguna tidak pernah diisi foto contoh. Hero, mempelai, dan galeri hanya menampilkan frame placeholder yang siap diisi lewat Asset Manager.

## Struktur section

1. `opening-envelope` — amplop malam hari yang membuka menjadi kartu undangan.
2. `hero` — nama mempelai, tanggal, frame foto, dan orbit dekoratif.
3. `couple` — dua frame mempelai dengan efek panel perspektif.
4. `event` — akad, resepsi, lokasi, Maps, dan Simpan ke Kalender.
5. `story` — timeline hubungan berupa lapisan kartu kertas yang terangkat.
6. `gallery` — frame foto miring berlapis; tanpa foto fallback.
7. `gift` — rekening dan QRIS modular sesuai kontrak template: rekening pertama, tambah rekening kedua yang tetap editable, serta toggle terpisah untuk menampilkan/menyembunyikan rekening dan QRIS tanpa menghapus data.
8. `wishes` — RSVP dan buku ucapan.
9. `closing` — pesan penutup dengan ornament orbit dan SVG merpati.

## Bahasa visual dan animasi

- Latar menggunakan token warna, gradien radikal, grain CSS halus, dan SVG orbit.
- Setiap section memiliki maksimal tiga layer dekoratif: belakang, konten, depan.
- Transisi section memakai `transform: perspective(...) rotateX(...) translateY(...)` dan opacity, lalu kembali netral setelah selesai.
- Efek hanya berjalan ketika section masuk viewport dan dapat diputar ulang setelah keluar-masuk viewport.
- Animasi tidak berjalan terus-menerus kecuali indikator kilau yang sangat ringan.
- `prefers-reduced-motion: reduce` menonaktifkan transformasi dan mempertahankan informasi visual.

## Aset statis

Gunakan atau kembangkan aset SVG bertoken warna di `public/assets/wedding/`:

- `eternal-orbit-rings.svg` — orbit/lintasan cahaya.
- `eternal-orbit-stars.svg` — bintang dan kilau dekoratif.
- `eternal-orbit-dove.svg` — merpati untuk penutup.
- `eternal-orbit-frame.svg` — ornament frame foto tanpa foto bawaan.

`merpati.png` yang sudah ada boleh dipakai sebagai opsi background penutup dengan opacity rendah. Aset pengguna selalu berasal dari URL upload Asset Manager, tidak pernah dari folder publik.

## Integrasi editor

- Manifest mendefinisikan seluruh section, field, capability, minimal empat preset tema, dan `useContainer: true`.
- Bridge wajib idempoten; menerapkan enabled/hidden, text style, media, galeri, peta, musik, dan token tema.
- Normalizer menambahkan section baru untuk draft lama tanpa mengubah urutan yang disengaja pengguna.
- Adapter memastikan sidebar, scroll preview, dan floating/bottom navigation sinkron.
- Setiap foto memakai `imageUrl` atau `imageUrls` sesuai kontrak dan menyediakan placeholder ketika URL kosong.

## Preset awal

1. Midnight Sapphire — navy gelap, champagne, ivory.
2. Aurora Plum — plum tua, mauve, gold lembut.
3. Pearl Dawn — ivory, dusty blue, rose gold.
4. Celestial Teal — teal gelap, silver mist, dan ice blue.

## Tahapan kerja

1. Buat manifest, normalizer, adapter, runtime, katalog, dan thumbnail.
2. Buat shell mobile-first, envelope, hero, token warna, serta musik global.
3. Implementasi section konten dan frame media kosong.
4. Implementasi bridge state editor dan hide/show section.
5. Tambahkan SVG dekoratif dan transisi 3D bertahap.
6. Uji editor, draft lama, demo, publikasi, dan ukuran mobile wajib.
7. Audit performa, aksesibilitas, serta reduced motion sebelum rilis.
