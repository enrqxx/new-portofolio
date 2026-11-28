"use client";

/**
 * Hub — layar utama setelah SAVE screen. Pilih kemana mau pergi,
 * seperti memilih aksi di menu battle. Tiap kartu membawa ke route
 * section-nya masing-masing.
 *
 * Baris pembuka dipilih acak dari HUB_LINES setiap kali pemain masuk.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SoulHeart from "@/components/ui/SoulHeart";
import SaveStar from "@/components/ui/SaveStar";
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

export default function Hub({
  active = true,
  onOpenSave,
}: {
  active?: boolean;
  onOpenSave?: () => void;
}) {
  const { play } = useSound();
  const [cursor, setCursor] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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

  const moveCursor = useCallback(
    (index: number) => {
      if (index === cursor) return;
      setCursor(index);
      play("move");
    },
    [cursor, play]
  );

  useEffect(() => {
    if (!active) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const ours =
        !target ||
        target === document.body ||
        (gridRef.current?.contains(target) ?? false);
      if (!ours) return;

      if (e.key === "z" || e.key === "Z" || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) {
          play("select");
          cardRefs.current[cursor]?.click();
        }
        return;
      }

      const cols = getGridCols(gridRef.current);
      const next = nextIndex(cursor, e.key, cols, DESTINATIONS.length);
      if (next === null) return;

      e.preventDefault();
      moveCursor(next);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, cursor, moveCursor, play]);

  return (
    <section className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">WHERE TO?</h2>
        <p className="ut-section__sub">* CHOOSE YOUR PATH</p>
        {onOpenSave && (
          <button
            type="button"
            className="ut-save-point-btn"
            onMouseEnter={() => play("blip")}
            onFocus={() => play("blip")}
            onClick={() => {
              play("save");
              onOpenSave();
            }}
            title="Open SAVE Point"
            aria-label="Open SAVE Point screen"
          >
            <SaveStar size={16} />
            <span>SAVE</span>
          </button>
        )}
      </div>

        <div className="ut-battle-box">
          <div className="ut-battle-box-inner">
            <TypewriterText
              key={line}
              text={line}
              speed={30}
              className="ut-check-text"
            />

            <div className="ut-hub" ref={gridRef}>
              {DESTINATIONS.map((dest, index) => {
                const isActive = cursor === index;
                return (
                  <Link
                    key={dest.href}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    href={dest.href}
                    className={`ut-hub-card ${isActive ? "ut-hub-card--active" : ""}`}
                    onMouseEnter={() => moveCursor(index)}
                    onFocus={() => moveCursor(index)}
                    onClick={() => play("select")}
                  >
                    <span className="ut-hub-card__soul">
                      {isActive && <SoulHeart size={14} animated={false} />}
                    </span>
                    <span className="ut-hub-card__icon">
                      <SoulHeart size={26} animated={isActive} />
                    </span>
                    <span className="ut-hub-card__body">
                      <span className="ut-hub-card__title">{dest.title}</span>
                      <span className="ut-hub-card__desc">{dest.desc}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <p className="ut-section__hint">
          [ ← → ↑ ↓ ] SELECT &nbsp;·&nbsp; [ Z / ENTER ] TRAVEL &nbsp;·&nbsp; [ CLICK ] OPEN
        </p>
    </section>
  );
}

function getGridCols(grid: HTMLElement | null): number {
  if (!grid) return 1;
  const cols = getComputedStyle(grid)
    .gridTemplateColumns.split(" ")
    .filter(Boolean).length;
  return Math.max(1, cols);
}

function nextIndex(
  current: number,
  key: string,
  cols: number,
  total: number
): number | null {
  const col = current % cols;
  switch (key) {
    case "ArrowRight":
      return current + 1 < total ? current + 1 : 0;
    case "ArrowLeft":
      return current - 1 >= 0 ? current - 1 : total - 1;
    case "ArrowDown": {
      const next = current + cols;
      return next < total ? next : col;
    }
    case "ArrowUp": {
      const prev = current - cols;
      if (prev >= 0) return prev;
      return col + Math.floor((total - 1 - col) / cols) * cols;
    }
    default:
      return null;
  }
}
