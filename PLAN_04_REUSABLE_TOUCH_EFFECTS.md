# Plan 04 — Reusable Touch Scroll Effects untuk Template

## Tujuan

Membuat komponen efek sentuhan reusable untuk mobile/coarse pointer. Efek muncul dari koordinat jari saat gesture scroll vertikal, menyebar, lalu memudar tanpa menghalangi scroll, tombol, atau swipe gallery.

Target awal:

- **Eternal Orbit:** bintang/stardust atau kristal salju kosmik.
- **Verdant Vows:** daun hijau kecil.
- **Avant Vows:** serpihan editorial/kelopak monokrom dengan aksen warna template.

Komponen harus mudah dipakai template berikutnya tanpa menyalin event listener dan lifecycle.

## Referensi Perilaku

Implementasi pembanding berada di project `D:\Development\App\wedding\components\touch-flower-trail.tsx`, tetapi jangan copy mentah. Undangan Console memakai scroll root terisolasi `[data-template-scroll-root]`, bukan selalu `window`.

## Keputusan Arsitektur

- Buat satu komponen `TouchParticleTrail` dan satu hook `useTouchParticleTrail`.
- Komponen menerima preset/config, bukan mengetahui nama template.
- Event listener dipasang pada scroll root template melalui `rootRef` atau selector yang diberikan.
- Satu gesture scroll menghasilkan satu burst dari satu titik sumber; scroll naik dan turun sama-sama aktif.
- Gesture horizontal dominan tidak memicu partikel agar swipe gallery aman.
- Layer effect memakai `pointer-events: none` dan berada dalam container template agar tidak bocor ke editor lain.
- Efek hanya aktif pada `(pointer: coarse)` dan nonaktif pada `prefers-reduced-motion: reduce`.

## API Komponen yang Disarankan

```ts
type TouchParticlePreset = "stardust" | "snow" | "leaves" | "editorial";

type TouchParticleConfig = {
  preset: TouchParticlePreset;
  particlesPerBurst?: number;
  maxParticles?: number;
  durationMs?: number;
  fadeDelayMs?: number;
  minVerticalDistance?: number;
  colors?: string[];
  symbols?: string[];
  disabled?: boolean;
};
```

Default awal yang aman: 8–12 partikel per burst, maksimal 96–128 node, durasi 2.8–3.8 detik, satu burst per gesture.

## Target File

- `src/components/effects/TouchParticleTrail.tsx` — layer dan lifecycle partikel.
- `src/components/effects/useTouchParticleTrail.ts` — gesture detection reusable bila diperlukan terpisah.
- `src/components/effects/touch-particle-trail.css` — keyframes namespaced.
- `src/components/effects/presets.ts` — preset visual dan batas performa.
- `src/templates/wedding-eternal-orbit/source/EternalOrbitSource.tsx` — mount preset orbit.
- `src/templates/wedding-verdant-vows/source/VerdantVowsSource.tsx` — mount preset leaves.
- `src/templates/wedding-avant-vows/source/AvantVowsSource.tsx` — mount preset editorial setelah perubahan template aktif selesai.
- CSS template terkait hanya untuk variable warna bila dibutuhkan; event logic tidak boleh disalin.

## Checklist Implementasi

### Core Component

- [ ] Terima `rootRef`/root element dan config preset.
- [ ] Dengarkan `touchstart`, `touchmove`, `touchend`, dan `touchcancel` secara passive.
- [ ] Simpan titik awal gesture dan emit sekali ketika jarak vertikal melewati threshold.
- [ ] Aktif untuk finger-up dan finger-down.
- [ ] Abaikan gesture horizontal dominan.
- [ ] Ambil koordinat `clientX/clientY` touch aktual sebagai origin.
- [ ] Gunakan layer fixed/absolute yang sesuai dengan scroll container.
- [ ] Hapus node pada `animationend` dan cleanup seluruh listener saat unmount.
- [ ] Batasi jumlah partikel aktif untuk mencegah memory/performance leak.
- [ ] Jangan menggunakan React state per frame/touchmove; gunakan ref/DOM terkontrol atau pool ringan.
- [ ] Pastikan tidak ada duplicate listener saat preview state di-apply ulang.

### Preset Visual

- [ ] `stardust`: simbol bintang kecil, glow emas/biru, drift radial.
- [ ] Opsional `snow`: kristal putih/biru dengan rotasi lambat; pilih satu default Eternal Orbit.
- [ ] `leaves`: bentuk daun hijau 2–3 tone, drift melengkung, rotasi organik.
- [ ] `editorial`: serpihan/asterisk/kelopak geometris hitam, ivory, dan accent template.
- [ ] Semua partikel berangkat dari titik yang sama lalu mendapat drift random individual.
- [ ] Warna dapat mengambil CSS custom properties template.
- [ ] Efek tetap terbaca pada background terang dan gelap.

### Integrasi Template

- [ ] Mount pada root `EternalOrbitSource` yang memiliki `data-template-scroll-root`.
- [ ] Mount pada root `VerdantVowsSource`.
- [ ] Mount pada root `AvantVowsSource` tanpa mengganggu perubahan template yang belum committed.
- [ ] Efek hanya berjalan setelah opening invitation dibuka bila cover bersifat modal.
- [ ] Efek berjalan pada demo, editor preview touch device, dan halaman publish.
- [ ] Efek tidak berjalan pada server render dan tidak menyebabkan hydration mismatch.
- [ ] Tidak perlu perubahan pada `runtime-registry.ts` jika komponen dipasang di source template.

### Interaksi dan Performa

- [ ] Swipe lightbox next/previous tidak memicu burst.
- [ ] Tap tombol, input RSVP, slider, dan drag editor tidak memicu burst.
- [ ] Scroll tetap native; tidak memanggil `preventDefault`.
- [ ] Layer selalu `pointer-events: none`.
- [ ] Uji perangkat low-end dengan burst maksimum.
- [ ] Hentikan efek ketika tab browser hidden bila diperlukan.
- [ ] Hormati reduced motion dan coarse pointer.

### Validasi

- [ ] Uji satu gesture = satu origin point.
- [ ] Uji scroll naik dan turun.
- [ ] Uji multi-touch tidak menggandakan origin; gunakan primary touch saja.
- [ ] Uji cleanup setelah navigasi antar template/preview reload.
- [ ] Uji iOS Safari dan Android Chrome.
- [ ] Jalankan `npm run lint` dan `npm run build`.

## Pembagian Multi-Agent

- **Agent Effects Core:** komponen, hook, CSS, performance cap.
- **Agent Orbit:** preset dan integrasi Eternal Orbit saja.
- **Agent Verdant:** preset dan integrasi Verdant Vows saja.
- **Agent Avant:** integrasi setelah owner perubahan Avant selesai; jangan mengedit registry/manifest yang sedang modified.
- **Agent QA Mobile:** swipe conflict, reduced motion, iOS/Android, memory profile.

## Acceptance Criteria

- Ketiga template memiliki efek visual berbeda yang berasal tepat dari titik sentuh.
- Komponen inti tidak diduplikasi di folder template.
- Scroll dan swipe gallery tetap responsif.
- Efek otomatis nonaktif pada desktop pointer biasa dan reduced motion.

