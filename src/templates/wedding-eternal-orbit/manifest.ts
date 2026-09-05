import { defineTemplate } from "../schema";

const visual = {
  textStyle: true,
  backgroundColor: true,
  backgroundImage: true,
};

const motionOptions = [
  { value: "cinematic", label: "Cinematic 3D" },
  { value: "soft", label: "Lembut" },
  { value: "off", label: "Tanpa animasi" },
];

const withDecoration = (
  fields: Array<{ key: string; label: string; control: "text" | "textarea" | "url"; rows?: number }>,
  variants: Array<{ value: string; label: string }>,
) => [
  ...fields,
  { key: "decorationVariant", label: "Gaya dekorasi", control: "select" as const, options: variants },
  { key: "motionStyle", label: "Gerakan", control: "select" as const, options: motionOptions },
  { key: "showParticles", label: "Celestial shower", control: "toggle" as const },
  { key: "decorationIntensity", label: "Intensitas dekorasi", control: "range" as const, min: 0, max: 100, step: 5 },
];

const decorDefaults = { motionStyle: "cinematic", showParticles: true, decorationIntensity: 65 };

export const weddingEternalOrbit = defineTemplate({
  id: "wedding-eternal-orbit",
  code: "orbit",
  version: 1,
  category: "wedding",
  name: "Eternal Orbit",
  description:
    "Undangan pernikahan sinematik dengan envelope, transisi perspektif 3D, dan empat preset warna elegan.",
  price: 65000,
  defaultMusicUrl: "/assets/audio/Can't-Help-Falling-In-Love-Piano-Version.mp3",
  navigation: {
    scrollRootSelector: "[data-template-scroll-root]",
    sectionAttribute: "data-template-section",
    openingSectionId: "opening-envelope",
  },
  defaultView: "mobile",
  useContainer: true,
  themes: [
    {
      id: "midnight-sapphire",
      label: "Midnight Sapphire",
      colors: { background: "#101a31", surface: "#172542", primary: "#bfa66a", accent: "#f0dca2", text: "#f8f3e8", dark: "#080f21", rich: "#142544", mid: "#6483af", cream: "#f7f3e9", border: "#526889", muted: "#b7c2d5" },
      fonts: { display: "Great Vibes", heading: "Cormorant Garamond", body: "Manrope" },
    },
    {
      id: "aurora-plum",
      label: "Aurora Plum",
      colors: { background: "#2a1737", surface: "#3a2149", primary: "#e1ad8c", accent: "#f1c990", text: "#fff5f1", dark: "#1c1027", rich: "#4b2b5d", mid: "#aa7cae", cream: "#fff8f5", border: "#795a87", muted: "#d7bdd3" },
      fonts: { display: "Dancing Script", heading: "Cormorant Garamond", body: "Manrope" },
    },
    {
      id: "pearl-dawn",
      label: "Pearl Dawn",
      colors: { background: "#243746", surface: "#334c5e", primary: "#9fb9ca", accent: "#e0aa92", text: "#fffaf5", dark: "#14232e", rich: "#2b4354", mid: "#7795aa", cream: "#fffaf5", border: "#718b9c", muted: "#d2dde2" },
      fonts: { display: "Great Vibes", heading: "Cormorant Garamond", body: "Manrope" },
    },
    {
      id: "celestial-teal",
      label: "Celestial Teal",
      colors: { background: "#082c35", surface: "#10424b", primary: "#aad5ce", accent: "#d7b477", text: "#effbf8", dark: "#041c23", rich: "#0b3640", mid: "#4f9294", cream: "#f4fbf9", border: "#5f9896", muted: "#b7d2cd" },
      fonts: { display: "Dancing Script", heading: "Cormorant Garamond", body: "Manrope" },
    },
  ],
  sections: [
    {
      type: "opening-envelope", label: "Opening Envelope", description: "Layar pembuka undangan.", required: true, reorderable: false, maxInstances: 1, capabilities: visual,
      fields: withDecoration([
        { key: "eyebrow", label: "Kicker", control: "text" },
        { key: "title", label: "Nama mempelai", control: "text" },
        { key: "date", label: "Tanggal", control: "text" },
        { key: "guestLabel", label: "Label tamu", control: "text" },
        { key: "sealLabel", label: "Teks tombol buka", control: "text" },
      ], [{ value: "vault", label: "Celestial Vault" }, { value: "folded-letter", label: "Folded Letter" }, { value: "minimal-orbit", label: "Minimal Orbit" }]),
      defaultData: { title: "Nara & Elang", eyebrow: "The wedding of", date: "Sabtu, 14 November 2026", guestLabel: "Kepada Yth.", sealLabel: "Buka undangan", decorationVariant: "vault", ...decorDefaults },
    },
    {
      type: "hero", label: "Hero", description: "Sambutan utama dan foto opsional.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: withDecoration([
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Nama mempelai", control: "text" }, { key: "subtitle", label: "Tanggal dan lokasi", control: "text" }, { key: "guestLabel", label: "Label tamu", control: "text" }, { key: "guestName", label: "Nama tamu", control: "text" }, { key: "scrollLabel", label: "Petunjuk scroll", control: "text" },
      ], [{ value: "portal", label: "Orbital Portal" }, { value: "eclipse", label: "Eclipse" }, { value: "constellation-frame", label: "Constellation Frame" }]),
      defaultData: { title: "Nara & Elang", eyebrow: "A love written in the stars", subtitle: "14 November 2026 · Bandung", guestLabel: "Dengan penuh cinta, mengundang", guestName: "Tamu Undangan", scrollLabel: "Jelajahi kisah kami", imageUrl: "", imageLabel: "Unggah foto mempelai", decorationVariant: "portal", ...decorDefaults },
    },
    {
      type: "couple", label: "Mempelai", description: "Perkenalan kedua mempelai.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: withDecoration([
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "intro", label: "Pengantar", control: "textarea", rows: 3 }, { key: "brideName", label: "Nama mempelai wanita", control: "text" }, { key: "brideParents", label: "Orang tua wanita", control: "textarea", rows: 2 }, { key: "groomName", label: "Nama mempelai pria", control: "text" }, { key: "groomParents", label: "Orang tua pria", control: "textarea", rows: 2 },
      ], [{ value: "twin-arches", label: "Twin Arches" }, { value: "floating-cards", label: "Floating Cards" }, { value: "celestial-medallion", label: "Celestial Medallion" }]),
      defaultData: { eyebrow: "The couple", title: "Dua jiwa, satu orbit", intro: "Dengan rasa syukur, kami memperkenalkan dua hati yang memilih pulang satu sama lain.", brideName: "Nara Adelia", brideParents: "Putri dari Bapak Arman & Ibu Lestari", groomName: "Elang Pratama", groomParents: "Putra dari Bapak Raka & Ibu Sinta", imageUrls: [], imageLabel: "Unggah foto kedua mempelai", imageMax: 2, decorationVariant: "twin-arches", ...decorDefaults },
    },
    {
      type: "event", label: "Rangkaian Acara", description: "Waktu, lokasi, peta, dan kalender.", required: true, reorderable: true, maxInstances: 1, capabilities: { ...visual, map: true },
      fields: withDecoration([
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "date", label: "Tanggal", control: "text" }, { key: "akadTime", label: "Waktu akad", control: "text" }, { key: "receptionTime", label: "Waktu resepsi", control: "text" }, { key: "venue", label: "Nama venue", control: "text" }, { key: "address", label: "Alamat", control: "textarea", rows: 3 }, { key: "mapUrl", label: "URL Google Maps", control: "url" }, { key: "mapLabel", label: "Teks tombol Maps", control: "text" }, { key: "calendarLabel", label: "Teks tombol kalender", control: "text" },
      ], [{ value: "astrolabe", label: "Astral Astrolabe" }, { value: "ticket", label: "Celestial Ticket" }, { value: "split-card", label: "Split Card" }]),
      defaultData: { eyebrow: "Save the date", title: "Hari yang kami nantikan", date: "Sabtu, 14 November 2026", akadTime: "08.00 WIB", receptionTime: "11.00 – 14.00 WIB", venue: "The Gaia Hotel", address: "Jl. Dr. Setiabudi No. 430, Bandung", mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Gaia+Hotel+Bandung", mapLabel: "Buka Maps", calendarLabel: "Simpan kalender", decorationVariant: "astrolabe", ...decorDefaults },
    },
    {
      type: "story", label: "Perjalanan Kami", description: "Timeline kisah mempelai.", required: false, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: withDecoration([
        { key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Pengantar", control: "textarea", rows: 2 }, { key: "firstDate", label: "Tahun pertama", control: "text" }, { key: "firstTitle", label: "Judul pertama", control: "text" }, { key: "firstCopy", label: "Cerita pertama", control: "textarea", rows: 2 }, { key: "secondDate", label: "Tahun kedua", control: "text" }, { key: "secondTitle", label: "Judul kedua", control: "text" }, { key: "secondCopy", label: "Cerita kedua", control: "textarea", rows: 2 }, { key: "thirdDate", label: "Tahun ketiga", control: "text" }, { key: "thirdTitle", label: "Judul ketiga", control: "text" }, { key: "thirdCopy", label: "Cerita ketiga", control: "textarea", rows: 2 },
      ], [{ value: "stacked-cards", label: "Stacked Cards" }, { value: "orbit-path", label: "Orbit Path" }, { value: "chapter-pages", label: "Chapter Pages" }]),
      defaultData: { eyebrow: "Our constellation", title: "Kisah yang terus berputar", subtitle: "Tiga bab yang membawa kami pada satu janji.", firstDate: "2020", firstTitle: "Berkenalan", firstCopy: "Sebuah percakapan sederhana membuka semesta baru.", secondDate: "2023", secondTitle: "Menumbuhkan keyakinan", secondCopy: "Kami belajar memilih satu sama lain setiap hari.", thirdDate: "2026", thirdTitle: "Menuju selamanya", thirdCopy: "Dengan doa keluarga, kami memulai perjalanan baru.", decorationVariant: "stacked-cards", ...decorDefaults },
    },
    {
      type: "gallery", label: "Galeri", description: "Frame momen pilihan.", required: false, reorderable: true, maxInstances: 1, capabilities: { ...visual, gallery: true },
      fields: withDecoration([{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Caption", control: "textarea", rows: 2 }], [{ value: "prismatic-grid", label: "Prismatic Grid" }, { value: "film-strip", label: "Celestial Film" }, { value: "floating-polaroid", label: "Floating Polaroid" }]),
      defaultData: { eyebrow: "Captured in time", title: "Fragmen yang kami simpan", subtitle: "Setiap gambar akan menjadi bagian dari perjalanan kami.", imageUrls: [], imageLabel: "Unggah foto galeri", decorationVariant: "prismatic-grid", ...decorDefaults },
    },
    {
      type: "gift", label: "Hadiah", description: "Rekening dan QRIS modular.", required: false, reorderable: true, maxInstances: 1, capabilities: { ...visual, image: true },
      fields: withDecoration([{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Deskripsi", control: "textarea", rows: 3 }, { key: "bank1", label: "Nama bank", control: "text" }, { key: "account1", label: "Nomor rekening", control: "text" }, { key: "holder1", label: "Nama pemilik", control: "text" }, { key: "bank2", label: "Nama rekening kedua", control: "text" }, { key: "account2", label: "Nomor rekening kedua", control: "text" }, { key: "holder2", label: "Nama pemilik kedua", control: "text" }, { key: "buttonLabel", label: "Teks tombol salin", control: "text" }, { key: "qrisLabel", label: "Label QRIS", control: "text" }], [{ value: "luminous-plate", label: "Luminous Plate" }, { value: "glass-vault", label: "Glass Vault" }, { value: "minimal-line", label: "Minimal Line" }]),
      defaultData: { eyebrow: "With gratitude", title: "Tanda kasih", subtitle: "Kehadiran dan doa Anda adalah hadiah terbaik. Bila berkenan, tanda kasih dapat dikirim melalui berikut.", bank1: "BCA", account1: "123 456 7890", holder1: "a.n. Nara Adelia", bank2: "DANA", account2: "0812 3456 7890", holder2: "a.n. Elang Pratama", buttonLabel: "Salin nomor", qrisLabel: "Scan QRIS tanda kasih", showBank: true, hasSecondAccount: false, showQris: true, imageUrl: "", imageLabel: "Unggah QRIS dari Asset Manager", decorationVariant: "luminous-plate", ...decorDefaults },
    },
    {
      type: "wishes", label: "Ucapan", description: "RSVP dan buku tamu.", required: false, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: withDecoration([{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "subtitle", label: "Deskripsi", control: "textarea", rows: 2 }, { key: "namePlaceholder", label: "Placeholder nama", control: "text" }, { key: "messagePlaceholder", label: "Placeholder ucapan", control: "text" }, { key: "attendanceLabel", label: "Label RSVP", control: "text" }, { key: "attendancePresentLabel", label: "Pilihan hadir", control: "text" }, { key: "attendanceUnsureLabel", label: "Pilihan belum pasti", control: "text" }, { key: "attendanceAbsentLabel", label: "Pilihan berhalangan", control: "text" }, { key: "submitLabel", label: "Teks tombol kirim", control: "text" }], [{ value: "observatory", label: "Wish Observatory" }, { value: "letter-desk", label: "Letter Desk" }, { value: "clean-panel", label: "Clean Panel" }]),
      defaultData: { eyebrow: "Send your light", title: "Titipkan doa baik", subtitle: "Kata-kata Anda akan menjadi kenangan yang selalu kami simpan.", namePlaceholder: "Nama Anda", messagePlaceholder: "Tulis ucapan dan doa", attendanceLabel: "Konfirmasi kehadiran", attendancePresentLabel: "Hadir", attendanceUnsureLabel: "Belum pasti", attendanceAbsentLabel: "Berhalangan hadir", submitLabel: "Kirim ucapan", decorationVariant: "observatory", ...decorDefaults },
    },
    {
      type: "closing", label: "Penutup", description: "Ucapan terima kasih.", required: true, reorderable: true, maxInstances: 1, capabilities: visual,
      fields: withDecoration([{ key: "eyebrow", label: "Kicker", control: "text" }, { key: "title", label: "Judul", control: "text" }, { key: "copy", label: "Ucapan penutup", control: "textarea", rows: 3 }, { key: "subtitle", label: "Nama mempelai", control: "text" }], [{ value: "dove-constellation", label: "Dove Constellation" }, { value: "infinity-orbit", label: "Infinity Orbit" }, { value: "quiet-stars", label: "Quiet Stars" }]),
      defaultData: { eyebrow: "Until we meet", title: "Terima kasih", copy: "Terima kasih telah meluangkan waktu, doa, dan kehangatan untuk merayakan awal kisah kami.", subtitle: "Nara & Elang", decorationVariant: "dove-constellation", ...decorDefaults },
    },
  ],
  defaultSections: ["opening-envelope", "hero", "couple", "event", "story", "gallery", "gift", "wishes", "closing"],
});
