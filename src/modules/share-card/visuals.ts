import type { InvitationShareData } from "./invitation-share-data";

const CARD_ACCENTS: Record<string, { background: string; ornament: string }> = {
  "wedding-eternal-orbit": { background: "#151326", ornament: "#c9a867" },
  "wedding-verdant-vows": { background: "#18382e", ornament: "#d9b96e" },
  "wedding-avant-vows": { background: "#171717", ornament: "#e7d6b5" },
  "wedding-lampung-elegance": { background: "#4a1720", ornament: "#e3b65b" },
  "birthday-celestial": { background: "#271a4a", ornament: "#f0be5c" },
  "khitan-ksatria-jawa": { background: "#402a1c", ornament: "#d6a750" },
  "aqiqah-little-bloom": { background: "#315e4d", ornament: "#e1bd72" },
  "wisuda-elegance": { background: "#102f52", ornament: "#dfb861" },
};

export function getShareCardVisual(data: InvitationShareData) {
  if (data.cardStyle.styleId === "template") {
    return {
      background: data.colors.dark,
      ornament: data.colors.accent,
    };
  }
  return CARD_ACCENTS[data.templateId] ?? {
    background: data.colors.dark,
    ornament: data.colors.accent,
  };
}
