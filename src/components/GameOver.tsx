"use client";

/**
 * Game Over ala Undertale — diputar saat pemain memilih RESET.
 *
 * Urutannya meniru game over asli:
 * 1. Soul hati muncul di tengah, bergetar (shake)
 * 2. Soul retak jadi dua (crack)
 * 3. Soul pecah menjadi serpihan yang berhamburan (shatter)
 * 4. Layar gelap, lalu muncul teks "* You cannot give up just yet..."
 *    kemudian "STAY DETERMINED!"
 * 5. Kembali ke SAVE screen (di-handle parent lewat onDone)
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type Phase = "shake" | "crack" | "shatter" | "dark" | "text";

const SHARDS = Array.from({ length: 9 }, (_, i) => i);

// Timeline (ms sejak mount). Ubah di satu tempat ini saja.
const TIMELINE: { phase: Phase; at: number }[] = [
  { phase: "crack", at: 900 },
  { phase: "shatter", at: 1500 },
  { phase: "dark", at: 2700 },
  { phase: "text", at: 3600 },
];
const DONE_AT = 6800;

// Shake cepat: hati bergetar acak di sekitar titik tengah layar.
// Tetap di tengah lewat translate(-50%, -50%) di setiap keyframe.
const SHAKE_KEYFRAMES = `
@keyframes ut-soul-shake {
  0%   { transform: translate(-50%, -50%) translate(0, 0); }
  10%  { transform: translate(-50%, -50%) translate(-3px, 2px); }
  20%  { transform: translate(-50%, -50%) translate(3px, -2px); }
  30%  { transform: translate(-50%, -50%) translate(-2px, -3px); }
  40%  { transform: translate(-50%, -50%) translate(3px, 3px); }
  50%  { transform: translate(-50%, -50%) translate(-3px, -1px); }
  60%  { transform: translate(-50%, -50%) translate(2px, 3px); }
  70%  { transform: translate(-50%, -50%) translate(-3px, 2px); }
  80%  { transform: translate(-50%, -50%) translate(3px, -3px); }
  90%  { transform: translate(-50%, -50%) translate(-2px, 1px); }
  100% { transform: translate(-50%, -50%) translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .ut-gameover__soul--shake { animation: none !important; }
}
`;

const SOUL_SHAKE_STYLE: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  color: "#ff0000", // SVG memakai currentColor
  lineHeight: 0,
  // 0.9 detik, 0.06s per putaran = ~15 getaran, tetap jalan sampai fase crack
  animation: "ut-soul-shake 0.06s linear infinite",
};

interface GameOverProps {
  onDone: () => void;
  /** Dipanggil setiap fase berganti (crack, shatter, dark, text) — untuk sinkron suara. */
  onPhase?: (phase: Phase) => void;
}

export default function GameOver({ onDone, onPhase }: GameOverProps) {
  const [phase, setPhase] = useState<Phase>("shake");

  // Simpan callback di ref supaya identitas fungsi dari parent
  // (yang bisa berubah tiap render) tidak me-restart timeline.
  const onDoneRef = useRef(onDone);
  const onPhaseRef = useRef(onPhase);
  useEffect(() => {
    onDoneRef.current = onDone;
    onPhaseRef.current = onPhase;
  });

  // Satu timeline, semua timer dibersihkan saat unmount
  // (termasuk saat React StrictMode menjalankan effect dua kali di dev).
  useEffect(() => {
    const timers = TIMELINE.map(({ phase: next, at }) =>
      setTimeout(() => {
        setPhase(next);
        onPhaseRef.current?.(next);
      }, at)
    );
    timers.push(setTimeout(() => onDoneRef.current(), DONE_AT));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`ut-gameover ut-gameover--${phase}`}
      role="alert"
      aria-label="Game over — staying determined"
    >
      {/* Keyframes dibuat langsung di sini supaya tidak bergantung CSS eksternal */}
      <style>{SHAKE_KEYFRAMES}</style>

      {(phase === "shake" || phase === "crack") && (
        <div
          className="ut-gameover__soul ut-gameover__soul--shake"
          style={SOUL_SHAKE_STYLE}
        >
          <SoulSvg cracked={phase === "crack"} />
        </div>
      )}

      {phase === "shatter" && (
        <div className="ut-gameover__shards">
          {SHARDS.map((i) => {
            const style = {
              animationDelay: `${i * 45}ms`,
              // arah serpihan menyebar
              "--shard-x": `${Math.cos((i / SHARDS.length) * Math.PI * 2) * (60 + (i % 3) * 26)}px`,
              "--shard-y": `${Math.sin((i / SHARDS.length) * Math.PI * 2) * (50 + (i % 3) * 26)}px`,
            } as CSSProperties;
            return <span key={i} className="ut-gameover__shard" style={style} />;
          })}
        </div>
      )}

      {phase === "text" && (
        <div className="ut-gameover__text">
          <p className="ut-gameover__line ut-gameover__line--first">
            * You cannot give up just yet...
          </p>
          <p className="ut-gameover__line ut-gameover__line--second">
            <span className="ut-gameover__stay">STAY</span> DETERMINED!
          </p>
        </div>
      )}
    </div>
  );
}

function SoulSvg({ cracked }: { cracked: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={56}
      height={56}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="2" y="2" width="3" height="1" />
        <rect x="11" y="2" width="3" height="1" />
        <rect x="1" y="3" width="5" height="2" />
        <rect x="10" y="3" width="5" height="2" />
        <rect x="0" y="5" width="7" height="3" />
        <rect x="9" y="5" width="7" height="3" />
        <rect x="1" y="8" width="14" height="2" />
        <rect x="2" y="10" width="12" height="2" />
        <rect x="4" y="12" width="8" height="1" />
        <rect x="6" y="13" width="4" height="1" />
      </g>

      {/* Retakan zig-zag, warna hitam supaya "membelah" hati */}
      {cracked && (
        <g fill="#000">
          <rect x="8" y="4" width="1" height="2" />
          <rect x="7" y="6" width="1" height="2" />
          <rect x="8" y="8" width="1" height="2" />
          <rect x="7" y="10" width="1" height="2" />
          <rect x="8" y="12" width="1" height="2" />
        </g>
      )}
    </svg>
  );
}