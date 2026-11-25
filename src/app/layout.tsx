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
    "An Undertale-themed portfolio by Yusyfi, Web & Mobile Developer. CHECK the about, inspect the STATS, encounter PROJECTS, walk the JOURNEY, and show some MERCY.",
  keywords: ["portfolio", "undertale", "web developer", "mobile developer", "next.js"],
  openGraph: {
    title: "Yusyfi — Portfolio | Filled with DETERMINATION",
    description:
      "An Undertale-themed interactive developer portfolio featuring procedural Web Audio SFX and a playable secret boss.",
    type: "website",
    images: [
      {
        url: "/img/avatar.jpeg",
        alt: "Yusyfi — Web & Mobile Developer",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Yusyfi — Portfolio | Filled with DETERMINATION",
    description:
      "An Undertale-themed interactive developer portfolio featuring procedural Web Audio SFX and a playable secret boss.",
    images: ["/img/avatar.jpeg"],
  },
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