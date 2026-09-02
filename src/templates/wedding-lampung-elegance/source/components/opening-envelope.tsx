import Image from "next/image";

export type OpeningStage = "sealed" | "flap" | "letter" | "hold" | "leaving" | "opened";

type OpeningEnvelopeProps = {
  guestName: string;
  onOpen: () => void;
  stage: OpeningStage;
};

export function OpeningEnvelope({ guestName, onOpen, stage }: OpeningEnvelopeProps) {
  const isOpening = stage !== "sealed";

  return (
    <div className={`opening-screen stage-${stage}`} data-template-section="opening-envelope">
      <div className="opening-glow" />
      <div className="opening-halo opening-halo-one" aria-hidden="true" />
      <div className="opening-halo opening-halo-two" aria-hidden="true" />
      <Image
        className="opening-flower opening-flower-left"
        src="/assets/flower-green.svg"
        alt=""
        width={477}
        height={451}
        priority
      />
      <Image
        className="opening-flower opening-flower-right"
        src="/assets/flower-green.svg"
        alt=""
        width={477}
        height={451}
        priority
      />
      <div className="opening-sparkles" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <i key={index}>✦</i>)}
      </div>

      <header className="opening-title">
        <span className="opening-eyebrow">Dengan penuh kebahagiaan</span>
        <p>The Wedding of</p>
        <h1>Ayu <b>&</b> Ardi</h1>
        <span className="opening-date">26 · 09 · 2026</span>
      </header>

      <div className="envelope-scene" aria-label="Amplop undangan untuk dibuka">
        <div className="envelope-shadow" />
        <div className="envelope">
          <div className="envelope-back" />
          <div className="invitation-letter">
            <small className="letter-kicker">The Wedding of</small>
            <b className="letter-couple">Ayu <i>&</i> Ardi</b>
            <span className="letter-to">Kepada Yth.</span>
            <strong className="letter-guest">{guestName}</strong>
            <em>26 · 09 · 2026</em>
          </div>
          <div className="envelope-front-left" />
          <div className="envelope-front-right" />
          <div className="envelope-front-bottom" />
          <div className="envelope-pattern" aria-hidden="true" />
          <div className="envelope-flap" />
          <div className="envelope-address">
            <small>Kepada Yth.</small>
            <strong>{guestName}</strong>
          </div>
          <button
            className="wax-seal"
            onClick={onOpen}
            aria-label="Klik segel untuk membuka undangan"
            disabled={isOpening}
          >
            <span className="seal-monogram">A <i>&</i> A</span>
            <small>Buka</small>
          </button>
          <button
            className="seal-callout"
            id="seal-instruction"
            type="button"
            onClick={onOpen}
            disabled={isOpening}
            aria-label="Klik di sini untuk membuka undangan"
          >
            <i aria-hidden="true">👈</i>
            <span><b>Klik di sini</b><small>untuk membuka</small></span>
          </button>
        </div>
      </div>

      <p className="opening-footer-note">Sebuah undangan istimewa untuk Anda</p>
    </div>
  );
}
