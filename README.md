# Undangan Console

Console editor untuk Template Kit undangan digital. Template pertama yang tersedia adalah `Wedding Lampung Elegance` dengan kode `hjydg`.

## Jalankan lokal

```bash
npm install
npm run db:migrate
npm run dev
```

Buka `http://localhost:3000/hjydg`.

## MySQL lokal

Konfigurasi default ada di `.env`:

```text
mysql://root@127.0.0.1:3306/undangan_console
```

Migration awal membuat tabel template, undangan, section, asset, dan ucapan; juga menambahkan Template Kit `hjydg`.

## Fitur editor awal

- Tab Editor, Generator nama tamu, dan Ucapan.
- Tombol Publish di navigasi atas.
- Theme warna dan kombinasi font milik template.
- Section sortable dengan drag-and-drop.
- Panel edit judul/deskripsi dan pemilihan file foto di preview.
- Floating action `Tambah section` di sisi kanan.

## Catatan

UI editor saat ini adalah fondasi client-side. Langkah berikutnya menghubungkan autosave, upload signed URL, dan publish ke API draft MySQL yang versioned.
