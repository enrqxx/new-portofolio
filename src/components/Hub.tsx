"use client";

/**
 * Hub — layar utama setelah SAVE screen. Pilih kemana mau pergi,
 * seperti memilih aksi di menu battle. Tiap kartu membawa ke route
 * section-nya masing-masing.
 *
 * Baris pembuka dipilih acak dari HUB_LINES setiap kali pemain masuk.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER, randomHubLine } from "@/lib/data";

const DESTINATIONS = [
  {
    href: "/about",
    title: "CHECK",
    desc: "* About — who you're dealing with",
  },
  {
    href: "/skills",
    title: "STATS",
    desc: "* Skills — inspect the inventory",
  },
  {
    href: "/projects",
    title: "ENCOUNTERS",
    desc: "* Projects — foes to be faced",
  },
  {
    href: "/experience",
    title: "JOURNEY",
    desc: "* Experience — the story so far",
  },
  {
    href: "/contact",
    title: "MERCY",
    desc: "* Contact — spare a hello",
  },
  {
    href: "/roar",
    title: "THE ROAR",
    desc: "* Secret boss — survive the knight",
  },
] as const;

export default function Hub() {
  const { play } = useSound();
  // Baris acak dipilih setelah mount agar server & client render sama
  // (menghindari hydration mismatch), tapi baru kelihatan setelah masuk.
  const [line, setLine] = useState(
    `* ${PLAYER.name} stands at a crossroads. Where will you go?`
  );

  // Pakai flag mounted: setState hanya terjadi satu kali, dipicu oleh
  // perubahan state (bukan langsung di body effect).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) setLine(randomHubLine());
  }, [mounted]);

  return (
    <section className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">WHERE TO?</h2>
        <p className="ut-section__sub">* CHOOSE YOUR PATH</p>
      </div>

        <div className="ut-battle-box">
          <div className="ut-battle-box-inner">
            <TypewriterText
              key={line}
              text={line}
              speed={30}
              className="ut-check-text"
            />

            <div className="ut-hub">
              {DESTINATIONS.map((dest) => (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className="ut-hub-card"
                  onMouseEnter={() => play("move")}
                  onFocus={() => play("move")}
                >
                  <span className="ut-hub-card__soul">
                    <SoulHeart size={14} animated={false} />
                  </span>
                  <span className="ut-hub-card__icon">
                    <SoulHeart size={26} animated={false} />
                  </span>
                  <span className="ut-hub-card__body">
                    <span className="ut-hub-card__title">{dest.title}</span>
                    <span className="ut-hub-card__desc">{dest.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="ut-section__hint">
          [ CLICK A CARD ] TRAVEL &nbsp;·&nbsp; [ BACK ] RETURN HERE
        </p>
    </section>
  );
}
