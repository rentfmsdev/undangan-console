# Template Contract

Panduan singkat ini adalah kontrak untuk manusia maupun AI agent saat menambah template undangan: pernikahan, khitanan, aqiqah, ulang tahun, wisuda, dan kategori lain.

## Struktur

Setiap template berada di `src/templates/<template-id>/`.

- `manifest.ts` — nama, harga, kategori, section, preset tema, dan data default.
- `source/` — renderer visual, stylesheet, dan bridge untuk menerima state editor.
- `normalize-section-state.ts` — normalisasi data draft lama/default.
- `navigation-adapter.ts` — hubungan klik sidebar, preview, serta bottom navigation.
- asset template — thumbnail dan dekorasi yang memang khusus template.

Daftarkan metadata marketplace di `templates.json`, manifest di `registry.ts`, dan runtime renderer di `runtime-registry.ts`.

## Contract wajib

1. `code` harus unik dan tepat 5 karakter.
2. `category` gunakan kategori yang sesuai. Tambahkan kategori baru di `contracts.ts` dan `schema.ts` bila belum ada.
3. Semua section memiliki `type`, `defaultData`, batas instance, dan field editor yang diperlukan.
4. Renderer harus memiliki `data-template-scroll-root` serta `data-template-section="<type>"`.
5. Semua text/foto/editor value dibaca dari state bridge. Jangan membuat teks atau foto pengguna hard-code di renderer.
6. Semua warna visual harus memakai token tema. Jangan memakai maroon/biru/hijau hard-code untuk background, overlay, button, card, atau navbar.

## Theme token wajib

Setiap preset di manifest harus memiliki semua token berikut:

`background`, `surface`, `primary`, `accent`, `text`, `dark`, `rich`, `mid`, `cream`, `border`, `muted`.

Makna ringkas:

- `primary`, `accent`: warna identitas dan aksen.
- `background`, `surface`, `cream`: area terang/paper.
- `dark`, `rich`, `mid`: overlay, section gelap, gradient, navbar, dan seal.
- `border`, `muted`, `text`: detail, teks sekunder, dan teks utama.

Custom color harus menimpa token turunan di bridge, bukan hanya `primary` saja.

## Capability section

Gunakan `capabilities` bila section mendukung editor khusus:

```ts
capabilities: {
  textStyle: true,
  image: true,
  gallery: true,
  backgroundColor: true,
  backgroundImage: true,
  map: true,
}
```

Hanya aktifkan capability yang benar-benar dipakai section. Ini menjaga sidebar editor tetap relevan untuk template khitanan, wisuda, dan kategori lain.

## Checklist agent sebelum selesai

- Tambahkan catalog, manifest, registry, dan runtime.
- Uji semua preset pada mobile dan desktop.
- Uji custom primary/accent/background.
- Uji tambah, sembunyikan, urutkan, dan edit semua section.
- Uji foto tunggal, gallery, background image, musik, map, dan ucapan jika digunakan.
- Pastikan klik sidebar dan bottom navigation tidak menggeser halaman editor utama.
- Jalankan `npm run build`.

Template baru tidak perlu memiliki section yang sama dengan Wedding Elegance; yang harus sama adalah contract editor, state, tema, dan navigasinya.
