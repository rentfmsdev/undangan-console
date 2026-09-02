"use client";
/* eslint-disable @next/next/no-img-element -- preview membutuhkan gambar yang mengikuti container scroll perangkat. */

import type { EditablePreviewSection } from "@/builder/editor/preview-types";
import styles from "./preview.module.css";

type PreviewProps = {
  sections: EditablePreviewSection[];
  selectedId: string;
  onSelect: (id: string) => void;
  themeId: string;
  backgroundColor: string;
};

function dataFor(sections: EditablePreviewSection[], type: string) {
  return sections.find((section) => section.type === type && section.enabled);
}

export function WeddingLampungPreview({ sections, selectedId, onSelect, themeId, backgroundColor }: PreviewProps) {
  const hero = dataFor(sections, "hero");
  const couple = dataFor(sections, "couple");
  const event = dataFor(sections, "event");
  const unduh = dataFor(sections, "unduh-mantu");
  const gallery = dataFor(sections, "gallery");
  const quote = dataFor(sections, "quote");
  const gift = dataFor(sections, "gift");
  const closing = dataFor(sections, "closing");
  const select = (section?: EditablePreviewSection) => section && onSelect(section.id);

  return <div className={`${styles.invitation} ${styles[`theme${themeId.replaceAll("-", "")}`] ?? ""}`} style={{ "--custom-background": backgroundColor } as React.CSSProperties}>
    {hero && <button id={`preview-${hero.id}`} type="button" onClick={() => select(hero)} className={`${styles.hero} ${selectedId === hero.id ? styles.selected : ""}`}>
      <img src="/assets/my/DSC_0680%20(2).jpg.jpeg" alt="" /><span className={styles.heroShade} /><span className={styles.heroFrame} />
      <span className={styles.monogram}>A <i>&</i> A</span><span className={styles.heroBody}><small>The Wedding of</small><b>{hero.data.title}</b><em>{hero.data.subtitle}</em><span>♡ &nbsp; 🕊 &nbsp; ♡</span><strong>Kepada Yth.<i>Bapak/Ibu/Saudara/i</i></strong></span>
    </button>}
    {couple && <button id={`preview-${couple.id}`} type="button" onClick={() => select(couple)} className={`${styles.paper} ${selectedId === couple.id ? styles.selected : ""}`}>
      <img className={styles.cornerFlower} src="/assets/flower-green.svg" alt="" /><p className={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p><p className={styles.greeting}>Assalamu&apos;alaikum Warahmatullahi Wabarakatuh</p><p className={styles.copy}>Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.</p><img className={styles.portrait} src="/assets/my/DSC_0701%20(1).jpg.jpeg" alt="" /><p className={styles.eyebrow}>The Bride & Groom</p><h2>{couple.data.title}</h2><p className={styles.copy}>{couple.data.subtitle}</p>
    </button>}
    {event && <button id={`preview-${event.id}`} type="button" onClick={() => select(event)} className={`${styles.events} ${selectedId === event.id ? styles.selected : ""}`}><img src="/assets/flower-green.svg" alt="" /><p>Rangkaian Acara</p><h2>{event.data.title}</h2><span className={styles.divider}>✦</span><b>{event.data.subtitle}</b><div className={styles.eventCards}><article><small>♡</small><h3>Akad Nikah</h3><span>08.00 WIB s.d selesai</span></article><article><small>⌁</small><h3>Resepsi</h3><span>10.00 – 14.00 WIB</span></article></div><footer>Dusun Srimenanti, Pesawaran, Lampung</footer></button>}
    {unduh && <button id={`preview-${unduh.id}`} type="button" onClick={() => select(unduh)} className={`${styles.unduh} ${selectedId === unduh.id ? styles.selected : ""}`}><img src="/assets/divider-tapis.svg" alt="" /><p>Acara Tambahan</p><h2>{unduh.data.title}</h2><b>{unduh.data.subtitle}</b><span>Desa Sinar Seputih · Lampung Tengah</span></button>}
    {gallery && <button id={`preview-${gallery.id}`} type="button" onClick={() => select(gallery)} className={`${styles.gallery} ${selectedId === gallery.id ? styles.selected : ""}`}><p>Galeri Bahagia</p><h2>{gallery.data.title}</h2><div>{["DSC_0680%20(2).jpg.jpeg", "DSC_0838%20(1).jpg.jpeg", "DSC_0711%20(1).jpg.jpeg", "DSC_0872%20(1).jpg.jpeg"].map((image) => <img key={image} src={`/assets/my/${image}`} alt="" />)}</div></button>}
    {quote && <button id={`preview-${quote.id}`} type="button" onClick={() => select(quote)} className={`${styles.quote} ${selectedId === quote.id ? styles.selected : ""}`}><img src="/assets/my/DSC_0889%20(1).jpg.jpeg" alt="" /><span /><blockquote>“{quote.data.title}”<small>{quote.data.subtitle}</small></blockquote></button>}
    {gift && <button id={`preview-${gift.id}`} type="button" onClick={() => select(gift)} className={`${styles.gift} ${selectedId === gift.id ? styles.selected : ""}`}><p>{gift.data.title}</p><h2>{gift.data.subtitle}</h2><article>Bank BRI<br /><b>0000 0000 0000</b><small>a.n. Dwi Wahyulita</small></article></button>}
    {closing && <button id={`preview-${closing.id}`} type="button" onClick={() => select(closing)} className={`${styles.closing} ${selectedId === closing.id ? styles.selected : ""}`}><img src="/assets/my/DSC_0680%20(2).jpg.jpeg" alt="" /><span /><p>{closing.data.title}</p><h2>{closing.data.subtitle}</h2></button>}
  </div>;
}
