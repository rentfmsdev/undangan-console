## Standard Registrasi Template (`templates.json`)

Untuk mendaftarkan template baru di marketplace / landing page, cukup tambahkan objek baru ke dalam array `src/templates/templates.json`:

```json
[
  {
    "id": "wedding-elegance",
    "code": "hjydg",
    "name": "Wedding Elegance",
    "category": "pernikahan",
    "categoryLabel": "Pernikahan",
    "description": "Template pernikahan 2 culture dengan opening envelope, aksen emas mewah, dan audio player.",
    "price": 50000,
    "rating": 4.9,
    "favoriteCount": 248,
    "releaseDate": "2026-08-30",
    "status": "available",
    "covers": [
      "/thumb/wedding-elegance.png"
    ],
    "themeColors": [
      "#1e40af",
      "#5b232d",
      "#78613b",
      "#4d665b"
    ],
    "features": [
      "Opening Envelope",
      "Hero Header",
      "Mempelai",
      "Rangkaian Acara",
      "Galeri Foto Lightbox"
    ],
    "tags": ["wedding", "pernikahan", "adat", "2 culture", "envelope", "gold"]
  }
]
```

### Properti Objek JSON:
- `id`: Unique identifier template (string).
- `code`: Kode unik 5 karakter untuk rute editor / builder (misal: `"hjydg"`).
- `name`: Nama tampilan template.
- `category`: Kategori internal (`"pernikahan" | "khitanan" | "aqiqah" | "ulang-tahun" | "wisuda"`).
- `categoryLabel`: Label kategori untuk UI (misal: `"Pernikahan"`).
- `description`: Ringkasan fitur & deskripsi template.
- `price`: Harga template dalam Rupiah (angka integer, misal: `50000`).
- `rating`: Nilai rating (0.0 - 5.0).
- `favoriteCount`: Jumlah suka / bookmark awal.
- `releaseDate`: Tanggal rilis format ISO `YYYY-MM-DD`.
- `status`: `"available"` (siap pakai) atau `"coming-soon"` (segera hadir).
- `covers`: **Array daftar gambar cover / mockup** (string array). Mendukung multi-cover sehingga kartu template dapat di-slide di landing page.
- `themeColors`: Array hex color swatch tema yang tersedia.
- `features`: Array nama fitur / section yang ada di dalam template.
- `tags`: Tag kata kunci pencarian.

---

## Checklist Implementasi Template Engine (Full Builder)

1. Daftarkan metadata ke `src/templates/templates.json`.
2. Buat manifest melalui `defineTemplate(...)` di `src/templates/<template-id>/manifest.ts`.
3. Sediakan elemen `data-template-scroll-root` dan `data-template-section="<section-type>"`.
4. Implementasikan `TemplateNavigationAdapter` & bridge `applyState/watchState`.
5. Daftarkan renderer dan adapter di `runtime-registry.ts`.
6. Ekspor manifest di `registry.ts`.

## Protokol navigasi

- Editor mengirim `navigate-section` dengan `requestId` dan `navigationSource`.
- Runtime mengirim `navigation-start`, `active-section`, lalu `navigation-complete`.
- Wheel/touch pengguna membatalkan animasi dan mengirim `navigation-cancelled`.
- `active-section` hanya mengubah selection editor. Event ini tidak boleh mengirim navigasi balik.

Gunakan `?debugNavigation=1` pada URL preview untuk melihat active section, status, scroll top, dan request ID.

## Pengujian wajib

- Klik seluruh section sidebar dan pastikan target berada di atas scroll root.
- Klik seluruh bottom navigation dan pastikan parent `window.scrollY` tetap `0`.
- Lakukan wheel/touch ketika smooth navigation berlangsung dan pastikan animasi batal tanpa loader terkunci.
- Uji opening section, section tersembunyi, reorder, Android frame, iOS frame, reload draft, dan halaman published.
