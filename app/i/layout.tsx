import { Cormorant_Garamond, Dancing_Script, Great_Vibes, Manrope } from "next/font/google";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes", display: "swap" });
const monogram = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-dancing-script", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export default function PublicWeddingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${serif.variable} ${script.variable} ${monogram.variable} ${sans.variable}`}
      style={
        {
          "--font-serif": "var(--font-cormorant)",
          "--font-script": "var(--font-great-vibes)",
          "--font-monogram": "var(--font-dancing-script)",
          "--font-sans": "var(--font-manrope)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
