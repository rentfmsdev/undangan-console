# Panduan Deployment & Produksi (PM2 & Reverse Proxy)

Dokumen ini menjelaskan langkah-langkah lengkap men-deploy aplikasi **Undangan Studio / Undangan Console** beserta **Collab Server (WebSocket + Yjs CRDT)** ke server produksi (Ubuntu / Debian VPS).

---

## 1. Arsitektur Produksi

```text
[ Browser Klien ]
       │ (HTTPS / WSS)
       ▼
[ Reverse Proxy: Nginx / Caddy ] (Port 80 / 443 dengan SSL)
       ├─► /collaboration-ws ──► [ Collab Server (Yjs CRDT) ] (127.0.0.1:3001)
       └─► /*                ──► [ Next.js Web App ]          (127.0.0.1:3000)
                                        │
                                        ▼
                                [ MySQL Database ]
```

- **Next.js Web App**: Menangani UI, Server Components, API routes, dan autentikasi.
- **Collab Daemon (`server/collab-server.mjs`)**: Server WebSocket stateful yang memelihara room Yjs dokumen, presence kursor, dan men-flush snapshot perubahan ke MySQL secara ter-debounce.
- **PM2**: Manajer proses yang memastikan kedua service otomatis restart jika terjadi crash, membatasi konsumsi memori, dan mengaktifkan auto-start saat VPS di-reboot.

---

## 2. Persiapan Server (Prerequisites)

Pastikan server Anda memiliki:
1. **Node.js 20+** dan **npm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. **PM2 Global**:
   ```bash
   sudo npm install -g pm2
   ```
3. **Nginx** & **Certbot** (untuk SSL):
   ```bash
   sudo apt-get update
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```
4. **MySQL / MariaDB**:
   ```bash
   sudo apt-get install -y mysql-server
   ```

---

## 3. Konfigurasi Database & Environment

### A. Buat Database MySQL
```sql
CREATE DATABASE undangan_console CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Jalankan migrasi schema:
```bash
npm run db:migrate
```

### B. Siapkan File `.env` Produksi
Salin template konfigurasi:
```bash
cp .env.example .env
```
Sesuaikan nilai variabel berikut untuk domain Anda:

```ini
# Database
DATABASE_URL="mysql://username:password@127.0.0.1:3306/undangan_console"

# Domain Utama
ROOT_DOMAIN="undangan.co"
NEXT_PUBLIC_ADMIN_WHATSAPP="6285769306099"
EDIT_TOKEN_SECRET="buat-string-acak-panjang-minimal-32-karakter-di-sini"

# Google Auth OAuth (Daftarkan domain produksi di Google Cloud Console)
GOOGLE_CLIENT_ID="xxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxx"
GOOGLE_REDIRECT_URI="https://console.undangan.co/api/auth/google/callback"

# Realtime Collaboration (Wajib WSS di produksi)
COLLAB_PORT="3001"
COLLAB_ALLOWED_ORIGIN="https://console.undangan.co"
NEXT_PUBLIC_COLLAB_WS_URL="wss://console.undangan.co/collaboration-ws"
```

---

## 4. Build Aplikasi Next.js

Jalankan instalasi dependensi bersih dan compile bundle produksi:

```bash
npm ci --omit=dev
npm run build
```

---

## 5. Menjalankan Service dengan PM2

Aplikasi sudah dilengkapi file konfigurasi PM2 siap pakai: [`ecosystem.config.cjs`](file:///d:/Development/App/undangan-console/ecosystem.config.cjs).

### A. Buat Folder Log
```bash
mkdir -p logs
```

### B. Start Semua Service
```bash
pm2 start ecosystem.config.cjs
```

Periksa status service:
```bash
pm2 status
```
Output yang diharapkan:
```text
┌────┬─────────────────┬──────────┬──────┬──────────┬──────────┬──────────┐
│ id │ name            │ mode     │ ↺    │ status   │ cpu      │ memory   │
├────┼─────────────────┼──────────┼──────┼──────────┼──────────┼──────────┤
│ 0  │ undangan-web    │ fork     │ 0    │ online   │ 0%       │ ~90 MB   │
│ 1  │ undangan-collab │ fork     │ 0    │ online   │ 0%       │ ~45 MB   │
└────┴─────────────────┴──────────┴──────┴──────────┴──────────┴──────────┘
```

### C. Aktifkan Auto-Start Saat VPS Reboot
```bash
pm2 save
pm2 startup
# Jalankan perintah sudo env PATH=... yang dimunculkan oleh terminal
```

### D. Perintah Maintenance PM2 yang Berguna
- **Melihat Live Logs**: `pm2 logs` atau `pm2 logs undangan-collab`
- **Zero-Downtime Reload**: `pm2 reload ecosystem.config.cjs`
- **Restart**: `pm2 restart ecosystem.config.cjs`
- **Dashboard Monitoring**: `pm2 monit`

> **PENTING (Zero Data Loss)**: `server/collab-server.mjs` telah dilengkapi graceful shutdown handler (`SIGTERM`/`SIGINT`). Saat PM2 melakukan reload atau stop, server akan men-flush seluruh snapshot Yjs aktif ke MySQL terlebih dahulu sebelum proses dihentikan.

---

## 6. Konfigurasi Reverse Proxy (Nginx)

Salin template konfigurasi Nginx yang telah disediakan:
```bash
sudo cp deploy/nginx/undangan.conf /etc/nginx/sites-available/console.undangan.co.conf
```

Sesuaikan `server_name` dengan nama domain Anda:
```bash
sudo nano /etc/nginx/sites-available/console.undangan.co.conf
```

Aktifkan konfigurasi:
```bash
sudo ln -s /etc/nginx/sites-available/console.undangan.co.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Pasang Sertifikat SSL (HTTPS & WSS)
Gunakan Certbot untuk mengamankan domain secara gratis:
```bash
sudo certbot --nginx -d console.undangan.co
```
Certbot akan otomatis memperbarui konfigurasi SSL di Nginx.

---

## 7. Checklist Verifikasi Pasca-Deployment

| Pengujian | Langkah Pengujian | Status Diharapkan |
| :--- | :--- | :--- |
| **HTTPS Web App** | Buka `https://console.undangan.co` di browser | Halaman beranda terbuka cepat dengan ikon gembok SSL valid |
| **Google Login** | Login dengan akun Google | Sesi tersimpan, cookie `undangan_session` terpasang dengan atribut `HttpOnly; Secure` |
| **Koneksi WebSocket (WSS)** | Buka editor undangan, periksa DevTools Network tab filter `WS` | Terkoneksi ke `wss://console.undangan.co/collaboration-ws?draftId=...` status `101 Switching Protocols` |
| **Multi-Klien Sync** | Buka editor di dua window/browser berbeda | Avatar online muncul di navbar, live cursor bergerak, teks ter-sync tanpa reload |
| **Upload Foto Kompresi** | Unggah foto kamera HP (ukuran 5–10MB) | Foto terunggah instan (< 1 detik) dalam format WebP terkompresi |
| **Graceful Restart** | Jalankan `pm2 reload undangan-collab` saat sedang mengedit | Status tersimpan di MySQL tanpa kehilangan data, klien otomatis reconnect dalam 2 detik |
