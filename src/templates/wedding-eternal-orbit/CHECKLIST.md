# Eternal Orbit — Checklist Rilis

## Kontrak template

- [x] `code` unik, lima karakter, dan template terdaftar di katalog, registry, serta runtime registry.
- [x] Manifest memuat seluruh section, field yang tampil, capability yang benar, tema, harga, `defaultView`, dan `useContainer`.
- [x] Normalizer mempertahankan ID/urutan pengguna dan menambahkan section yang belum ada.
- [x] Navigation adapter mendukung envelope serta seluruh section aktif.

## Media dan konten

- [x] Tidak ada nama, foto, URL Maps, atau musik pengguna yang di-hard-code.
- [x] Hero dan mempelai menggunakan placeholder frame ketika foto kosong.
- [x] Galeri merender persis `imageUrls` dan tidak menyisakan foto fallback.
- [x] Peta membuka URL `mapUrl` terbaru di tab baru.
- [x] Gift memakai feature editor yang sudah ada: `showBank`, `hasSecondAccount`, dan `showQris`.
- [x] Rekening kedua dapat ditambahkan, diedit, disembunyikan, lalu ditampilkan lagi tanpa data terhapus.
- [x] Toggle rekening dan QRIS hanya mengubah visibilitas preview; data rekening, QRIS, dan label tetap tersimpan.
- [ ] RSVP mengirim status kehadiran yang benar dan menampilkan kegagalan kirim dengan aman.

## Motion dan aksesibilitas

- [x] Transisi 3D dipicu saat section terlihat dan dapat dimainkan ulang.
- [x] Seluruh section memiliki pilihan variant dekorasi, motion, partikel, dan intensitas.
- [x] Celestial Shower hanya aktif pada section terlihat dan dapat dimatikan per section.
- [x] Aset SVG memakai mask/token tema; tidak mengunci template ke satu preset warna.
- [x] Tidak ada animasi loop berat atau WebGL yang wajib untuk membaca konten.
- [x] `prefers-reduced-motion` menghasilkan layout statis yang tetap indah.
- [ ] Fokus keyboard, label tombol, kontras, dan target sentuh tetap jelas.

## Responsif dan state

- [ ] Opening dan hero utuh pada 320×568, 375×667, dan 390×844.
- [ ] Tidak ada overflow horizontal, konten terpotong, atau window editor ikut scroll.
- [ ] `useContainer: true` menampilkan card 480px di desktop; `false` tampil full-width responsif.
- [ ] Audio baru tidak autoplay sebelum membuka envelope/interaksi pengguna.
- [x] Hide/show section memakai `hidden` dan `display: none`, sekaligus menghapus item navigasi terkait.
- [x] Bridge idempoten: tidak menggeser scroll atau memulai ulang audio ketika state sama.

## Verifikasi akhir

- [ ] Draft baru, draft lama, local-first, login, dan kolaborator diuji.
- [ ] Editor realtime: teks, font, warna, background, foto, galeri, musik, Maps, dan gift diuji.
- [x] Minimal empat preset tema tersedia dan custom color override diterapkan oleh bridge.
- [ ] Demo dan published page diuji di iOS/Android/Desktop.
- [x] `npx tsc --noEmit` dan `npm run build` berhasil.
