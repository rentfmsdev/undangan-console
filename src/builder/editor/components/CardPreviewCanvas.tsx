"use client";

import type { InvitationShareData } from "@/modules/share-card/invitation-share-data";
import { getShareCardVisual } from "@/modules/share-card/visuals";

export function CardPreviewCanvas({ data }: { data: InvitationShareData }) {
  const { cardStyle } = data;
  const visual = getShareCardVisual(data);
  const accent = cardStyle.colors?.accent || visual.ornament;
  const text = cardStyle.colors?.text || data.colors.cream;
  const background = cardStyle.backgroundMode === "solid"
    ? cardStyle.colors?.background || visual.background
    : visual.background;
  const displayFont = data.displayFont === "Great Vibes"
    ? "var(--font-great-vibes), cursive"
    : data.displayFont === "Dancing Script"
      ? "var(--font-dancing-script), cursive"
      : "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
  const subjectSize = data.subject.length > 34
    ? "text-[clamp(24px,3vw,48px)]"
    : "text-[clamp(28px,3.75vw,60px)]";
  const guestSize = data.guestName.length > 34
    ? "text-[clamp(24px,2.7vw,43px)]"
    : "text-[clamp(30px,3.25vw,52px)]";
  const details = [cardStyle.showDate ? [data.eventDate, data.primaryTime].filter(Boolean).join(" • ") : "", cardStyle.showVenue ? data.venue || data.address : ""].filter(Boolean).join(" • ");
  return <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-[22px] border border-slate-300 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,.2)]" style={{ background }}>
    {cardStyle.backgroundMode === "photo" && cardStyle.imageUrl ? <><img src={cardStyle.imageUrl} alt="Latar kartu" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0" style={{ background: visual.background, opacity: cardStyle.overlayOpacity }} /></> : null}
    {cardStyle.styleId !== "minimal" && <><span className="absolute -right-[22%] -top-[75%] h-[130%] w-[65%] rounded-full border opacity-25" style={{ borderColor: accent }} /><span className="absolute -bottom-[80%] -left-[20%] h-[110%] w-[58%] rounded-full border opacity-20" style={{ borderColor: accent }} /></>}
    {cardStyle.styleId === "elegant" && <span className="absolute inset-[3.5%] border opacity-70" style={{ borderColor: accent }} />}
    <div className={`relative flex h-full flex-col px-[8.7%] pb-[8%] pt-[9.85%] ${cardStyle.textAlign === "left" ? "items-start text-left" : "items-center text-center"}`} style={{ color: text }}>
      <div className={`flex w-full flex-1 flex-col justify-start ${cardStyle.textAlign === "left" ? "items-start" : "items-center"}`}>
        <span className="font-sans text-[clamp(11px,1.2vw,19px)] font-bold tracking-[.32em]" style={{ color: accent }}>{data.categoryLabel.toUpperCase()}</span>
        <strong className={`mt-[1.5%] max-w-[90%] break-words font-normal leading-[1.04] ${subjectSize}`} style={{ fontFamily: displayFont }}>{data.subject}</strong>
        <span className="mb-[3.3%] mt-[3.7%] h-px w-[14%]" style={{ background: accent }} />
        {cardStyle.showGuestName && <><span className="font-sans text-[clamp(11px,1.25vw,20px)] font-bold tracking-[.34em]" style={{ color: accent }}>KEPADA YTH.</span><span className={`mt-[1.5%] max-w-[90%] break-words font-bold ${guestSize}`}>{data.guestName}</span></>}
        {details && <span className="mt-[2.8%] max-w-[88%] font-sans text-[clamp(12px,1.4vw,22px)] leading-relaxed opacity-90">{details}</span>}
      </div>
    </div>
  </div>;
}
