import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undangan Studio",
  description: "Platform marketplace dan editor undangan digital modular.",
  icons: {
    icon: "/assets/fav.png",
    shortcut: "/assets/fav.png",
    apple: "/assets/fav.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
