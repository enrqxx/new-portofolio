"use client";

/**
 * SAVE screen pembuka — meniru save point Undertale.
 *
 * Tampilkan teks "* You're filled with DETERMINATION." lalu menu
 * SAVE / CONTINUE / RESET. Navigasi pakai arrow keys + Z/Enter,
 * persis seperti game-nya. Mouse juga didukung.
 *
 * RESET memicu animasi Game Over (soul pecah + "STAY DETERMINED!"),
 * lalu kembali ke menu SAVE screen.
 *
 * CONTINUE memicu transisi encounter ala Undertale: layar berkedip
 * (invert) dua kali → "!" muncul → soul meluncur ke posisi hati di
 * HUD (kiri bawah) → masuk ke portfolio.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import GameOver, { type Phase as GameOverPhase } from "@/components/GameOver";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER, SAVE_SCREEN } from "@/lib/data";

const OPTIONS = [
  { id: "continue", label: "CONTINUE" },
  { id: "save", label: "SAVE" },
  { id: "reset", label: "RESET" },
] as const;

// Timing animasi keluar
const SAVE_HOLD_MS = 1100; // kuning + "File saved." sebelum fade
const LEAVE_MS = 700; // durasi fade keluar

// Keyframes & warna kuning dibuat di sini supaya tidak bergantung CSS eksternal.
const SAVED_CSS = `
.ut-save-screen--saved .ut-save-screen__content,
.ut-save-screen--saved .ut-save-screen__content * {
  color: #ffff00 !important;
  border-color: #ffff00 !important;
}
.ut-save-screen--saved .ut-save-screen__divider { background: #ffff00 !important; }
.ut-save-screen--saved .ut-save-option { cursor: default; }
@keyframes ut-save-soul-blink {
  0%   { filter: none; }
  30%  { filter: brightness(0) invert(1); }
  100% { filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ut-save-screen--saved .ut-save-screen__heart-wrap { animation: none !important; }
}
`;

// Timing transisi encounter (ms). Kedip: 2x dalam 700 ms (< 3 kedip/detik, aman).
const FLASH_MS = 700;
const ALERT_MS = 450;
const FLY_MS = 700;
const LAND_FADE_MS = 200;

const ENCOUNTER_CSS = `
.ut-save-screen.ut-save-screen--encounter {
  animation: ut-encounter-flash ${FLASH_MS}ms steps(1, end) both !important;
}
.ut-save-screen--encounter .ut-save-option { cursor: default; }
@keyframes ut-encounter-flash {
  0%   { filter: invert(1); }
  25%  { filter: none; }
  50%  { filter: invert(1); }
  75%  { filter: none; }
  100% { filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ut-save-screen.ut-save-screen--encounter { animation: none !important; }
}
`;

type EncounterStep = "flash" | "alert" | "fly" | "land";
type SoulPos = { x: number; y: number; s: number }; // s = skala dari ukuran 14px
type Encounter = { step: EncounterStep; from: SoulPos; to: SoulPos };

const BASE_SOUL = 14;

type OptionId = (typeof OPTIONS)[number]["id"];

export default function SaveScreen({ onEnter }: { onEnter: () => void }) {
  const { play } = useSound();
  const [phase, setPhase] = useState<"intro" | "menu" | "gameover">("intro");
  const [selected, setSelected] = useState<OptionId>("continue");
  const [leaving, setLeaving] = useState(false);
  // true setelah SAVE dikonfirmasi: menu jadi kuning + "File saved."
  const [saved, setSaved] = useState(false);
  // transisi encounter setelah CONTINUE dikonfirmasi
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const locked = saved || encounter !== null;
  // key untuk mereset state Game Over tiap kali diputar ulang
  const [gameoverKey, setGameoverKey] = useState(0);

  // Timer animasi keluar, dibersihkan saat unmount
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const select = useCallback(
    (id: OptionId) => {
      if (locked) return;
      if (id !== selected) {
        setSelected(id);
        play("move");
      }
    },
    [selected, locked, play]
  );

  // CONTINUE → transisi encounter
  const startEncounter = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Titik awal: posisi hati di samping opsi aktif
    const fromEl = rootRef.current?.querySelector(
      ".ut-save-option--active .ut-save-option__soul"
    );
    const fr = fromEl?.getBoundingClientRect();
    const from: SoulPos =
      fr && fr.width > 0
        ? { x: fr.left, y: fr.top, s: 1 }
        : { x: vw / 2 - BASE_SOUL / 2, y: vh / 2, s: 1 };

    // Titik tujuan: hati di HUD kiri bawah (stage masih opacity 0 tapi sudah punya layout)
    const toEl = document.querySelector(".ut-float-hp__soul svg");
    const tr = toEl?.getBoundingClientRect();
    const to: SoulPos =
      tr && tr.width > 0
        ? { x: tr.left, y: tr.top, s: tr.width / BASE_SOUL }
        : { x: 26, y: vh - 40, s: 16 / BASE_SOUL };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flash = reduceMotion ? 0 : FLASH_MS;

    play("encounter");
    setEncounter({ step: reduceMotion ? "alert" : "flash", from, to });

    const t1 = flash;
    const t2 = t1 + ALERT_MS;
    const t3 = t2 + FLY_MS;
    const t4 = t3 + 100;

    timers.current.push(
      setTimeout(() => {
        play("alert");
        setEncounter((e) => (e ? { ...e, step: "alert" } : e));
      }, t1),
      setTimeout(() => {
        play("fall");
        setEncounter((e) => (e ? { ...e, step: "fly" } : e));
      }, t2),
      setTimeout(() => setEncounter((e) => (e ? { ...e, step: "land" } : e)), t3),
      setTimeout(onEnter, t4 + LAND_FADE_MS)
    );
  }, [play, onEnter]);

  const confirm = useCallback(
    (id: OptionId) => {
      if (leaving || locked) return;

      // RESET → animasi Game Over, lalu balik ke menu
      if (id === "reset") {
        play("hurt"); // HP habis, seperti di game
        setGameoverKey((k) => k + 1);
        setPhase("gameover");
        return;
      }

      // CONTINUE → transisi encounter
      if (id === "continue") {
        startEncounter();
        return;
      }

      play("save");

      // SAVE → teks kuning + "File saved.", tahan sebentar, baru fade keluar
      if (id === "save") {
        setSaved(true);
        timers.current.push(
          setTimeout(() => setLeaving(true), SAVE_HOLD_MS),
          setTimeout(onEnter, SAVE_HOLD_MS + LEAVE_MS)
        );
        return;
      }
    },
    [leaving, locked, play, onEnter, startEncounter]
  );

  // Suara disinkronkan dengan tiap fase animasi Game Over:
  // hurt (klik RESET) → crack → shatter → jingle saat teks muncul
  const handleGameOverPhase = useCallback(
    (p: GameOverPhase) => {
      if (p === "crack") play("crack");
      else if (p === "shatter") play("shatter");
      else if (p === "text") play("gameover");
    },
    [play]
  );

  // Game Over selesai → kembali ke menu SAVE
  const handleGameOverDone = useCallback(() => {
    setSelected("continue");
    setPhase("menu");
  }, []);

  // Intro selesai → tampilkan menu
  const handleIntroComplete = useCallback(() => {
    play("select");
    setPhase("menu");
  }, [play]);

  // Navigasi keyboard ala Undertale: arrow kiri/kanan, Z/Enter konfirmasi
  useEffect(() => {
    if (phase !== "menu" || locked) return;

    const handleKey = (e: KeyboardEvent) => {
      // Abaikan tombol yang ditahan & kombinasi modifier (Ctrl+Z, dll.)
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

      const currentIndex = OPTIONS.findIndex((o) => o.id === selected);

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        select(OPTIONS[(currentIndex + 1) % OPTIONS.length].id);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        select(OPTIONS[(currentIndex - 1 + OPTIONS.length) % OPTIONS.length].id);
      } else if (e.key === "z" || e.key === "Z" || e.key === "Enter") {
        e.preventDefault();
        confirm(selected);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, locked, selected, select, confirm]);

  if (phase === "gameover") {
    return (
      <GameOver
        key={gameoverKey}
        onPhase={handleGameOverPhase}
        onDone={handleGameOverDone}
      />
    );
  }

  const soulInFlight = encounter !== null && encounter.step !== "flash";
  const menuFaded = encounter?.step === "fly" || encounter?.step === "land";

  return (
    <>
    <div
      ref={rootRef}
      className={`ut-save-screen ${saved ? "ut-save-screen--saved" : ""} ${encounter ? "ut-save-screen--encounter" : ""} ${leaving ? "ut-save-screen--leaving" : ""}`}
      role="dialog"
      aria-label="Save screen"
    >
      <style>{SAVED_CSS + ENCOUNTER_CSS}</style>
      <div
        className="ut-save-screen__content"
        style={{
          opacity: menuFaded ? 0 : 1,
          transition: menuFaded ? "opacity 250ms linear" : undefined,
        }}
      >
        {phase === "intro" ? (
          <div className="ut-save-screen__intro">
            <TypewriterText
              text={SAVE_SCREEN.determination}
              speed={55}
              className="ut-save-screen__text"
              onComplete={handleIntroComplete}
            />
          </div>
        ) : (
          <div className="ut-save-screen__menu">
            <div
              className="ut-save-screen__heart-wrap"
              style={saved ? { animation: "ut-save-soul-blink 0.15s steps(2) 1" } : undefined}
            >
              <SoulHeart size={40} />
            </div>

            <p className="ut-save-screen__name">* {PLAYER.name}</p>
            <p className="ut-save-screen__role">{PLAYER.role.toUpperCase()}</p>

            <div className="ut-save-screen__divider" />

            {saved ? (
              <TypewriterText
                key="saved"
                text="* File saved."
                speed={55}
                className="ut-save-screen__prompt"
              />
            ) : (
              <p className="ut-save-screen__prompt">{SAVE_SCREEN.prompt}</p>
            )}

            <div className="ut-save-screen__options">
              {OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={locked}
                  className={`ut-save-option ${selected === option.id ? "ut-save-option--active" : ""}`}
                  onMouseEnter={() => select(option.id)}
                  onFocus={() => select(option.id)}
                  onClick={() => confirm(option.id)}
                >
                  <span className="ut-save-option__soul">
                    {selected === option.id && !soulInFlight && (
                      <SoulHeart size={14} animated={false} />
                    )}
                  </span>
                  <span className="ut-save-option__label">{option.label}</span>
                </button>
              ))}
            </div>

            <p className="ut-save-screen__hint" style={locked ? { visibility: "hidden" } : undefined}>
              [ ARROW KEYS ] SELECT &nbsp;·&nbsp; [ Z / ENTER ] CONFIRM
            </p>
          </div>
        )}
      </div>
    </div>

    {encounter && (
      <EncounterOverlay encounter={encounter} />
    )}
    </>
  );
}

/**
 * Soul + tanda seru encounter. Berada di luar .ut-save-screen supaya
 * tidak ikut ter-invert saat layar berkedip.
 */
function EncounterOverlay({ encounter }: { encounter: Encounter }) {
  const { step, from, to } = encounter;
  const pos = step === "fly" || step === "land" ? to : from;

  const transition =
    step === "fly"
      ? `transform ${FLY_MS}ms cubic-bezier(0.45, 0, 0.9, 0.55)`
      : step === "land"
        ? `opacity ${LAND_FADE_MS}ms linear`
        : "none";

  return (
    <>
      {step === "alert" && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: from.x + BASE_SOUL / 2,
            top: from.y - 34,
            transform: "translateX(-50%)",
            zIndex: 1050,
            color: "#fff",
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          !
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1050,
          width: BASE_SOUL,
          height: BASE_SOUL,
          transformOrigin: "0 0",
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s})`,
          opacity: step === "land" ? 0 : 1,
          transition,
          pointerEvents: "none",
        }}
      >
        <SoulHeart size={BASE_SOUL} animated={false} />
      </div>
    </>
  );
}