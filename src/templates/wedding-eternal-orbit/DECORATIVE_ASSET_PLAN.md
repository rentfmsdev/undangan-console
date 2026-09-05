# Eternal Orbit — Decorative Asset & Motion Plan

## Tujuan kualitas

Eternal Orbit harus terasa seperti undangan premium sinematik, bukan kumpulan section dengan ornamen yang sama. Setiap section memiliki identitas dekoratif sendiri, tetapi tetap berada dalam satu bahasa visual: orbit, cahaya, lembaran, debu bintang, dan garis konstelasi.

Semua dekorasi wajib:

- mengikuti token preset (`primary`, `accent`, `text`, `dark`, `rich`, `mid`, `cream`, `border`, `muted`);
- tidak membawa warna permanen yang hanya cocok untuk satu preset;
- memakai `pointer-events: none` dan tidak menutupi field, tombol, foto, atau navigasi;
- berhenti ketika section keluar viewport dan dinonaktifkan pada `prefers-reduced-motion`;
- ikut hilang ketika section di-hide dan tetap benar setelah section diurutkan ulang;
- tidak memakai foto contoh; media pengguna tetap melalui Asset Manager;
- menjaga kontras teks minimal WCAG AA dan menyediakan zona tenang di belakang teks.

## Fondasi kustomisasi editor

Schema field saat ini belum memiliki control dekoratif. Sebelum memasang seluruh variasi, editor perlu mendukung tiga control JSON-primitif berikut:

| Control | Data | Kegunaan |
| --- | --- | --- |
| `select` | `decorationVariant: string` | Memilih gaya ornamen section. |
| `toggle` | `showParticles: boolean` | Menampilkan atau menyembunyikan partikel. |
| `range` | `decorationIntensity: number` | Intensitas 0–100; memengaruhi opacity dan jumlah partikel, bukan keterbacaan. |

Setiap section juga memiliki `motionStyle: "soft" | "cinematic" | "off"`. Default adalah `cinematic`, sedangkan perangkat dengan reduced motion selalu diperlakukan sebagai `off` tanpa mengubah data draft.

Seluruh nilai disimpan di `section.data`, dinormalisasi untuk draft lama, dan diterapkan idempoten oleh bridge. Jika editor core belum diperluas, renderer memakai default manifest sehingga template tetap aman dan lengkap.

## Sistem aset bersama

Semua SVG baru ditempatkan di `public/assets/wedding/eternal-orbit/` agar tidak bercampur dengan template lain.

| Aset | Fungsi | Cara pewarnaan |
| --- | --- | --- |
| `orbit-spark-field.svg` | Kumpulan kilau kecil yang dapat dipakai ulang. | CSS mask + `background-color: var(--eo-accent)`. |
| `orbit-light-arc.svg` | Busur cahaya untuk transisi antarsecton. | CSS mask + `var(--eo-primary)`. |
| `orbit-prism.svg` | Pecahan kaca/berlian untuk depth foreground. | `currentColor` dan opacity. |
| `orbit-grain.svg` | Grain sangat halus agar bidang tidak terasa datar. | Monokrom; blend mode dan opacity rendah. |
| `orbit-dove-pair.svg` | Dua merpati garis modern untuk hero/closing. | Stroke memakai token. |
| `orbit-leaf-constellation.svg` | Daun yang tersambung sebagai konstelasi. | Stroke `primary` dan titik `accent`. |

Aset yang sudah ada (`eternal-orbit-rings.svg`, `eternal-orbit-stars.svg`, `eternal-orbit-dove.svg`) diaudit ulang dan dipindahkan/diturunkan sebagai aset bersama bila masih dipakai.

## Efek partikel “Celestial Shower”

Efek hujan tidak berupa confetti warna-warni karena akan menurunkan kesan premium. Visualnya menjadi debu cahaya/kelopak salju yang berubah karakter mengikuti preset:

- Midnight Sapphire: bintang champagne tipis.
- Aurora Plum: serpihan rose-gold dan kelopak kecil.
- Pearl Dawn: pearl snow berwarna dusty blue.
- Celestial Teal: titik embun silver-mist.

Implementasi berupa partikel DOM deterministik, bukan library eksternal, canvas, atau WebGL:

- maksimal 14 partikel pada 320px dan 20 pada 390–480px;
- durasi 6–11 detik dengan delay deterministik agar tidak terlihat seragam;
- hanya dianimasikan ketika section aktif;
- berada di layer background/foreground aman dengan `aria-hidden="true"`;
- `decorationIntensity` mengatur jumlah dan opacity maksimum 0.42;
- partikel tidak dibuat ulang pada setiap autosave/preview-state;
- pada reduced motion ditampilkan sebagai beberapa titik statis atau disembunyikan.

## Rencana dekoratif per section

### 1. Opening Envelope — “Celestial Vault”

- Aset: `opening-vault-doors.svg`, `opening-foil-seal.svg`, dan `orbit-light-arc.svg`.
- Tampilan: dua panel pintu bertekstur foil, garis orbit di belakang kartu, dan segel berlapis dengan highlight yang mengikuti preset.
- Motion: panel membuka dalam perspektif 3D, segel maju sedikit, lalu cahaya menyapu menuju hero.
- Variant: `vault`, `folded-letter`, `minimal-orbit`.
- Custom: background section, teks, tema, variant, intensity, dan motion style.
- Guardrail: seluruh tombol berada di atas SVG; dekorasi tidak menerima pointer event.

### 2. Hero — “Orbital Portrait”

- Aset: `hero-celestial-gate.svg`, `orbit-dove-pair.svg`, `orbit-spark-field.svg`.
- Tampilan: frame 3:4 menjadi portal berlapis dengan halo belakang; dua merpati line-art ditempatkan asimetris.
- Motion: frame bergerak dari depth negatif, halo berputar sangat lambat hanya saat hero aktif, merpati membuka sayap tanpa berpindah posisi.
- Variant: `portal`, `eclipse`, `constellation-frame`.
- Custom: foto, background/image, seluruh teks, variant, partikel, intensity, motion.
- Empty state: frame tetap artistik dan jelas bertuliskan slot foto tanpa foto bawaan.

### 3. Mempelai — “Twin Constellations”

- Aset: `couple-twin-arches.svg`, `couple-ribbon-constellation.svg`, `orbit-prism.svg`.
- Tampilan: dua frame 3:4 tetap dua kolom, dihubungkan satu benang konstelasi yang lewat di belakang nama.
- Motion: kedua frame datang dari arah berlawanan dengan parallax berbeda; benang konstelasi tergambar setelah frame berhenti.
- Variant: `twin-arches`, `floating-cards`, `celestial-medallion`.
- Custom: dua foto independen, nama/orang tua, background, text style, variant, intensity, motion.
- Guardrail: nama panjang dan nama orang tua tetap membungkus, dekorasi tidak melewati zona teks.

### 4. Rangkaian Acara — “Astral Invitation Card”

- Aset: `event-astrolabe.svg`, `event-compass-lines.svg`, `orbit-light-arc.svg`.
- Tampilan: card waktu seperti lempeng astrolabe modern; lokasi memiliki garis kompas tipis dan glow fokus.
- Motion: card melakukan tilt 3D pendek ketika masuk, lalu berhenti; light arc menghubungkan tanggal ke lokasi.
- Variant: `astrolabe`, `ticket`, `split-card`.
- Custom: tanggal, jam, lokasi, alamat, Maps, label kalender, background, variant, intensity, motion.
- Guardrail: tombol Maps dan Kalender tetap dua kolom, minimal target sentuh 44px.

### 5. Perjalanan Kami — “Constellation Timeline”

- Aset: `story-thread.svg`, `story-year-orbits.svg`, `orbit-grain.svg`.
- Tampilan: tiga card kertas terang dengan ink gelap, dihubungkan garis cahaya yang bergerak antar-tahun.
- Motion: card dibagikan satu per satu dalam ruang 3D; garis cerita tergambar setelah card aktif.
- Variant: `stacked-cards`, `orbit-path`, `chapter-pages`.
- Custom: seluruh tahun/judul/cerita, background, text style, variant, partikel, intensity, motion.
- Guardrail: setiap kombinasi preset memakai pasangan `paper/ink`; tidak pernah memakai `dark text` di atas `dark surface`.

### 6. Galeri — “Prismatic Memories”

- Aset: `gallery-prism-corners.svg`, `gallery-film-thread.svg`, `orbit-spark-field.svg`.
- Tampilan: frame 3:4 tipis dengan sudut prismatik; susunan dua kolom tetap terasa editorial dan tidak terlalu acak.
- Motion: frame muncul bertahap dari depth berbeda; tap membuka lightbox dengan transisi depth yang singkat.
- Variant: `prismatic-grid`, `film-strip`, `floating-polaroid`.
- Custom: jumlah foto mengikuti `imageUrls`, background, variant, particles, intensity, motion.
- Guardrail: nol foto berarti frame placeholder, sedangkan setelah user menghapus foto tidak boleh ada URL/foto lama.

### 7. Hadiah — “Luminous Token”

- Aset: `gift-luminous-knot.svg`, `gift-qris-corners.svg`, `orbit-prism.svg`.
- Tampilan: rekening berupa plate dengan garis cahaya; QRIS diberi corner frame yang tidak mengurangi area scan.
- Motion: glow fokus satu kali ketika section masuk; tidak ada animasi terus menerus di belakang QRIS.
- Variant: `luminous-plate`, `glass-vault`, `minimal-line`.
- Custom: rekening pertama/kedua, add/hide rekening, show/hide QRIS, gambar QRIS, labels, background, variant, intensity, motion.
- Guardrail: kontras QRIS tidak dimodifikasi; area QR tetap putih dan dapat dipindai.

### 8. Ucapan & RSVP — “Wish Observatory”

- Aset: `wishes-observatory-window.svg`, `wishes-stardust.svg`, `orbit-light-arc.svg`.
- Tampilan: form seperti panel observatorium dengan indikator pilihan RSVP yang jelas; ucapan tampil sebagai kartu bintang kecil.
- Motion: panel masuk dari depth pendek, ucapan baru mendapat highlight satu kali, partikel hanya di luar input.
- Variant: `observatory`, `letter-desk`, `clean-panel`.
- Custom: label, placeholder, pilihan RSVP, tombol, background, text style, variant, particles, intensity, motion.
- Guardrail: input selalu memakai paper/ink contrast dan partikel tidak melintas di atas form.

### 9. Penutup — “Final Constellation”

- Aset: `closing-dove-pair.svg`, `closing-infinity-orbit.svg`, `orbit-spark-field.svg`.
- Tampilan: dua merpati semi-transparan menjadi background, nama berada pada infinity orbit, dan ruang bawah memiliki arc penutup.
- Motion: merpati mengepak tanpa berpindah; garis infinity tergambar lalu glow berhenti; celestial shower turun perlahan di belakang teks.
- Variant: `dove-constellation`, `infinity-orbit`, `quiet-stars`.
- Custom: seluruh teks, background, variant, particles, intensity, motion.
- Guardrail: opacity merpati maksimum 0.16 dan selalu ada scrim agar teks tetap terbaca.

## Layer dan z-index baku

Setiap section memakai struktur yang sama:

1. `decor-back` (`z-index: -2`) — grain, halo, atau pattern.
2. `decor-mid` (`z-index: -1`) — SVG utama/orbit.
3. `content` (`z-index: 1`) — semua teks, foto, form, dan tombol.
4. `decor-front` (`z-index: 2`) — maksimal dua prism/spark kecil, pointer-events none.
5. Navigasi floating (`z-index: 12`) dan modal/lightbox (`z-index: 40`).

Tidak boleh ada dekorasi foreground yang masuk ke bounding box tombol atau menurunkan kontras teks.

## Budget performa

- Total aset SVG template setelah gzip ditargetkan di bawah 45 KB.
- Tidak ada filter SVG berat atau animasi path panjang yang berjalan permanen.
- Maksimal tiga layer dekoratif dan satu animasi utama per section.
- `IntersectionObserver` mengaktifkan class section; satu loop scroll yang ada hanya memperbarui CSS variables.
- Tidak menambahkan dependency animasi eksternal.
- Animasi memakai `transform` dan `opacity`; `filter: blur()` hanya saat transisi singkat.

## Urutan implementasi

1. Tambahkan control `select`, `toggle`, dan `range` ke schema serta inspector editor beserta fallback kompatibel.
2. Tambahkan default dekorasi ke manifest dan normalizer seluruh section.
3. Buat enam aset shared dan aset khusus setiap section sebagai SVG bertoken/mask.
4. Buat komponen `OrbitDecor`, `CelestialShower`, dan layer dekoratif yang reusable.
5. Terapkan opening, hero, couple, event, story, gallery, gift, wishes, dan closing satu per satu.
6. Hubungkan bridge secara idempoten, termasuk perubahan variant/intensity tanpa reset scroll atau audio.
7. Audit keempat preset dan custom colors untuk seluruh kombinasi paper/ink serta dark/text.
8. Uji 320×568, 375×667, 390×844, desktop container/full-width, reduced motion, keyboard, dan target sentuh.
9. Uji hide/show/reorder, draft lama, kolaborasi, Asset Manager, gift modular, Maps, kalender, RSVP, galeri, dan publish.

## Definition of done

- Setiap section memiliki dekorasi yang berbeda dan tetap terasa satu keluarga visual.
- User dapat memilih variant, mematikan motion/partikel, dan mengatur intensitas tanpa kehilangan data.
- Keempat preset mengubah seluruh dekorasi, bukan hanya tombol atau background.
- Semua section masih berguna dan estetis ketika foto belum dipilih.
- Tidak ada teks tertutup, kontras gagal, overflow horizontal, pointer terhalang, atau animasi yang berjalan di section nonaktif.
- Build, TypeScript, dan checklist kontrak template lulus sebelum dianggap selesai.
