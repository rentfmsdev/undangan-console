# Plan 03 — Admin User Lokal untuk Akses `/roots`

## Tujuan

Menambahkan autentikasi username/password khusus Roots Console dan kemampuan super admin menambah admin lain yang dapat mengakses `/roots`. Akun bootstrap menggunakan username `undanganku`; password awal menggunakan nilai yang diberikan pemilik project melalui secret environment, bukan ditulis plaintext ke source atau migration.

## Temuan Saat Audit

- `/roots` saat ini hanya menerima session Google dengan email yang tercantum di `src/modules/admin/auth.ts`.
- Session aplikasi sudah tersimpan di tabel `sessions` dan dibaca oleh `src/modules/auth/service.ts`.
- Tabel `users` mewajibkan email dan mendukung role `user | admin`, tetapi belum memiliki username/password hash.
- `AdminDashboardClient` hanya menampilkan daftar user; belum ada mutation untuk membuat admin Roots.
- Rate limiter reusable tersedia di `src/modules/security/rate-limit.ts`.

## Prinsip Keamanan Wajib

- Jangan commit password `Password1323` atau password admin lain ke repository, `.env.example`, fixture, migration, log, atau response API.
- Simpan password dengan `crypto.scrypt` + salt acak dan verifikasi memakai `timingSafeEqual`; alternatif Argon2 hanya jika dependency baru disetujui.
- Akun bootstrap dibuat lewat script idempotent yang membaca secret environment.
- Terapkan rate limit berdasarkan IP + username pada endpoint login.
- Cookie session memakai opsi `httpOnly`, `secure` production, `sameSite=lax/strict`, path `/`, dan expiry konsisten dengan tabel session.
- Admin yang dibuat harus mengganti password awal saat login pertama.
- Semua endpoint Roots tetap melakukan authorization server-side; menyembunyikan UI tidak cukup.

## Model Data yang Disarankan

Tambahkan tabel terpisah agar login Google biasa tidak dipaksa memiliki credential lokal.

```ts
type RootAdminCredential = {
  id: string;
  userId: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

Gunakan user internal terkait dengan role `admin`. Karena `users.email` wajib, script bootstrap dapat memakai email internal unik yang tidak dapat login Google, misalnya domain `.invalid`, tanpa menjadikannya whitelist email.

## Target File

- `src/db/schema.ts` — tabel credential dan audit admin.
- `drizzle/00xx_roots_admin_credentials.sql` dan metadata migration.
- `src/modules/admin/password.ts` — hash/verify murni server-only.
- `src/modules/admin/auth.ts` — authorization berbasis role admin + policy super admin.
- `src/modules/auth/service.ts` — reuse pembuatan session tanpa mengubah login Google.
- `src/modules/security/rate-limit.ts` — reuse/adaptor bucket login Roots.
- `app/api/auth/roots/login/route.ts` — login credential.
- `app/api/auth/roots/change-password/route.ts` — mandatory password change.
- `app/api/roots/admin-users/route.ts` — list/create admin.
- `app/api/roots/admin-users/[id]/route.ts` — disable/reset credential bila disetujui.
- `app/roots/page.tsx` — form login lokal + opsi Google admin.
- `src/components/admin/AdminDashboardClient.tsx` — modal tambah admin dan status akun.
- `scripts/bootstrap-roots-admin.mjs` — seed idempotent dari environment.
- `.env.example` — hanya nama variabel dan placeholder, tanpa password aktual.

## Checklist Implementasi

### Database dan Bootstrap

- [ ] Tambahkan tabel `root_admin_credentials` dengan unique index username lowercase.
- [ ] Tambahkan tabel/log audit untuk create, reset, disable, login success/failure sensitif.
- [ ] Buat migration forward-only dan cek kompatibilitas database existing.
- [ ] Buat script bootstrap idempotent untuk username `undanganku`.
- [ ] Baca password awal dari `ROOTS_BOOTSTRAP_PASSWORD` dan username dari `ROOTS_BOOTSTRAP_USERNAME`.
- [ ] Script gagal dengan pesan aman jika secret kosong/terlalu pendek.
- [ ] Jangan menampilkan password/hash/salt pada output script.
- [ ] Tandai bootstrap account `mustChangePassword=true`.

### Login dan Session

- [ ] Validasi payload dengan Zod: username normalized, password bounded.
- [ ] Gunakan pesan error generik untuk username tidak ada/password salah.
- [ ] Terapkan rate limit dan lock sementara setelah kegagalan berulang.
- [ ] Verifikasi hash dengan operasi constant-time.
- [ ] Reuse `createSession(userId)` dan cookie session yang sama dengan Google auth.
- [ ] Regenerasi session setelah login dan setelah perubahan password.
- [ ] Redirect aman hanya ke `/roots` atau path internal yang diizinkan.
- [ ] Jika `mustChangePassword`, batasi akses dashboard sampai password diganti.
- [ ] Logout existing tetap menghapus session admin lokal.

### Authorization

- [ ] Ubah `getAdminSession` agar menerima `user.role === "admin"` yang aktif.
- [ ] Pertahankan whitelist Google sebagai bootstrap/super-admin policy, bukan satu-satunya authorization.
- [ ] Bedakan `admin` dan `super admin` untuk aksi membuat/reset admin.
- [ ] Larang admin menurunkan akses dirinya sendiri atau menghapus super admin terakhir.
- [ ] Semua `/api/roots/*` memanggil guard yang sama.
- [ ] Jangan mengandalkan `proxy.ts` sebagai authorization utama.

### UI Roots

- [ ] Pada kondisi belum login, tampilkan form username/password dan tombol Google admin.
- [ ] Tambahkan loading, error generik, show/hide password, dan autocomplete yang benar.
- [ ] Tambahkan flow ganti password pertama.
- [ ] Pada tab pengguna, tambahkan tombol `Tambah Admin Roots`.
- [ ] Modal membuat username, display name, email opsional/internal, dan temporary password.
- [ ] Password temporary hanya ditampilkan sekali setelah create, tidak dikirim ulang pada list.
- [ ] Tampilkan status aktif, locked, must-change, dan last login tanpa hash/salt.
- [ ] Tambahkan aksi reset password/disable dengan dialog konfirmasi.

### Operasional

- [ ] Dokumentasikan cara menjalankan bootstrap di local, Docker, dan production secret manager.
- [ ] Tambahkan prosedur rotasi password bootstrap setelah deploy pertama.
- [ ] Pastikan backup database mencakup credential tetapi log aplikasi tidak mencetaknya.
- [ ] Tambahkan alert/audit untuk login gagal berulang.

### Validasi

- [ ] Login benar membuat session dan membuka `/roots`.
- [ ] Password salah tidak membocorkan keberadaan username.
- [ ] Rate limit/lock bekerja.
- [ ] User Google role biasa tetap menerima 403.
- [ ] Admin baru dapat login setelah dibuat dan wajib mengganti password.
- [ ] Endpoint overview tetap 403 tanpa session admin.
- [ ] Logout menghapus akses.
- [ ] Jalankan migration pada database kosong dan database existing.
- [ ] Jalankan `npm run lint` dan `npm run build`.

## Pembagian Multi-Agent

- **Agent DB/Security:** schema, migration, hashing, bootstrap script.
- **Agent API/Auth:** login, change password, guards, rate limit, session cookie.
- **Agent Roots UI:** form login, change-password screen, modal add/reset/disable.
- **Agent Security Review:** threat model, log inspection, session fixation, brute force, privilege escalation.

Merge berurutan: DB/Security → API/Auth → UI → security review. Jangan menjalankan bootstrap production dari agent tanpa secret dan persetujuan operator.

## Acceptance Criteria

- Akun bootstrap `undanganku` dapat mengakses `/roots` setelah secret disediakan dan bootstrap dijalankan.
- Tidak ada password plaintext di Git atau database.
- Super admin dapat menambah admin Roots lain melalui UI.
- User biasa tidak mendapat akses meskipun memanggil API secara langsung.

