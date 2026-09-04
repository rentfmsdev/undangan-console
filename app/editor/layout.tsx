import { Cormorant_Garamond, Dancing_Script, Great_Vibes, Manrope } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-dancing-script",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export default function EditorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${cormorant.variable} ${greatVibes.variable} ${dancingScript.variable} ${manrope.variable}`}>
      {children}
    </div>
  );
}
