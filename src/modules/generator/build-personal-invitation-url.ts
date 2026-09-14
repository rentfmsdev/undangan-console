import { buildInvitationUrl, buildSubdomainUrl } from "@/lib/app-url";

export type PersonalInvitationUrlOptions = {
  identifier?: string | null;
  publishMode?: "path" | "subdomain" | "custom_domain" | null;
  publishUrl?: string | null;
  guestName?: string | null;
  fallbackCode?: string;
};

/**
 * Membangun URL undangan yang dipersonalisasi untuk tamu tertentu.
 * Menghindari hardcoded domain dan memastikan segmen `/to/{nama}` selalu ter-encode dengan aman.
 */
export function buildPersonalInvitationUrl(options: PersonalInvitationUrlOptions): string {
  const {
    identifier,
    publishMode = "path",
    publishUrl,
    guestName,
    fallbackCode = "preview",
  } = options;

  const rawGuest = (guestName || "").trim().replace(/\s+/g, " ");
  const cleanGuest = rawGuest || "Bapak/Ibu/Saudara/i";
  const slug = (identifier || "").trim() || fallbackCode;

  // Jika URL publish kustom sudah ada (misal custom domain atau URL utuh yang tersimpan)
  if (publishUrl && publishUrl.trim()) {
    try {
      const parsed = new URL(publishUrl.trim());
      parsed.pathname = `${parsed.pathname.replace(/\/+$/, "")}/to/${encodeURIComponent(cleanGuest)}`;
      parsed.searchParams.delete("for");
      parsed.searchParams.delete("to");
      return parsed.toString();
    } catch {
      return `${publishUrl.replace(/\/+$/, "")}/to/${encodeURIComponent(cleanGuest)}`;
    }
  }

  // Mode subdomain
  if (publishMode === "subdomain" && slug) {
    return buildSubdomainUrl(slug, cleanGuest);
  }

  // Default mode: path (/i/{slug})
  return buildInvitationUrl(slug, cleanGuest);
}
