# Menjalankan Undangan Console dengan Docker Compose

Stack Compose berisi:

- `gateway`: Caddy pada port publik, termasuk proxy upgrade WebSocket.
- `web`: aplikasi Next.js.
- `collab`: server WebSocket/Yjs.
- `mysql`: database persisten.
- `redis`: pub/sub kolaborasi persisten.
- `migrate`: job sekali jalan yang menjalankan migrasi sebelum aplikasi start.

## Menjalankan secara lokal

Salin template environment bila `.env` belum tersedia:

```bash
cp .env.example .env
```

Seluruh konfigurasi aplikasi, MySQL, Redis, dan WebSocket berada dalam satu file
`.env`. Ganti password database di dalamnya sebelum menyimpan data produksi.
Kemudian jalankan seluruh stack:

```bash
docker compose up -d --build
```

Buka `http://localhost:3000`. Untuk penggunaan lokal, WebSocket tersedia pada
`ws://localhost:3001`. Container Caddy tetap menyediakan endpoint
`/collaboration-ws` untuk konfigurasi WSS produksi.

Jika sebelumnya menjalankan `npm run dev` dan `npm run dev:collab`, hentikan
keduanya terlebih dahulu agar port `3000` dan `3001` dapat digunakan Compose.

## Perintah operasional

```bash
# Status dan health
docker compose ps

# Semua log
docker compose logs -f

# Log WebSocket saja
docker compose logs -f collab

# Build/restart setelah kode berubah
docker compose up -d --build

# Jalankan ulang migrasi secara manual
docker compose run --rm migrate

# Stop tanpa menghapus data
docker compose down
```

Jangan gunakan `docker compose down -v` kecuali memang ingin menghapus database,
upload, data ucapan, dan data Redis.

## Domain produksi

Jika TLS ditangani reverse proxy host atau load balancer, arahkan proxy tersebut
ke port `APP_PORT`, lalu ubah nilai berikut sebelum build:

```dotenv
NEXT_PUBLIC_APP_URL=https://console.undangan.co
COLLAB_ALLOWED_ORIGIN=https://console.undangan.co
NEXT_PUBLIC_COLLAB_WS_URL=wss://console.undangan.co/collaboration-ws
```

Setelah mengubah `NEXT_PUBLIC_APP_URL` atau `NEXT_PUBLIC_COLLAB_WS_URL`, image
wajib dibangun ulang karena variabel `NEXT_PUBLIC_*` ditanam ke bundle browser
saat build.

## Retensi publikasi

Masa tayang path dan subdomain diatur dalam `.env`:

```dotenv
PUBLISH_RETENTION_DAYS=30
PUBLISH_RETENTION_SWEEP_MINUTES=60
```

Server kolaborasi memeriksa publikasi kedaluwarsa saat start dan setiap interval
tersebut. Publikasi kedaluwarsa diubah menjadi `archived`, lalu `slug` dan
`subdomain` dilepas agar dapat digunakan pengguna lain. Draft, section, daftar
tamu, ucapan, data kolaborasi, serta file dalam volume `uploads` tidak dihapus.
