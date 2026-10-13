"use client";

/**
 * Efek mesin tiket khas game retro: huruf muncul satu per satu
 * dengan bunyi blip. Mengikuti perilaku teks dialog Undertale:
 *
 * - Bunyi blip setiap beberapa huruf (tidak setiap huruf, biar tidak bikin geli)
 * - Tanda baca membuat jeda lebih lama
 * - Bisa diskip dengan klik/spasi (cepatkan ke teks penuh)
 * - Memanggil onComplete setelah selesai
 *
 * Catatan: komponen ini mengandalkan `key` dari parent untuk reset
 * saat text berubah (pattern React 19 yang clean, tanpa ref di render).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "@/components/providers/SoundProvider";

const BLIP_EVERY = 3; // bunyi blip tiap N huruf
const PUNCTUATION = new Set([".", ",", "!", "?", ";", ":"]);

export default function TypewriterText({
  text,
  speed = 28, // ms per huruf
  className = "",
  startDelay = 0,
  onComplete,
  soundEnabled = true,
  as: Tag = "p",
}: {
  text: string;
  speed?: number;
  className?: string;
  startDelay?: number;
  onComplete?: () => void;
  soundEnabled?: boolean;
  as?: React.ElementType;
}) {
  const { play, muted } = useSound();
  // `tick` naik tiap huruf; `displayed` & `done` diturunkan darinya.
  const [tick, setTick] = useState(0);
  const indexRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const displayed = tick <= text.length ? text.slice(0, tick) : text;
  const done = tick >= text.length && text.length > 0;

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const finish = useCallback(() => {
    clearAll();
    indexRef.current = text.length;
    setTick(text.length);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [text, onComplete, clearAll]);

  // Satu-satunya effect animasi. `text` sebagai dependency memicu
  // ulang animasi tiap kali parent mengganti text (biasanya via key).
  useEffect(() => {
    completedRef.current = false;
    indexRef.current = 0;

    if (!text) {
      finish();
      return;
    }

    const start = setTimeout(() => {
      const step = () => {
        if (indexRef.current >= text.length) {
          finish();
          return;
        }

        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;
        setTick(nextIndex);

        const char = text[nextIndex - 1];

        // Bunyi blip periodik
        if (
          soundEnabled &&
          !muted &&
          nextIndex % BLIP_EVERY === 0 &&
          nextIndex <= text.length
        ) {
          play("blip");
        }

        // Jeda lebih lama setelah tanda baca
        const delay = PUNCTUATION.has(char) ? speed * 6 : speed;

        const t = setTimeout(step, delay);
        timeoutsRef.current.push(t);
      };

      step();
    }, startDelay);

    timeoutsRef.current.push(start);

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay]);

  // Klik / spasi untuk skip
  useEffect(() => {
    const handleSkip = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!completedRef.current) {
          e.preventDefault();
          finish();
        }
      }
    };
    window.addEventListener("keydown", handleSkip);
    return () => window.removeEventListener("keydown", handleSkip);
  }, [finish]);

  return (
    <Tag
      className={`ut-typewriter ${done ? "ut-typewriter--done" : ""} ${className}`}
      onClick={() => !done && finish()}
      role="text"
      aria-label={text}
    >
      {displayed}
      {!done && <span className="ut-cursor-blink" aria-hidden="true" />}
    </Tag>
  );
}
