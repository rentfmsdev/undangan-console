import { defineTemplate } from "../schema";

const visual = { textStyle: true, backgroundColor: true, backgroundImage: true } as const;

export const weddingAvantVows = defineTemplate({
  id: "wedding-avant-vows",
  code: "folio",
  version: 1,
  category: "wedding",
  name: "Avant Vows",
  description: "Undangan pernikahan premium bergaya kinetic editorial dengan panel lipat 3D, contact-sheet gallery, dan empat art-direction preset.",
  price: 75000,
  defaultMusicUrl: "/assets/audio/Until-I-Found-You-Piano-Cover.mp3",
  defaultView: "mobile",
  useContainer: true,
  navigation: { scrollRootSelector: "[data-template-scroll-root]", sectionAttribute: "data-template-section", openingSectionId: "opening-envelope" },
  themes: [
    { id: "ink-vermilion", label: "Ink & Vermilion", colors: { background: "#f3eadb", surface: "#fffaf0", primary: "#ed4b32", accent: "#f3b82f", text: "#151515", dark: "#111111", rich: "#2b2926", mid: "#8a8175", cream: "#f3eadb", border: "#151515", muted: "#716b63" }, fonts: { display: "Cormorant Garamond", heading: "Cormorant Garamond", body: "Manrope" } },
    { id: "cobalt-butter", label: "Cobalt & Butter", colors: { background: "#f6e9a9", surface: "#fff8d5", primary: "#1648d8", accent: "#ff6a3d", text: "#10245d", dark: "#071b50", rich: "#183986", mid: "#6982c1", cream: "#f6e9a9", border: "#1648d8", muted: "#5c6790" }, fonts: { display: "Cormorant Garamond", heading: "Manrope", body: "Manrope" } },
    { id: "plum-mint", label: "Plum & Mint", colors: { background: "#dff3df", surface: "#f4fff2", primary: "#7d245f", accent: "#dd5c76", text: "#321d32", dark: "#271027", rich: "#5b1e4b", mid: "#9d7292", cream: "#dff3df", border: "#7d245f", muted: "#746273" }, fonts: { display: "Great Vibes", heading: "Cormorant Garamond", body: "Manrope" } },
    { id: "espresso-blush", label: "Espresso & Blush", colors: { background: "#f2d8d1", surface: "#fff2ed", primary: "#6f3d2e", accent: "#d55e60", text: "#3b211c", dark: "#281510", rich: "#573126", mid: "#a77b70", cream: "#f2d8d1", border: "#6f3d2e", muted: "#806861" }, fonts: { display: "Dancing Script", heading: "Cormorant Garamond", body: "Manrope" } },
  ],
  sections: [
    {
      type: "opening-envelope", label: "Opening Envelope", description: "Sampul majalah interaktif.", required: true, reorderable: false, maxInstances: 1, capabilities: visual,
      fields: [
        { key: "issue", label: "Nomor edisi", control: "text" }, { key: "eyebrow", label: "Label", control: "text" }, { key: "title", label: "Nama mempelai", control: "text" }, { key: "date", label: "Tanggal", control: "text" }, { key: "guestLabel", label: "Label tamu", control: "text" }, { key: "sealLabel", label: "Teks tombol", control: "text" },
      ],
      defaultData: { issue: "SPECIAL EDITION / 01", eyebrow: "A limited wedding edition", title: "Nara + Elang", date: "14 November 2026", guestLabel: "Dipersiapkan khusus untuk", sealLabel: "Buka undangan" },
    },
    {
      type: "hero", label: "Cover Story", description: "Cover utama dengan foto editorial.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: [
        { key: "issue", label: "Nomor edisi", control: "text" }, { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Nama mempelai", control: "text" }, { key: "subtitle", label: "Tanggal dan kota", control: "text" }, { key: "guestLabel", label: "Label tamu", control: "text" }, { key: "guestName", label: "Nama tamu default", control: "text" }, { key: "scrollLabel", label: "Petunjuk scroll", control: "text" },
      ],
      defaultData: { issue: "VOL. 01", eyebrow: "A love story worth printing", title: "Nara + Elang", subtitle: "14.11.2026 / Jakarta", guestLabel: "Edisi khusus untuk", guestName: "Tamu Undangan", scrollLabel: "Baca kisah kami", imageUrl: "", imageLabel: "Unggah foto cover 3:4" },
    },
    {
      type: "couple", label: "The People", description: "Profil kedua mempelai.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: [
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "intro", label: "Pengantar", control: "textarea", rows: 3 }, { key: "brideLabel", label: "Label mempelai wanita", control: "text" }, { key: "brideName", label: "Nama mempelai wanita", control: "text" }, { key: "brideParents", label: "Orang tua mempelai wanita", control: "textarea", rows: 2 }, { key: "groomLabel", label: "Label mempelai pria", control: "text" }, { key: "groomName", label: "Nama mempelai pria", control: "text" }, { key: "groomParents", label: "Orang tua mempelai pria", control: "textarea", rows: 2 },
      ],
      defaultData: { eyebrow: "The people behind the vows", title: "Two names, one promise", intro: "Dengan penuh syukur, kami memperkenalkan dua hati yang memilih berjalan menuju halaman yang sama.", brideLabel: "01 / The Bride", brideName: "Nara Adelia", brideParents: "Putri dari Bapak Arman dan Ibu Lestari", groomLabel: "02 / The Groom", groomName: "Elang Pratama", groomParents: "Putra dari Bapak Raka dan Ibu Sinta", imageUrls: [], imageMax: 2, imageLabel: "Unggah dua foto mempelai 3:4" },
    },
    {
      type: "event", label: "The Date", description: "Waktu, lokasi, dress code, peta, dan kalender.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, map: true },
      fields: [
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "date", label: "Tanggal", control: "text" }, { key: "akadLabel", label: "Label akad", control: "text" }, { key: "akadTime", label: "Waktu akad", control: "text" }, { key: "receptionLabel", label: "Label resepsi", control: "text" }, { key: "receptionTime", label: "Waktu resepsi", control: "text" }, { key: "venue", label: "Nama lokasi", control: "text" }, { key: "address", label: "Alamat", control: "textarea", rows: 3 }, { key: "mapUrl", label: "URL Google Maps", control: "url" }, { key: "mapLabel", label: "Teks Maps", control: "text" }, { key: "calendarLabel", label: "Teks kalender", control: "text" }, { key: "dressCodeLabel", label: "Label dress code", control: "text" }, { key: "dressCode", label: "Warna dress code", control: "text" }, { key: "dressCodeNote", label: "Catatan dress code", control: "textarea", rows: 2 },
      ],
      defaultData: { eyebrow: "Save the date", title: "One date, two promises", date: "Sabtu, 14 November 2026", akadLabel: "Akad Nikah", akadTime: "08.00 WIB", receptionLabel: "Resepsi", receptionTime: "11.00 - 14.00 WIB", venue: "The Glass House", address: "Jl. Senopati No. 21, Jakarta Selatan", mapUrl: "https://www.google.com/maps/search/?api=1&query=Senopati+Jakarta", mapLabel: "Buka Maps", calendarLabel: "Simpan kalender", dressCodeLabel: "Dress Code", dressCode: "Monochrome + one bold accent", dressCodeNote: "Kenakan versi terbaik diri Anda." },
    },
    {
      type: "story", label: "Long Read", description: "Timeline perjalanan hubungan.", required: false, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: [
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Pengantar", control: "textarea", rows: 2 }, { key: "firstDate", label: "Tahun pertama", control: "text" }, { key: "firstTitle", label: "Judul pertama", control: "text" }, { key: "firstCopy", label: "Cerita pertama", control: "textarea", rows: 3 }, { key: "secondDate", label: "Tahun kedua", control: "text" }, { key: "secondTitle", label: "Judul kedua", control: "text" }, { key: "secondCopy", label: "Cerita kedua", control: "textarea", rows: 3 }, { key: "thirdDate", label: "Tahun ketiga", control: "text" }, { key: "thirdTitle", label: "Judul ketiga", control: "text" }, { key: "thirdCopy", label: "Cerita ketiga", control: "textarea", rows: 3 },
      ],
      defaultData: { eyebrow: "The long read", title: "Ordinary days, extraordinary us", subtitle: "Tiga potongan kecil yang membawa kami sampai pada halaman ini.", firstDate: "2020", firstTitle: "First encounter", firstCopy: "Pertemuan singkat yang ternyata menetap lebih lama dari yang kami kira.", secondDate: "2023", secondTitle: "Same direction", secondCopy: "Kami mulai menyusun mimpi yang tidak lagi memakai kata aku.", thirdDate: "2026", thirdTitle: "The next chapter", thirdCopy: "Kini kami mengundang Anda menjadi saksi halaman pertama perjalanan baru." },
    },
    {
      type: "gallery", label: "Contact Sheet", description: "Galeri editorial dengan lightbox.", required: false, reorderable: true, maxInstances: 1, capabilities: { ...visual, gallery: true },
      fields: [{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Caption", control: "textarea", rows: 2 }, { key: "emptyLabel", label: "Placeholder foto", control: "text" }],
      defaultData: { eyebrow: "Contact sheet / 04", title: "Moments worth keeping", subtitle: "Empat bingkai untuk fragmen yang selalu ingin kami ingat.", emptyLabel: "Your photograph", imageUrls: [], imageLabel: "Unggah maksimal empat foto galeri" },
    },
    {
      type: "gift", label: "Gift Registry", description: "Rekening dan QRIS modular.", required: false, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: [{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Deskripsi", control: "textarea", rows: 3 }, { key: "bank1", label: "Bank pertama", control: "text" }, { key: "account1", label: "Nomor pertama", control: "text" }, { key: "holder1", label: "Pemilik pertama", control: "text" }, { key: "bank2", label: "Bank kedua", control: "text" }, { key: "account2", label: "Nomor kedua", control: "text" }, { key: "holder2", label: "Pemilik kedua", control: "text" }, { key: "buttonLabel", label: "Teks tombol salin", control: "text" }, { key: "qrisLabel", label: "Label QRIS", control: "text" }],
      defaultData: { eyebrow: "Registry desk", title: "Your presence is the present", subtitle: "Kehadiran dan doa Anda adalah hadiah terindah. Bila berkenan, tanda kasih dapat dikirim melalui detail berikut.", bank1: "BCA", account1: "123 456 7890", holder1: "a.n. Nara Adelia", bank2: "Mandiri", account2: "987 654 3210", holder2: "a.n. Elang Pratama", buttonLabel: "Salin nomor", qrisLabel: "Pindai QRIS", showBank: true, hasSecondAccount: false, showQris: true, imageUrl: "", imageLabel: "Unggah QRIS dari Asset Manager" },
    },
    {
      type: "wishes", label: "Guest Notes", description: "RSVP dan buku tamu.", required: false, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: [{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Deskripsi", control: "textarea", rows: 2 }, { key: "namePlaceholder", label: "Placeholder nama", control: "text" }, { key: "messagePlaceholder", label: "Placeholder pesan", control: "text" }, { key: "attendanceLabel", label: "Label RSVP", control: "text" }, { key: "attendancePresentLabel", label: "Pilihan hadir", control: "text" }, { key: "attendanceUnsureLabel", label: "Pilihan belum pasti", control: "text" }, { key: "attendanceAbsentLabel", label: "Pilihan berhalangan", control: "text" }, { key: "submitLabel", label: "Teks tombol", control: "text" }],
      defaultData: { eyebrow: "Letters to the couple", title: "Add your words to our story", subtitle: "Konfirmasi kehadiran dan tinggalkan doa yang akan kami simpan.", namePlaceholder: "Nama Anda", messagePlaceholder: "Tulis ucapan dan doa", attendanceLabel: "Konfirmasi kehadiran", attendancePresentLabel: "Hadir", attendanceUnsureLabel: "Belum pasti", attendanceAbsentLabel: "Berhalangan hadir", submitLabel: "Kirim ucapan" },
    },
    {
      type: "closing", label: "Back Cover", description: "Halaman penutup editorial.", required: true, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: [{ key: "issue", label: "Nomor edisi", control: "text" }, { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "copy", label: "Ucapan", control: "textarea", rows: 3 }, { key: "subtitle", label: "Nama mempelai", control: "text" }],
      defaultData: { issue: "END / BEGIN", eyebrow: "The final page", title: "Forever starts here", copy: "Terima kasih telah hadir di halaman pertama perjalanan seumur hidup kami.", subtitle: "Nara + Elang" },
    },
  ],
  defaultSections: ["opening-envelope", "hero", "couple", "event", "story", "gallery", "gift", "wishes", "closing"],
});
