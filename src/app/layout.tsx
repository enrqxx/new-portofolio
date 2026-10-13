import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { SoundProvider } from "@/components/providers/SoundProvider";
import BgmPlayer from "@/components/BgmPlayer";
import { EncounterProvider } from "@/components/providers/EncounterProvider";
import "./globals.css";

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const terminal = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-terminal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yusyfi — Portfolio | Filled with DETERMINATION",
  description:
    "A Undertale-themed portfolio. CHECK the about, inspect the STATS, encounter PROJECTS, walk the JOURNEY, and show some MERCY.",
  keywords: ["portfolio", "undertale", "web developer", "next.js"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${terminal.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SoundProvider>
          <BgmPlayer />
          <EncounterProvider>{children}</EncounterProvider>
        </SoundProvider>
      </body>
    </html>
  );
}