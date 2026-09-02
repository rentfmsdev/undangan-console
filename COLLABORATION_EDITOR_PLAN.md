# Plan Realtime Collaboration Editor

Status dokumen: rancangan teknis, belum dieksekusi  
Terakhir diperbarui: 2 September 2026  
Scope: editor modular untuk semua Template Kit, bukan hanya template wedding `hjydg`

## 1. Tujuan

Membangun collaboration editor yang memungkinkan pemilik undangan:

- mengundang pengguna berdasarkan email;
- memberi role `editor` atau `viewer`;
- menampilkan undangan milik sendiri dan undangan yang dibagikan pada daftar akun;
- menampilkan avatar anggota yang sedang aktif di navbar editor;
- mengedit dokumen yang sama secara realtime tanpa perubahan saling menimpa;
- menampilkan cursor, section aktif, dan status pengguna lain secara realtime;
- tetap mempertahankan arsitektur Template Kit sehingga collaboration dapat digunakan oleh template pernikahan, khitanan, ulang tahun, dan template baru lainnya.

Collaboration hanya tersedia bagi pengguna yang login. Mode editor anonim/local-first tetap dapat digunakan untuk draft pribadi, tetapi tidak boleh membuka channel realtime atau mengundang anggota.

## 2. Hasil audit implementasi saat ini

### Sudah tersedia

- [x] Tabel dasar `invitation_collaborators` dengan email, `user_id`, role `editor/viewer`, status, dan inviter.
- [x] Endpoint daftar dan undang anggota pada `GET/POST /api/drafts/:draftId/collaborators`.
- [x] Endpoint cabut akses pada `DELETE /api/drafts/:draftId/collaborators/:collaboratorId`.
- [x] Resolver akses draft sudah mengenali `owner`, `editor`, `viewer`, dan `anonymous`.
- [x] Endpoint penyimpanan draft menolak role `viewer` untuk melakukan `PATCH`.
- [x] Modal dasar untuk mengundang dan menampilkan anggota tim.
- [x] Daftar undangan mulai menggabungkan draft milik sendiri dan draft kolaborasi.
- [x] Pengguna yang login dengan email yang sesuai saat ini otomatis ditautkan ke undangan kolaborasi.
- [x] Data editor anonim disimpan local-first dan data pengguna login disimpan ke MySQL.

### Gap dan risiko yang harus dibereskan

- [ ] Belum ada transport realtime, presence, avatar aktif, remote cursor, atau sinkronisasi perubahan antarbrowser.
- [ ] Autosave saat ini mengirim seluruh snapshot dan menghapus lalu memasukkan ulang seluruh row section. Dua editor dapat saling menimpa dengan mekanisme last-write-wins.
- [ ] `invite_token` disimpan plaintext, memiliki index langsung, dan ikut dikembalikan oleh endpoint daftar anggota. Token perlu di-hash dan tidak boleh dikirim pada response daftar.
- [ ] Status invitation baru `pending/accepted`; belum ada `declined`, `revoked`, dan `expired`.
- [ ] Pengguna yang sudah ada langsung dianggap accepted, sedangkan pengguna baru otomatis accepted saat login. Belum ada halaman persetujuan eksplisit.
- [ ] Pesan UI menyatakan email telah “dikirim”, tetapi belum ditemukan adapter/provider pengiriman email.
- [ ] Belum ada endpoint untuk mengubah role anggota tanpa mengirim ulang invite.
- [ ] Belum ada capability guard terpusat untuk seluruh endpoint draft, asset, generator, wishes, publish, dan collaborator management.
- [ ] Belum ada revision, idempotency key, audit log, atau conflict recovery.
- [ ] Schema collaborator belum masuk ke rantai migration Drizzle yang terlacak; saat ini ada script migrasi ad-hoc terpisah.
- [ ] Query daftar draft kolaborasi perlu dirapikan dan diverifikasi build karena referensi collaborator harus memiliki import/type yang konsisten.
- [ ] Tombol publish, upload asset, generator, dan halaman ucapan harus mengikuti capability, bukan hanya kondisi “sudah login”.

## 3. Keputusan arsitektur

### 3.1 Pemisahan data durable dan ephemeral

| Jenis data | Penyimpanan | Contoh |
|---|---|---|
| Durable | MySQL | owner, collaborator, role, invitation, section snapshot, revision, audit log |
| Shared document aktif | Yjs document | theme, global settings, urutan section, enabled state, data section |
| Ephemeral | Realtime provider/Redis | online, idle, cursor, selected section, viewport, heartbeat |
| Asset | asset storage yang sudah ada + metadata MySQL | image/audio milik pengguna dan referensi di section |

Presence dan cursor tidak disimpan ke MySQL. Data tersebut memiliki TTL dan hilang otomatis ketika koneksi terputus.

### 3.2 Engine kolaborasi

Gunakan **Yjs (CRDT)** sebagai format dokumen kolaboratif. Alasan utama: editor mengubah nested JSON, teks, style, image list, serta urutan section; optimistic full-snapshot saja tidak cukup aman untuk pengeditan simultan.

Susunan shared document:

```text
Y.Doc invitation:{draftId}
├── meta: Y.Map
│   ├── schemaVersion
│   ├── templateId
│   └── templateVersion
├── settings: Y.Map
│   ├── themeId
│   ├── musicUrl
│   ├── musicVolume
│   └── customColors
├── sectionOrder: Y.Array<sectionId>
└── sections: Y.Map<sectionId, Y.Map>
    ├── type
    ├── enabled
    └── data
```

Kontrak ini tidak menyimpan field khusus wedding pada layer collaboration. Isi `data` tetap mengikuti schema section dari Template Kit masing-masing.

### 3.3 Transport realtime

Buat abstraksi `RealtimeCollaborationAdapter`, agar produk tidak terkunci pada satu vendor:

```ts
interface RealtimeCollaborationAdapter {
  connect(input: ConnectionInput): Promise<CollaborationConnection>;
  authorize(input: AuthorizeInput): Promise<ShortLivedCredential>;
}
```

Pilihan implementasi:

1. MVP tercepat: managed realtime yang mendukung authenticated channels dan Yjs.
2. Self-hosted: service WebSocket terpisah + Redis pub/sub/presence + persistence worker MySQL.

Jangan menjalankan WebSocket stateful langsung pada route handler Next.js apabila deployment bersifat serverless. Next.js tetap menjadi auth/API layer; realtime gateway menjadi proses tersendiri atau layanan managed.

### 3.4 Persistence shared document

- Ketika room pertama dibuka, gateway mengambil snapshot terbaru dari MySQL.
- Perubahan Yjs dibroadcast ke anggota room.
- Persistence worker melakukan debounce snapshot, misalnya 2 detik, dan forced flush maksimal 10 detik.
- Snapshot disimpan dengan `revision` monotonik dalam satu transaksi.
- Saat semua anggota keluar, lakukan final flush.
- Endpoint publish selalu membaca snapshot durable terbaru setelah meminta room flush.
- Simpan update log sementara hanya bila dibutuhkan untuk recovery; lakukan compact menjadi snapshot agar ukuran tidak tumbuh tanpa batas.

## 4. Model permission

Gunakan capability, bukan pengecekan role yang tersebar.

| Capability | Owner | Editor | Viewer |
|---|:---:|:---:|:---:|
| Buka editor/preview | Ya | Ya | Ya |
| Presence dan cursor | Ya | Ya | Ya |
| Edit global/section | Ya | Ya | Tidak |
| Drag, add, remove section | Ya | Ya | Tidak |
| Memilih asset yang sudah tersedia | Ya | Ya | Tidak |
| Upload/delete asset | Ya | Sesuai kebijakan asset | Tidak |
| Generator tamu | Ya | Opsional | Tidak |
| Melihat ucapan | Ya | Opsional | Opsional |
| Publish/request domain | Ya | Tidak | Tidak |
| Invite, ubah role, cabut anggota | Ya | Tidak | Tidak |
| Hapus/arsipkan draft | Ya | Tidak | Tidak |

Implementasikan satu fungsi server:

```ts
requireDraftCapability(draftId, capability): Promise<DraftPrincipal>
```

Semua API, token realtime, upload asset, dan server action wajib memanggil fungsi ini. UI boleh menyembunyikan atau men-disable kontrol, tetapi server tetap menjadi sumber keputusan akses.

Jika akses dicabut saat user masih online, server menerbitkan event `membership.revoked`, memutus user dari room, dan UI kembali ke halaman daftar undangan.

## 5. Lifecycle invitation

Status target:

```text
pending -> accepted
pending -> declined
pending -> expired
pending/accepted -> revoked
revoked -> pending (invite ulang dengan token baru)
```

Flow:

1. Owner mengisi email dan role.
2. Server menormalisasi email, memastikan bukan owner, membuat token acak, dan hanya menyimpan `token_hash`.
3. Server membuat record invitation + email outbox dalam satu transaksi.
4. Email berisi link `/collaboration/invite/:token`.
5. Jika belum login, pengguna login Google dan dikembalikan ke link tersebut.
6. Server memastikan email akun sama dengan email tujuan.
7. Pengguna memilih Terima atau Tolak.
8. Setelah accepted, undangan tampil pada tab **Dibagikan kepada saya** dan editor dapat dibuka sesuai role.

Auto-link berdasarkan email dapat dipertahankan sementara untuk kompatibilitas migrasi, tetapi harus dihapus setelah acceptance flow tersedia.

## 6. Presence, avatar, dan cursor

### Prinsip utama: awareness only

Collaboration **tidak boleh mengambil alih editor lokal**. Setiap pengguna tetap memiliki viewport, scroll, zoom, device preview, section aktif, field focus, modal, dan navigasinya sendiri.

Event dari collaborator hanya dipakai sebagai informasi visual:

- tampilkan cursor collaborator jika posisi tersebut sedang terlihat pada viewport pengguna saat ini;
- tampilkan badge seperti `Dwi sedang mengedit Judul` atau outline berwarna pada field yang sama;
- jangan menjalankan `focus()`, `scrollIntoView()`, perubahan tab, perubahan section aktif, membuka modal, atau mengubah viewport berdasarkan event collaborator;
- jangan menyinkronkan posisi scroll antaruser;
- jangan menyinkronkan navigasi bottom navbar di preview antaruser;
- jangan mengunci field. Dua editor tetap dapat mengedit field yang sama dan Yjs akan menggabungkan perubahannya;
- indikator field aktif hanya dekoratif dan wajib memakai `pointer-events: none`;
- sediakan aksi eksplisit `Ikuti tampilan Dwi` di masa depan bila dibutuhkan, tetapi default selalu tidak mengikuti.

Dengan aturan ini terdapat dua state yang terpisah:

```text
Shared/dibagikan:       isi teks, gambar, theme, data section, urutan section
Local/tidak dibagikan: scroll, focus, tab editor, selected section, zoom, viewport, modal
Awareness sementara:   cursor, fieldPath, sectionId, status aktif/idle
```

`selected section` milik collaborator hanya dikirim sebagai awareness untuk label/status. Nilai tersebut tidak boleh ditulis ke navigation store pengguna lain.

### 6.1 Presence payload

```ts
type CollaborationPresence = {
  connectionId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  role: "owner" | "editor" | "viewer";
  state: "active" | "idle";
  surface: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
  sectionId: string | null;
  fieldPath: string | null;
  cursor: { x: number; y: number } | null;
  updatedAt: number;
};
```

- Warna diturunkan secara deterministik dari `userId`, sehingga stabil setelah reconnect.
- Presence memiliki heartbeat dan TTL, misalnya heartbeat 15 detik dan offline setelah 45 detik.
- Tab ganda dari user yang sama boleh memiliki beberapa connection, tetapi navbar mengelompokkannya menjadi satu avatar.
- Mobile/touch mengirim section aktif dan presence, tetapi tidak wajib menampilkan cursor.

### 6.2 Avatar navbar

Buat `CollaboratorAvatarStack` di kanan navbar, sebelum menu akun:

- menampilkan owner dan anggota yang sedang online;
- dot hijau untuk aktif, amber untuk idle;
- maksimal 4 avatar lalu badge `+N`;
- tooltip berisi nama, role, dan section yang sedang dibuka;
- klik membuka `CollaborationPopover` berisi Online, Offline, dan Pending;
- owner dapat membuka modal invite/manage dari popover;
- viewer/editor hanya dapat melihat daftar anggota.

### 6.3 Remote cursor

Buat `RemoteCursorLayer` sebagai overlay non-interaktif (`pointer-events: none`). Event cursor:

- dikirim maksimal setiap 30–50 ms dan hanya ketika posisi berubah;
- menggunakan koordinat ternormalisasi relatif terhadap surface, bukan koordinat window;
- membawa `sectionId` untuk menghindari cursor tampil pada section yang salah;
- diinterpolasi pada client agar gerak halus;
- disembunyikan setelah beberapa detik idle dan dihapus saat disconnect;
- menghormati `prefers-reduced-motion`.

Untuk preview iframe, tambahkan `PreviewCollaborationBridge`:

```text
pointermove di iframe
  -> postMessage PREVIEW_POINTER ke editor parent
  -> normalisasi berdasarkan viewport preview
  -> realtime presence
  -> RemoteCursorLayer penerima melakukan transform ke frame aktif
```

Pesan `postMessage` wajib memeriksa `origin`, `draftId`, dan schema version. Bridge ini juga membawa event section aktif agar pilihan sidebar tetap sinkron, tetapi tidak pernah menjalankan scroll pada window parent.

Sinkronisasi sidebar pada kalimat di atas hanya berlaku antara preview iframe dan editor parent milik **pengguna yang sama**. Event preview milik collaborator tidak boleh diteruskan ke navigation store lokal.

### 6.4 Pemisahan event agar focus tidak terkunci

Gunakan namespace event yang tegas:

```text
document.*        -> boleh mengubah shared document
presence.*        -> hanya memperbarui overlay/avatar
localNavigation.* -> tidak pernah dikirim ke jaringan
```

Contoh event awareness:

```ts
type AwarenessEvent = {
  userId: string;
  sectionId: string | null;
  fieldPath: string | null;
  cursor: { surface: string; x: number; y: number } | null;
};
```

Handler remote hanya boleh menulis ke `remotePresenceStore`. Store tersebut tidak memiliki akses ke fungsi `setSelectedSection`, `changeView`, `scrollToSection`, `focus`, atau router. Pembatasan dependency ini mencegah bug focus/scroll terkunci secara struktural, bukan sekadar melalui kondisi UI.

## 7. Perubahan database dan migration

Semua perubahan dibuat melalui Drizzle migration resmi; hentikan ketergantungan pada `scripts/migrate-collaborators.js` setelah migration setara tersedia.

### 7.1 `invitation_collaborators`

- ganti `invite_token` menjadi `invite_token_hash CHAR(64)`;
- status: `pending`, `accepted`, `declined`, `expired`, `revoked`;
- tambah `expires_at`, `accepted_at`, `declined_at`, `revoked_at`;
- tambah `last_seen_at` untuk informasi non-realtime opsional;
- pertahankan unique `(invitation_id, email)`;
- index `(user_id, status)` dan `(invitation_id, status)`;
- jangan pernah mengirim hash/token dari API daftar.

### 7.2 `invitations`

- tambah `content_revision BIGINT NOT NULL DEFAULT 0`;
- tambah `collaboration_schema_version INT NOT NULL DEFAULT 1`;
- opsional tambah `last_compacted_at`.

### 7.3 `invitation_collaboration_snapshots`

Kolom minimum:

- `invitation_id`;
- `revision`;
- `schema_version`;
- `snapshot` sebagai binary/blob atau format terkompresi yang didukung adapter;
- `created_by` nullable untuk flush sistem;
- `created_at`.

Unique `(invitation_id, revision)`. Retensi menyimpan beberapa revision terakhir untuk recovery, bukan seluruh riwayat selamanya.

### 7.4 `invitation_activity_logs`

Audit event: invited, accepted, role_changed, revoked, section_added, section_removed, published. Simpan metadata ringkas, bukan seluruh isi dokumen atau cursor.

### 7.5 `email_outbox`

Menjamin invite tidak hilang bila provider email gagal. Kolom: type, recipient, payload, status, attempts, next_attempt_at, sent_at, last_error.

## 8. API target

```text
GET    /api/drafts/:draftId/collaborators
POST   /api/drafts/:draftId/collaborators
PATCH  /api/drafts/:draftId/collaborators/:membershipId
DELETE /api/drafts/:draftId/collaborators/:membershipId
POST   /api/drafts/:draftId/collaborators/:membershipId/resend

GET    /api/collaboration/invitations
POST   /api/collaboration/invitations/:token/accept
POST   /api/collaboration/invitations/:token/decline

POST   /api/drafts/:draftId/collaboration/token
GET    /api/drafts/:draftId/collaboration/snapshot
POST   /api/drafts/:draftId/collaboration/flush
```

Ketentuan:

- credential realtime berumur pendek, terikat pada `draftId`, `userId`, dan role;
- jangan menerima role/capability dari client sebagai sumber kebenaran;
- mutation menerima idempotency key;
- endpoint list membedakan owned, shared, dan pending;
- update role dan revoke segera dipublikasikan ke room.

## 9. Struktur folder modular

```text
src/modules/collaboration/
├── domain/
│   ├── capabilities.ts
│   ├── events.ts
│   ├── presence.ts
│   ├── roles.ts
│   └── shared-document.ts
├── server/
│   ├── access-service.ts
│   ├── invitation-service.ts
│   ├── membership-repository.ts
│   ├── realtime-auth-service.ts
│   ├── snapshot-repository.ts
│   └── activity-repository.ts
├── client/
│   ├── CollaborationProvider.tsx
│   ├── useCollaboration.ts
│   ├── useCollaborators.ts
│   ├── usePresence.ts
│   ├── useRemoteCursors.ts
│   └── useSharedInvitation.ts
└── adapters/
    ├── realtime/
    │   ├── contract.ts
    │   └── provider-adapter.ts
    ├── email/
    │   ├── contract.ts
    │   └── provider-adapter.ts
    └── persistence/
        └── mysql-yjs-store.ts

src/builder/editor/collaboration/
├── CollaboratorAvatarStack.tsx
├── CollaborationPopover.tsx
├── CollaborationStatus.tsx
├── RemoteCursorLayer.tsx
├── SelectionPresence.tsx
└── PreviewCollaborationBridge.tsx

app/collaboration/invite/[token]/page.tsx
app/api/collaboration/invitations/route.ts
app/api/collaboration/invitations/[token]/accept/route.ts
app/api/collaboration/invitations/[token]/decline/route.ts
app/api/drafts/[draftId]/collaboration/token/route.ts
app/api/drafts/[draftId]/collaboration/snapshot/route.ts
app/api/drafts/[draftId]/collaboration/flush/route.ts
```

Template tidak boleh mengimpor provider realtime. Template hanya menerima shared editor state melalui kontrak renderer yang sudah ada.

## 10. Integrasi ke editor saat ini

1. Pecah state besar `ConsoleWorkspace` menjadi editor shell, invitation store, navigation store, dan collaboration provider.
2. Hydrate `Y.Doc` dari snapshot server setelah draft dan role tervalidasi.
3. Ganti setter lokal langsung dengan command generik, misalnya `updateSectionField(sectionId, fieldPath, value)`.
4. Command menulis ke Yjs transaction dengan origin `local-user`.
5. Observer Yjs menghasilkan state immutable yang dikonsumsi preview dan right sidebar.
6. Drag-and-drop menulis hanya `sectionOrder`, bukan mengirim seluruh dokumen.
7. Editor role `viewer` menggunakan provider yang sama dalam mode read-only.
8. `useAutoSave` lama tetap dipakai untuk mode anonim/local-first saja.
9. Untuk draft login, autosave client diganti status sinkronisasi: `connecting`, `synced`, `saving`, `offline`, `error`.
10. Ketika offline, Yjs menyimpan update lokal (IndexedDB) lalu melakukan merge saat reconnect.

## 11. UX yang ditargetkan

- Navbar menampilkan avatar aktif tanpa menggeser tombol Publish.
- Label cursor memuat nama singkat dan warna unik.
- Field yang sedang difokuskan orang lain memiliki outline lembut dan nama editor.
- Outline dan remote cursor bersifat informatif, tidak mengunci field dan tidak menangkap pointer.
- Scroll, focus, section aktif, zoom, device preview, dan navigasi setiap user selalu independen.
- Perubahan navigasi collaborator tidak pernah menggerakkan preview atau window pengguna saat ini.
- Jika dua user mengedit text yang sama, perubahan merge pada level text, bukan satu field saling menimpa.
- Jika dua user mengurutkan section bersamaan, urutan CRDT tetap deterministik.
- Status koneksi terlihat jelas: “Terhubung”, “Menyambungkan ulang…”, atau “Offline—perubahan akan disinkronkan”.
- Viewer melihat banner read-only dan semua input/action mutation disabled.
- Pending invite tampil terpisah dari anggota aktif.
- Daftar akun memiliki tab **Milik saya**, **Dibagikan kepada saya**, dan **Undangan masuk**.

## 12. Security dan reliability

- Hash invite token dengan SHA-256/HMAC dan bandingkan secara constant-time.
- Token sekali pakai, memiliki expiry, dan dirotasi saat resend.
- Validasi session dan membership pada handshake serta refresh credential realtime.
- Gunakan channel/room opaque berdasarkan UUID draft; jangan memakai slug publik.
- Rate limit invite, resend email, token realtime, dan cursor events.
- Batasi payload presence dan panjang nama/field path.
- Sanitize seluruh template data tetap dilakukan pada boundary schema.
- Jangan broadcast URL asset privat sebelum permission tervalidasi.
- Revoke session room secepat mungkin setelah membership berubah.
- Tambahkan retry/backoff, heartbeat, reconnect, dan idempotent persistence.
- Publish harus gagal aman jika final room flush tidak berhasil.
- Log error provider tanpa token, email penuh, atau isi undangan sensitif.

## 13. Strategi test

### Unit

- capability matrix seluruh role;
- state transition invitation;
- email normalization dan token hashing;
- mapping Template Kit JSON ke/dari Yjs;
- cursor coordinate normalization;
- deduplikasi multi-tab presence.

### Integration/API

- owner dapat invite/update/revoke;
- editor tidak dapat publish/manage member/delete draft;
- viewer tidak dapat menulis dari API walaupun memalsukan UI;
- email akun yang berbeda tidak dapat menerima token;
- revoked/expired token ditolak;
- realtime token ditolak setelah membership dicabut;
- snapshot revision meningkat secara atomik.

### End-to-end dua browser context

1. Owner mengundang editor.
2. Editor menerima undangan dan draft muncul di daftar.
3. Kedua browser membuka editor yang sama.
4. Avatar keduanya muncul.
5. Cursor dan section aktif terlihat silang.
6. Edit text bersamaan ter-merge.
7. Tambah/urut/hapus section tersinkron realtime.
8. Refresh salah satu browser tidak kehilangan data.
9. Simulasikan offline, edit, reconnect, lalu pastikan merge.
10. Owner mencabut akses dan browser editor langsung keluar dari room.
11. Viewer dapat mengikuti preview tetapi seluruh mutation ditolak.

### Regression

- local-first anonim tetap bekerja;
- editor single-user tidak mengalami penurunan respons;
- navigasi preview iframe tidak mengubah scroll window utama;
- upload/crop image dan music tetap konsisten;
- publish path, subdomain, dan custom domain tetap bekerja.

## 14. Observability

Pantau:

- active rooms dan connections per room;
- latency broadcast p50/p95;
- reconnect rate;
- snapshot flush duration/failure;
- ukuran Yjs document dan hasil compact;
- invite delivery/acceptance rate;
- authorization rejection;
- room yang tidak berhasil final flush.

Tambahkan correlation ID untuk API request, room connection, dan persistence flush agar masalah satu draft dapat ditelusuri tanpa melihat isi undangan.

## 15. Tahapan implementasi

### Fase 0 — Stabilkan fondasi

- [ ] Masukkan schema collaborator ke migration Drizzle resmi.
- [ ] Perbaiki dan build-verifikasi query daftar owned/shared draft.
- [ ] Buat capability guard terpusat dan audit semua mutation endpoint.
- [ ] Tambahkan test role `owner/editor/viewer/anonymous`.
- [ ] Pecah kontrak collaboration dari `ConsoleWorkspace` tanpa mengubah UI.

Kriteria selesai: tidak ada role yang dapat menjalankan aksi di luar matriks permission dan build/lint/test bersih.

### Fase 1 — Invitation yang aman

- [ ] Migration lifecycle status, hashed token, expiry, dan activity log.
- [ ] Halaman accept/decline setelah login.
- [ ] Tab Undangan masuk dan Dibagikan kepada saya.
- [ ] Update role, revoke, resend, dan email outbox.
- [ ] Hapus token dari response daftar dan hentikan auto-accept.

Kriteria selesai: undangan hanya diterima secara eksplisit oleh akun dengan email yang tepat.

### Fase 2 — Presence dan avatar navbar

- [ ] Pilih dan implementasikan realtime adapter.
- [ ] Endpoint short-lived realtime credential.
- [ ] Presence heartbeat, reconnect, idle, multi-tab dedupe.
- [ ] Avatar stack, popover anggota, status koneksi.
- [ ] Revoke event memutus user aktif.

Kriteria selesai: dua browser menampilkan status online/offline yang benar tanpa reload.

### Fase 3 — Cursor dan selection awareness

- [ ] Cursor layer untuk canvas dan sidebar.
- [ ] Preview iframe bridge dengan origin validation.
- [ ] Field focus, selected section, dan viewport presence.
- [ ] Throttling, interpolation, cleanup, mobile behavior.

Kriteria selesai: cursor tidak memengaruhi layout/scroll, tidak menangkap klik, dan posisi tetap benar pada zoom/resize preview.

### Fase 4 — Shared document CRDT

- [ ] Mapper JSON Template Kit ↔ Yjs.
- [ ] Shared global settings, section data, dan section order.
- [ ] IndexedDB offline buffer dan reconnect merge.
- [ ] MySQL snapshot persistence, revision, compact, final flush.
- [ ] Ganti autosave login menjadi sync status.
- [ ] Publish barrier menunggu snapshot terbaru.

Kriteria selesai: dua editor dapat mengubah field dan urutan section bersamaan tanpa kehilangan update.

### Fase 5 — Hardening dan rollout

- [ ] E2E multi-browser dan load test room.
- [ ] Rate limiting, metrics, retry, dan recovery revision.
- [ ] Feature flag per template/draft.
- [ ] Canary internal lalu pengguna terbatas.
- [ ] Dokumentasi operasional realtime gateway/provider.

Kriteria selesai: dapat diaktifkan bertahap dan dapat dimatikan tanpa merusak snapshot draft.

## 16. Definition of Done

Feature collaboration dianggap selesai bila:

- invite benar-benar terkirim dan harus diterima oleh email yang dituju;
- owned/shared/pending invitation tampil konsisten di akun pengguna;
- owner, editor, dan viewer selalu mengikuti capability matrix di client dan server;
- avatar online/idle/offline akurat;
- cursor dan field selection muncul halus tanpa mengganggu klik atau scroll;
- perubahan dua editor merge tanpa last-write-wins pada full snapshot;
- reconnect/offline tidak menghilangkan perubahan;
- publish selalu memakai revision terkini;
- akses yang dicabut berhenti secara realtime;
- implementasi tidak memiliki ketergantungan pada schema section wedding;
- migration, unit test, API test, E2E dua browser, lint, dan production build lulus.

## 17. Urutan prioritas yang direkomendasikan

Jangan mulai dari cursor. Urutan aman adalah:

```text
permission + migration
  -> invitation acceptance
  -> realtime presence
  -> avatar/cursor
  -> Yjs shared document
  -> offline/recovery
  -> hardening dan rollout
```

Cursor tanpa shared document hanya memberikan kesan realtime, sementara autosave lama masih dapat menghilangkan perubahan pengguna lain. Karena itu, fitur visual boleh dibuat setelah presence, tetapi baru dinyatakan siap produksi setelah CRDT dan persistence revision selesai.
