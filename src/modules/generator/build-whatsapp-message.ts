import type { TemplateKit } from "@/templates/contracts";
import type { InvitationShareData } from "@/modules/share-card/invitation-share-data";
import { buildEventDetailLines, type EventDetailPreset } from "./build-event-detail-lines";

export type WhatsAppPreset = EventDetailPreset;

export type WhatsAppInvitationInput = {
  preset: WhatsAppPreset;
  category: TemplateKit["category"];
  guestName: string;
  invitationUrl: string;
  share: InvitationShareData;
};

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Pembangun pesan WhatsApp murni yang menyertakan detail event aktual
 * (tanggal, jam akad/resepsi/waktu, venue, dan alamat) sebelum tautan undangan.
 */
export function buildWhatsAppMessage(input: WhatsAppInvitationInput): string {
  const { preset, category, guestName, invitationUrl, share } = input;
  const formattedGuest = (guestName || "").trim().replace(/\s+/g, " ") || "Bapak/Ibu/Saudara/i";
  const subject = (share.subject || "").trim() || "Acara Spesial Kami";
  const eventDetails = buildEventDetailLines(share, preset);
  const detailBlock = eventDetails ? `\n\n${eventDetails}\n\n` : "\n\n";

  const cat = (category || "wedding").toLowerCase();

  // 1. Wedding / Pernikahan
  if (cat === "wedding" || cat === "pernikahan") {
    switch (preset) {
      case "formal":
        return normalizeWhitespace(`
Assalamu'alaikum Wr. Wb.

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara resepsi pernikahan kami:

*${subject}*${detailBlock}Berikut tautan undangan untuk info lengkap acara & lokasi:
${invitationUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih atas perhatian dan doanya.
Wassalamu'alaikum Wr. Wb.
        `);

      case "islami":
        return normalizeWhitespace(`
Bismillahirrahmannirrahim

_Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan._

Dengan memohon ridho dan rahmat Allah SWT, kami bermaksud mengundang Bpk/Ibu/Saudara/i *${formattedGuest}* pada acara pernikahan kami:

*${subject}*${detailBlock}Info lengkap & lokasi acara dapat diakses melalui:
${invitationUrl}

Doa restu dan kehadiran Bapak/Ibu/Saudara/i merupakan kebahagiaan yang tak ternilai bagi kami.

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Wr. Wb.
        `);

      case "casual":
        return normalizeWhitespace(`
Hai *${formattedGuest}*! ✨

Save the date yaa! Kami mau berbagi kabar bahagia dan mengundang kamu untuk hadir di pesta pernikahan kami:

🎉 *${subject}* 🎉${detailBlock}Cek detail acara dan lokasinya di link undangan ini ya:
${invitationUrl}

Kehadiran dan doa dari kamu pasti bikin hari bahagia kami makin lengkap. See you there! 🙌
        `);

      case "english":
        return normalizeWhitespace(`
Dear *${formattedGuest}*,

Together with our families, we joyfully invite you to celebrate the wedding of:

*${subject}*${detailBlock}Please find the event details and location through this link:
${invitationUrl}

Your presence and prayers would mean the world to us as we begin this new journey together.

Warm regards,
${subject}
        `);

      case "non-muslim":
        return normalizeWhitespace(`
Salam Sejahtera dalam Kasih Tuhan,

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Tanpa mengurangi rasa hormat, dengan penuh rasa syukur kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pemberkatan dan resepsi pernikahan kami:

*${subject}*${detailBlock}Berikut tautan undangan untuk info lengkap acara & lokasi:
${invitationUrl}

Merupakan suatu kehormatan dan sukacita bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Kiranya kasih dan damai sejahtera senantiasa menyertai kita sekalian.
Terima kasih atas perhatian dan doanya.
        `);
    }
  }

  // 2. Khitanan
  if (cat === "khitanan" || cat.includes("khitan")) {
    switch (preset) {
      case "formal":
      case "non-muslim": // Safe fallback if preset is accidentally triggered
        return normalizeWhitespace(`
Assalamu'alaikum Wr. Wb.

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Dengan memohon rahmat Allah SWT, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara tasyakuran khitanan putra kami:

*${subject}*${detailBlock}Informasi lengkap mengenai jadwal dan lokasi acara dapat diakses melalui:
${invitationUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Wassalamu'alaikum Wr. Wb.
        `);

      case "islami":
        return normalizeWhitespace(`
Bismillahirrahmannirrahim

Dengan memohon ridho dan rahmat Allah SWT, kami bermaksud mengundang Bpk/Ibu/Saudara/i *${formattedGuest}* pada acara tasyakuran khitanan putra kami:

*${subject}*${detailBlock}Info lengkap & lokasi acara:
${invitationUrl}

Semoga ananda menjadi anak yang sholeh, berbakti kepada kedua orang tua, agama, dan bangsa. Kehadiran dan doa restu Bapak/Ibu merupakan kebahagiaan bagi keluarga kami.

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Wr. Wb.
        `);

      case "casual":
        return normalizeWhitespace(`
Hai *${formattedGuest}*! ✨

Kami mau mengundang kamu untuk hadir dan meramaikan acara tasyakuran khitanan adik kita:

🎉 *${subject}* 🎉${detailBlock}Yuk cek jadwal dan lokasi lengkapnya di link undangan ini:
${invitationUrl}

Kehadiran dan doa kamu sangat berarti buat kami. Ditunggu kedatangannya ya! 🙌
        `);

      case "english":
        return normalizeWhitespace(`
Dear *${formattedGuest}*,

With great joy, our family cordially invites you to the Circumcision (Khitanan) Thanksgiving Celebration of our beloved son:

*${subject}*${detailBlock}Please find the celebration details and venue location through this link:
${invitationUrl}

Your presence and warm prayers would be a blessing to our family.

Warm regards,
The Family
        `);
    }
  }

  // 3. Aqiqah
  if (cat === "aqiqah" || cat.includes("aqiqah")) {
    switch (preset) {
      case "formal":
      case "non-muslim": // Safe fallback if preset is accidentally triggered
        return normalizeWhitespace(`
Assalamu'alaikum Wr. Wb.

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Sebagai wujud rasa syukur kami atas kelahiran buah hati kami, perkenankan kami mengundang Bapak/Ibu/Saudara/i pada acara Tasyakuran Aqiqah:

*${subject}*${detailBlock}Detail jadwal & lokasi acara dapat dilihat pada tautan berikut:
${invitationUrl}

Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami ucapkan terima kasih yang sebesar-besarnya.

Wassalamu'alaikum Wr. Wb.
        `);

      case "islami":
        return normalizeWhitespace(`
Bismillahirrahmannirrahim

_Segala puji bagi Allah SWT atas amanah dan karunia buah hati yang dianugerahkan kepada keluarga kami._

Kami mengundang Bpk/Ibu/Saudara/i *${formattedGuest}* untuk menghadiri acara Tasyakuran Aqiqah:

*${subject}*${detailBlock}Info lengkap acara & lokasi:
${invitationUrl}

Semoga ananda tumbuh sehat, cerdas, berakhlak mulia, dan senantiasa dalam lindungan Allah SWT.

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Wr. Wb.
        `);

      case "casual":
        return normalizeWhitespace(`
Hai *${formattedGuest}*! 👶✨

Alhamdulillah, kami mau berbagi kebahagiaan atas kelahiran buah hati kami dan mengundang kamu di acara Tasyakuran Aqiqah:

🌟 *${subject}* 🌟${detailBlock}Cek waktu dan lokasi acaranya di link ini ya:
${invitationUrl}

Yuk datang dan doakan si kecil bersama kami! Sampai jumpa yaa 🙌
        `);

      case "english":
        return normalizeWhitespace(`
Dear *${formattedGuest}*,

With grateful hearts for the gift of our precious baby, we joyfully invite you to the Aqiqah Celebration of:

*${subject}*${detailBlock}Please find the celebration details and location here:
${invitationUrl}

Your presence and blessings mean the world to our family.

Warm regards,
The Family
        `);
    }
  }

  // 4. Birthday / Ulang Tahun
  if (cat === "birthday" || cat.includes("birth") || cat.includes("ulang")) {
    switch (preset) {
      case "formal":
        return normalizeWhitespace(`
Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara perayaan ulang tahun:

*${subject}*${detailBlock}Informasi lengkap mengenai waktu dan lokasi acara dapat diakses melalui:
${invitationUrl}

Merupakan suatu kebahagiaan bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i.

Terima kasih atas perhatiannya.
        `);

      case "islami":
        return normalizeWhitespace(`
Bismillahirrahmannirrahim

Sebagai wujud rasa syukur kami atas bertambahnya usia dan limpahan rahmat Allah SWT, kami mengundang Bpk/Ibu/Saudara/i *${formattedGuest}* pada acara syukuran ulang tahun:

*${subject}*${detailBlock}Info lengkap acara:
${invitationUrl}

Semoga senantiasa diberikan umur yang berkah, kesehatan, dan kemudahan dalam segala urusan.

Jazakumullah Khairan Katsiran.
        `);

      case "non-muslim":
        return normalizeWhitespace(`
Salam Sejahtera,

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Dengan penuh rasa syukur atas berkat, kesehatan, dan penyertaan Tuhan di pertambahan usia, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri perayaan ulang tahun:

🎂 *${subject}* 🎂${detailBlock}Informasi lengkap mengenai waktu dan lokasi acara dapat diakses melalui:
${invitationUrl}

Merupakan suatu sukacita dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Kiranya berkat dan damai sejahtera senantiasa menyertai kita semua. Terima kasih.
        `);

      case "casual":
        return normalizeWhitespace(`
Hai *${formattedGuest}*! 🥳🎉

It's party time! Kami mengundang kamu untuk datang dan merayakan hari ulang tahun:

🎂 *${subject}* 🎂${detailBlock}Cek info detail acara dan lokasinya di sini ya:
${invitationUrl}

Pasti seru banget kalau kamu hadir! See you at the party! ✨
        `);

      case "english":
        return normalizeWhitespace(`
Dear *${formattedGuest}*,

You are warmly invited to join the Birthday Celebration of:

*${subject}*${detailBlock}Please check all event details and venue location through this link:
${invitationUrl}

We look forward to celebrating this special day with you!

Warm regards,
${subject}
        `);
    }
  }

  // 5. Wisuda / Graduation
  if (cat === "wisuda" || cat.includes("wisuda") || cat.includes("graduat")) {
    switch (preset) {
      case "formal":
        return normalizeWhitespace(`
Assalamu'alaikum Wr. Wb.

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Sebagai wujud rasa syukur atas kelulusan dan terselesaikannya studi pendidikan, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Syukuran Wisuda:

🎓 *${subject}* 🎓${detailBlock}Detail jadwal & lokasi acara dapat dilihat pada tautan berikut:
${invitationUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih atas perhatian dan doanya.
Wassalamu'alaikum Wr. Wb.
        `);

      case "islami":
        return normalizeWhitespace(`
Bismillahirrahmannirrahim

_Alhamdulillah 'ala kulli hal, segala puji bagi Allah SWT atas karunia dan kelancaran yang dianugerahkan dalam menempuh pendidikan._

Dengan memohon ridho dan berkah-Nya, kami mengundang Bpk/Ibu/Saudara/i *${formattedGuest}* pada acara Tasyakuran Wisuda:

🎓 *${subject}* 🎓${detailBlock}Informasi lengkap acara & lokasi:
${invitationUrl}

Semoga ilmu yang diperoleh menjadi berkah dan bermanfaat bagi agama, keluarga, dan bangsa. Kehadiran dan doa restu Bapak/Ibu merupakan kebahagiaan bagi kami.

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Wr. Wb.
        `);

      case "non-muslim":
        return normalizeWhitespace(`
Salam Sejahtera,

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Puji dan syukur kepada Tuhan atas penyertaan dan anugerah-Nya sehingga jenjang pendidikan ini dapat diselesaikan dengan baik. Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Syukuran Wisuda:

🎓 *${subject}* 🎓${detailBlock}Detail jadwal & lokasi acara dapat dilihat pada tautan berikut:
${invitationUrl}

Merupakan suatu kehormatan dan sukacita bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Kiranya berkat dan penyertaan-Nya senantiasa melimpah bagi kita sekalian. Terima kasih.
        `);

      case "casual":
        return normalizeWhitespace(`
Hai *${formattedGuest}*! 🎓✨

Finally graduated! Setelah perjuangan skripsi dan kuliah, saatnya kita rayakan bareng-bareng di acara syukuran kelulusan:

🎉 *${subject}* 🎉${detailBlock}Yuk cek jadwal dan lokasi lengkapnya di tautan undangan ini:
${invitationUrl}

Kehadiran dan foto bareng kamu pasti bikin momen ini makin berkesan. Ditunggu kedatangannya ya! 🙌
        `);

      case "english":
        return normalizeWhitespace(`
Dear *${formattedGuest}*,

With immense joy and gratitude for the completion of academic journey, you are cordially invited to celebrate the Graduation of:

🎓 *${subject}* 🎓${detailBlock}Please find the ceremony details and location here:
${invitationUrl}

Your presence and congratulations would make this milestone even more memorable.

Warm regards,
${subject} & Family
        `);
    }
  }

  // 6. Default / General Event
  switch (preset) {
    case "english":
      return normalizeWhitespace(`
Dear *${formattedGuest}*,

We joyfully invite you to celebrate our special event:

*${subject}*${detailBlock}Please find the full event details and venue location through this link:
${invitationUrl}

Thank you for your warm presence and wishes.
      `);

    case "non-muslim":
      return normalizeWhitespace(`
Salam Sejahtera,

Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Dengan penuh rasa syukur atas segala berkat dan kebaikan yang kami terima, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami:

*${subject}*${detailBlock}Berikut tautan undangan untuk info lengkap acara & lokasi:
${invitationUrl}

Merupakan suatu kehormatan dan sukacita bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i.

Kiranya damai dan berkat sejahtera senantiasa menyertai kita semua. Terima kasih.
      `);

    default:
      return normalizeWhitespace(`
Kepada Yth.
Bpk/Ibu/Saudara/i *${formattedGuest}*

Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami:

*${subject}*${detailBlock}Berikut tautan undangan untuk info lengkap acara & lokasi:
${invitationUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i.

Terima kasih atas perhatiannya.
      `);
  }
}
