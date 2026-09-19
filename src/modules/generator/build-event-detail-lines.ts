import type { InvitationShareData } from "@/modules/share-card/invitation-share-data";

export type EventDetailPreset = "formal" | "islami" | "casual" | "english" | "non-muslim";

/**
 * Menghasilkan blok teks detail acara kondisional (tanggal, jam, venue, alamat).
 * Menghilangkan baris yang bernilai kosong secara rapi tanpa tanda baca yatim atau 'undefined'.
 */
export function buildEventDetailLines(
  share: InvitationShareData,
  preset: EventDetailPreset
): string {
  const isEnglish = preset === "english";
  const isNonMuslim = preset === "non-muslim";
  const isWedding =
    share.category === "wedding" ||
    (share.category as string) === "pernikahan";

  const date = (share.eventDate || "").trim();
  const primaryTime = (share.primaryTime || "").trim();
  const secondaryTime = (share.secondaryTime || "").trim();
  const venue = (share.venue || "").trim();
  const address = (share.address || "").trim();

  // Jika semua informasi acara kosong, jangan tampilkan blok detail
  if (!date && !primaryTime && !secondaryTime && !venue && !address) {
    return "";
  }

  const lines: string[] = [];

  // Header blok acara
  if (isEnglish) {
    lines.push("Event Details:");
  } else {
    lines.push("Yang akan dilaksanakan pada:");
  }

  // Baris Tanggal
  if (date) {
    lines.push(`📅 ${date}`);
  }

  // Baris Waktu/Jam
  if (isWedding) {
    const ceremonyLabel = isEnglish ? "Ceremony" : isNonMuslim ? "Pemberkatan" : "Akad";
    const receptionLabel = isEnglish ? "Reception" : "Resepsi";

    if (primaryTime && secondaryTime) {
      lines.push(`⏰ ${ceremonyLabel}: ${primaryTime}`);
      lines.push(`⏰ ${receptionLabel}: ${secondaryTime}`);
    } else if (primaryTime) {
      if (isEnglish) {
        lines.push(`⏰ Time: ${primaryTime}`);
      } else {
        lines.push(`⏰ ${isNonMuslim ? "Pemberkatan" : "Waktu"}: ${primaryTime}`);
      }
    } else if (secondaryTime) {
      lines.push(`⏰ ${receptionLabel}: ${secondaryTime}`);
    }
  } else {
    // Non-wedding: gunakan label netral "Waktu"
    const timeLabel = isEnglish ? "Time" : "Waktu";
    if (primaryTime && secondaryTime) {
      lines.push(`⏰ ${timeLabel}: ${primaryTime} & ${secondaryTime}`);
    } else if (primaryTime) {
      lines.push(`⏰ ${timeLabel}: ${primaryTime}`);
    } else if (secondaryTime) {
      lines.push(`⏰ ${timeLabel}: ${secondaryTime}`);
    }
  }

  // Baris Lokasi / Venue & Alamat
  if (venue) {
    lines.push(`📍 ${venue}`);
    // Tampilkan alamat hanya jika ada dan berbeda dari venue
    if (address && address.toLowerCase() !== venue.toLowerCase()) {
      lines.push(address);
    }
  } else if (address) {
    lines.push(`📍 ${address}`);
  }

  return lines.join("\n");
}
