"use client";

/**
 * Efek mesin tiket khas game retro: huruf muncul satu per satu
 * dengan bunyi blip. Mengikuti perilaku teks dialog Undertale:
 *
 * - Bunyi blip setiap beberapa huruf (tidak setiap huruf, biar tidak bikin geli)
 * - Tanda baca membuat jeda lebih lama
 * - Bisa diskip dengan klik/spasi (cepatkan ke teks penuh)
 * - Memanggil onComplete setelah selesai
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
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const finish = useCallback(() => {
    clearAll();
    setDisplayed(text);
    setDone(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [text, onComplete, clearAll]);

  useEffect(() => {
    completedRef.current = false;
    setDone(false);
    setDisplayed("");
    indexRef.current = 0;

    if (!text) {
      finish();
      return;
    }

    const start = setTimeout(() => {
      const tick = () => {
        if (indexRef.current >= text.length) {
          finish();
          return;
        }

        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;
        setDisplayed(text.slice(0, nextIndex));

        // Bunyi blip periodik
        if (
          soundEnabled &&
          !muted &&
          nextIndex % BLIP_EVERY === 0 &&
          nextIndex <= text.length
        ) {
          play("blip");
        }

        const char = text[nextIndex - 1];
        // Jeda lebih lama setelah tanda baca
        const delay = PUNCTUATION.has(char) ? speed * 6 : speed;

        const t = setTimeout(tick, delay);
        timeoutsRef.current.push(t);
      };

      tick();
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
