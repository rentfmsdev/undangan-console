# Production Release Checklist

## Sebelum Deploy

- [ ] Pastikan seluruh perubahan yang diuji sudah di-commit pada branch `main`.
- [ ] Cadangkan database MySQL sebelum menjalankan migrasi.
- [ ] Isi `.env` server dengan URL publik HTTPS, secret minimal 32 karakter, konfigurasi payment gateway, MySQL, Redis, dan collaboration WebSocket (`wss://`).
- [ ] Setelah Roots Super Admin aktif, isi Meta Pixel ID melalui menu Manajemen Admin Roots bila tracking akan digunakan.
- [ ] Jalankan `npm run predeploy:check` pada server; perbaiki seluruh error sebelum deploy.
- [ ] Jalankan `npm audit --omit=dev --audit-level=high` dan `npm run build`.

## Deploy dan Migrasi

- [ ] Build dan jalankan container/PM2 menggunakan environment produksi.
- [ ] Jalankan `npm run db:migrate` satu kali untuk menerapkan migrasi database, termasuk tabel Roots Admin.
- [ ] Jalankan `npm run db:bootstrap:roots` satu kali dengan `ROOTS_BOOTSTRAP_USERNAME` dan `ROOTS_BOOTSTRAP_PASSWORD` yang kuat; login pertama wajib mengganti password.
- [ ] Pastikan reverse proxy menyediakan HTTPS untuk domain utama dan wildcard subdomain (`*.ROOT_DOMAIN`) bila fitur subdomain undangan dipakai.
- [ ] Pastikan volume upload, Redis, dan database memiliki backup terjadwal.

## Verifikasi Setelah Deploy

- [ ] Buka beranda, editor, login Google, dan `/roots` melalui domain produksi.
- [ ] Buat undangan, publish, lalu cek URL utama serta `/to/Nama%20Tamu` menampilkan nama tanpa karakter `+` atau `%20`.
- [ ] Kirim satu RSVP dan cek data ucapan tersimpan setelah refresh.
- [ ] Cek WhatsApp preview memakai URL share card yang benar.
- [ ] Uji payment sandbox dan callback dengan header `X-Callback-Secret` yang sesuai.
- [ ] Cek Meta Events Manager/Test Events untuk `PageView`, `ViewContent`, `Lead`, `Contact`, dan `InitiateCheckout`.

## Rollback

- [ ] Simpan image atau commit versi sebelumnya sebelum deploy.
- [ ] Rollback aplikasi ke image/commit terakhir bila healthcheck gagal.
- [ ] Jangan rollback migrasi database tanpa rencana migrasi balik dan backup yang sudah diverifikasi.
