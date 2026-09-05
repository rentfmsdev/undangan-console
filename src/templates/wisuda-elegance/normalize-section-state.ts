import type { TemplateKit } from "../contracts";

export function normalizeWisudaSectionState(
  template: TemplateKit,
  records: Array<{ id: string; type: string; enabled: boolean; data: Record<string, unknown> }>,
  createId: (type: string) => string
) {
  const known = records
    .filter((record) => template.sections.some((section) => section.type === record.type))
    .map((record) => {
      const defaultData = template.sections.find((section) => section.type === record.type)?.defaultData ?? {};
      const mergedData: Record<string, unknown> = {
        ...defaultData,
        ...record.data,
      };

      // Auto-migrate & sanitize opening-envelope
      if (record.type === "opening-envelope") {
        if (!mergedData.title || mergedData.title === "Sidang Terbuka & Wisuda Sarjana") {
          mergedData.title = "UNDANGAN WISUDA";
        }
        if (!mergedData.graduateName || mergedData.graduateName === "Bagas Prasetyo, S.Kom") {
          mergedData.graduateName = "Anindya Putri Rahayu, S.Kom";
        }
      }

      // Auto-migrate & sanitize hero
      if (record.type === "hero") {
        if (!mergedData.graduateName || mergedData.graduateName === "Bagas Prasetyo") {
          mergedData.graduateName = "Anindya Putri Rahayu";
        }
        if (mergedData.photoUrl === "/assets/wisuda/icon-wisuda.png" || mergedData.photoUrl === "/assets/wisuda/mahasiswa.jpeg") {
          mergedData.photoUrl = "";
        }
        if (!mergedData.kicker || mergedData.kicker === "THE GRADUATION CELEBRATION") {
          mergedData.kicker = "🎉 MOMEN KELULUSAN & SELEBRASI 🎉";
        }
      }

      // Auto-migrate & sanitize quote
      if (record.type === "quote") {
        if (!mergedData.author || mergedData.author === "Bagas Prasetyo, S.Kom") {
          mergedData.author = "Anindya Putri Rahayu, S.Kom";
        }
        if (mergedData.photoUrl === "/assets/wisuda/icon-wisuda.png" || mergedData.photoUrl === "/assets/wisuda/mahasiswa.jpeg") {
          mergedData.photoUrl = "";
        }
      }

      // Auto-migrate & sanitize profile (remove skripsi & GPA)
      if (record.type === "profile") {
        delete mergedData.thesisTitle;
        delete mergedData.showThesis;
        delete mergedData.gpa;
        delete mergedData.honorTitle;
        if (!mergedData.graduateName || mergedData.graduateName === "Bagas Prasetyo, S.Kom") {
          mergedData.graduateName = "Anindya Putri Rahayu, S.Kom";
        }
        if (mergedData.photoUrl === "/assets/wisuda/icon-wisuda.png" || mergedData.photoUrl === "/assets/wisuda/mahasiswa.jpeg") {
          mergedData.photoUrl = "";
        }
        if (!mergedData.university) mergedData.university = "Universitas Indonesia";
        if (!mergedData.faculty) mergedData.faculty = "Fakultas Ilmu Komputer";
        if (!mergedData.major) mergedData.major = "Program Studi Sistem Informasi";
      }

      // Auto-migrate & sanitize event (add ceremony maps)
      if (record.type === "event") {
        if (!mergedData.ceremonyMapUrl) {
          mergedData.ceremonyMapUrl = "https://maps.app.goo.gl/wKxJ8Lh8D3H5N9Vq8";
        }
        if (!mergedData.ceremonyMapLabel) {
          mergedData.ceremonyMapLabel = "Buka Lokasi Balairung UI (Google Maps)";
        }
      }

      // Auto-migrate wishes
      if (record.type === "wishes") {
        if (!mergedData.title || mergedData.title === "Buku Tamu & Doa Restu" || mergedData.title === "Ucapan & Doa Restu") {
          mergedData.title = "Kirim Ucapan & Doa";
        }
      }

      // Auto-migrate closing
      if (record.type === "closing") {
        if (!mergedData.message || (typeof mergedData.message === "string" && mergedData.message.includes("doa restu"))) {
          mergedData.message = "Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga atas kehadiran, dukungan, dan ucapan tulus dari Bapak/Ibu/Saudara/i sekalian.";
        }
        if (!mergedData.familySignature || mergedData.familySignature === "Bagas Prasetyo, S.Kom & Keluarga Besar") {
          mergedData.familySignature = "Anindya Putri Rahayu, S.Kom & Keluarga Besar";
        }
        if (mergedData.photoUrl === "/assets/wisuda/wisuda-ramai.jpeg" || mergedData.photoUrl === "/assets/wisuda/Wisuda-2.webp") {
          mergedData.photoUrl = "";
        }
      }

      return {
        ...record,
        data: mergedData,
      };
    });

  for (const type of template.defaultSections) {
    if (!known.some((section) => section.type === type)) {
      const definition = template.sections.find((section) => section.type === type);
      if (definition) {
        known.push({
          id: createId(type),
          type,
          enabled: true,
          data: { ...definition.defaultData },
        });
      }
    }
  }

  return known;
}
