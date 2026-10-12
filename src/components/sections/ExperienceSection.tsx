"use client";

/**
 * Section JOURNEY — riwayat pendidikan/pekerjaan dalam bentuk dialog box
 * berurutan, seperti teks story Undertale. Nav antar entri pakai arrow,
 * mirip membolak-balik halaman dialog.
 */

import { useCallback, useEffect, useState } from "react";
import BattleBox from "@/components/ui/BattleBox";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { JOURNEY } from "@/lib/data";

export default function ExperienceSection() {
  const { play } = useSound();
  const [index, setIndex] = useState(0);
  const entry = JOURNEY[index];

  const moveTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(JOURNEY.length - 1, next));
      if (clamped !== index) {
        setIndex(clamped);
        play("move");
      }
    },
    [index, play]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el.tagName !== "BODY") return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        moveTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        moveTo(index - 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, moveTo]);

  return (
    <section id="experience" className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">JOURNEY</h2>
        <p className="ut-section__sub">* EXPERIENCE</p>
      </div>

      <BattleBox>
        {/* Timeline pips */}
        <div className="ut-journey-pips">
          {JOURNEY.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`ut-pip ${i === index ? "ut-pip--active" : ""} ${
                i < index ? "ut-pip--done" : ""
              }`}
              onMouseEnter={() => moveTo(i)}
              onFocus={() => moveTo(i)}
              onClick={() => moveTo(i)}
              aria-label={`${item.year} — ${item.title}`}
            >
              {i === index && <SoulHeart size={9} animated={false} />}
            </button>
          ))}
        </div>

        <div className="ut-journey-entry">
          <div className="ut-journey-head">
            <span className="ut-journey-year">{entry.year}</span>
            <span className="ut-journey-title">{entry.title}</span>
          </div>
          <p className="ut-journey-place">* {entry.place}</p>
          <TypewriterText
            key={entry.id}
            text={entry.text}
            speed={24}
            className="ut-check-text"
          />
        </div>

        <div className="ut-journey-nav">
          <button
            type="button"
            className="ut-nav-btn"
            onMouseEnter={() => play("blip")}
            onClick={() => moveTo(index - 1)}
            disabled={index === 0}
          >
            ◀ PREV
          </button>
          <span className="ut-journey-count">
            {index + 1} / {JOURNEY.length}
          </span>
          <button
            type="button"
            className="ut-nav-btn"
            onMouseEnter={() => play("blip")}
            onClick={() => moveTo(index + 1)}
            disabled={index === JOURNEY.length - 1}
          >
            NEXT ▶
          </button>
        </div>
      </BattleBox>
    </section>
  );
}
