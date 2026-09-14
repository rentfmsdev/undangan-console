import type { InvitationShareData } from "./invitation-share-data";
import { getShareCardVisual } from "./visuals";

function detailLine(data: InvitationShareData) {
  return [data.eventDate, data.primaryTime, data.venue || data.address].filter(Boolean).join("  •  ");
}

export function renderShareCard(data: InvitationShareData) {
  const { cardStyle } = data;
  const accent = getShareCardVisual(data);
  const details = [
    cardStyle.showDate ? [data.eventDate, data.primaryTime].filter(Boolean).join("  •  ") : "",
    cardStyle.showVenue ? data.venue || data.address : "",
  ].filter(Boolean).join("  •  ");
  const background = cardStyle.backgroundMode === "solid"
    ? cardStyle.colors?.background || accent.background
    : accent.background;
  const textColor = cardStyle.colors?.text || data.colors.cream;
  const ornament = cardStyle.colors?.accent || accent.ornament;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background,
        color: textColor,
        fontFamily: "Georgia, serif",
      }}
    >
      {cardStyle.backgroundMode === "photo" && cardStyle.imageUrl ? <img src={cardStyle.imageUrl} alt="" width="1200" height="630" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "flex" }} /> : null}
      {cardStyle.backgroundMode === "photo" && cardStyle.imageUrl ? <div style={{ position: "absolute", inset: 0, background: accent.background, opacity: cardStyle.overlayOpacity, display: "flex" }} /> : null}
      {cardStyle.styleId !== "minimal" ? <><div style={{ position: "absolute", width: 820, height: 820, borderRadius: 9999, border: `2px solid ${ornament}`, opacity: 0.18, right: -260, top: -380, display: "flex" }} /><div style={{ position: "absolute", width: 560, height: 560, borderRadius: 9999, border: `2px solid ${ornament}`, opacity: 0.16, left: -210, bottom: -360, display: "flex" }} /></> : null}
      {cardStyle.styleId === "elegant" ? <div style={{ position: "absolute", left: 44, right: 44, top: 42, bottom: 42, border: `1px solid ${ornament}`, opacity: 0.62, display: "flex" }} /> : null}
      <div style={{ flex: 1, padding: "118px 104px 96px", display: "flex", flexDirection: "column", alignItems: cardStyle.textAlign === "left" ? "flex-start" : "center", textAlign: cardStyle.textAlign }}>
        <div style={{ display: "flex", fontFamily: "Arial, sans-serif", fontSize: 19, letterSpacing: 5, color: ornament, marginBottom: 16 }}>
          {data.categoryLabel.toUpperCase()}
        </div>
        <div style={{ display: "flex", maxWidth: 900, fontFamily: data.displayFont, fontSize: data.subject.length > 34 ? 48 : 60, fontWeight: 400, lineHeight: 1.08, color: textColor, textAlign: cardStyle.textAlign, wordBreak: "break-word" }}>
          {data.subject}
        </div>
        <div style={{ display: "flex", height: 1, width: 140, background: ornament, marginTop: 32, marginBottom: 28 }} />
        {cardStyle.showGuestName ? <><div style={{ display: "flex", fontFamily: "Arial, sans-serif", fontSize: 20, letterSpacing: 6, color: ornament, marginBottom: 16 }}>
          KEPADA YTH.
        </div><div style={{ display: "flex", maxWidth: 900, fontSize: data.guestName.length > 34 ? 43 : 52, fontWeight: 700, color: textColor, marginBottom: 24, textAlign: cardStyle.textAlign, wordBreak: "break-word" }}>
          {data.guestName}
        </div></> : null}
        {details ? (
          <div style={{ display: "flex", maxWidth: 900, marginTop: 34, fontFamily: "Arial, sans-serif", fontSize: 22, lineHeight: 1.35, color: textColor, opacity: 0.88 }}>
            {details}
          </div>
        ) : null}
      </div>
    </div>
  );
}
