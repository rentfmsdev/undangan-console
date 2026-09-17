export const ADMIN_WHATSAPP_NUMBER = "6285166324727";

export function makeAdminWhatsAppUrl(message: string) {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
