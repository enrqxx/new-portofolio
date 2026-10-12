"use client";

/**
 * SAVE screen pembuka — meniru save point Undertale.
 *
 * Tampilkan teks "* You're filled with DETERMINATION." lalu menu
 * SAVE / CONTINUE / RESET. Navigasi pakai arrow keys + Z/Enter,
 * persis seperti game-nya. Mouse juga didukung.
 */

import { useCallback, useEffect, useState } from "react";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER, SAVE_SCREEN } from "@/lib/data";

const OPTIONS = [
  { id: "continue", label: "CONTINUE" },
  { id: "save", label: "SAVE" },
  { id: "reset", label: "RESET" },
] as const;

type OptionId = (typeof OPTIONS)[number]["id"];

export default function SaveScreen({ onEnter }: { onEnter: () => void }) {
  const { play } = useSound();
  const [phase, setPhase] = useState<"intro" | "menu">("intro");
  const [selected, setSelected] = useState<OptionId>("continue");
  const [leaving, setLeaving] = useState(false);

  const select = useCallback(
    (id: OptionId) => {
      if (id !== selected) {
        setSelected(id);
        play("move");
      }
    },
    [selected, play]
  );

  const confirm = useCallback(
    (id: OptionId) => {
      if (leaving) return;
      play("save");
      setLeaving(true);
      // Sedikit jeda biar suara save sempat terdengar, lalu masuk ke portfolio.
      setTimeout(onEnter, 700);
      // "RESET" memakai nada berbeda
      if (id === "reset") play("hurt");
    },
    [leaving, play, onEnter]
  );

  // Navigasi keyboard ala Undertale: arrow kiri/kanan, Z/Enter konfirmasi
  useEffect(() => {
    if (phase !== "menu") return;

    const handleKey = (e: KeyboardEvent) => {
      const currentIndex = OPTIONS.findIndex((o) => o.id === selected);

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = OPTIONS[(currentIndex + 1) % OPTIONS.length];
        select(next.id);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = OPTIONS[(currentIndex - 1 + OPTIONS.length) % OPTIONS.length];
        select(prev.id);
      } else if (e.key === "z" || e.key === "Z" || e.key === "Enter") {
        e.preventDefault();
        confirm(selected);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, selected, select, confirm]);

  return (
    <div
      className={`ut-save-screen ${leaving ? "ut-save-screen--leaving" : ""}`}
      role="dialog"
      aria-label="Save screen"
    >
      <div className="ut-save-screen__content">
        {phase === "intro" ? (
          <div className="ut-save-screen__intro">
            <TypewriterText
              text={SAVE_SCREEN.determination}
              speed={55}
              className="ut-save-screen__text"
              onComplete={() => {
                play("select");
                setPhase("menu");
              }}
            />
          </div>
        ) : (
          <div className="ut-save-screen__menu">
            <div className="ut-save-screen__heart-wrap">
              <SoulHeart size={40} />
            </div>

            <p className="ut-save-screen__name">* {PLAYER.name}</p>
            <p className="ut-save-screen__role">{PLAYER.role.toUpperCase()}</p>

            <div className="ut-save-screen__divider" />

            <p className="ut-save-screen__prompt">{SAVE_SCREEN.prompt}</p>

            <div className="ut-save-screen__options">
              {OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ut-save-option ${selected === option.id ? "ut-save-option--active" : ""}`}
                  onMouseEnter={() => select(option.id)}
                  onFocus={() => select(option.id)}
                  onClick={() => confirm(option.id)}
                >
                  <span className="ut-save-option__soul">
                    {selected === option.id && <SoulHeart size={14} animated={false} />}
                  </span>
                  <span className="ut-save-option__label">{option.label}</span>
                </button>
              ))}
            </div>

            <p className="ut-save-screen__hint">
              [ ARROW KEYS ] SELECT &nbsp;·&nbsp; [ Z / ENTER ] CONFIRM
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
