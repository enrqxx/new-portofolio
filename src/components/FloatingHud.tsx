"use client";

/**
 * HUD melayang — elemen UI game yang menempel di pojok layar:
 * HP bar + nama & LV di kiri bawah, tombol mute + now playing di kanan atas.
 * Nama track mengikuti halaman yang sedang dibuka.
 */

import { usePathname } from "next/navigation";
import SoulHeart from "@/components/ui/SoulHeart";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER } from "@/lib/data";

const TRACK_NAMES: Record<string, string> = {
  "/roar": "ROARING KNIGHT",
};

const DEFAULT_TRACK_NAME = "VS. LANCER";

export default function FloatingHud() {
  const { muted, toggleMute, play } = useSound();
  const pathname = usePathname();
  const trackName = (pathname && TRACK_NAMES[pathname]) || DEFAULT_TRACK_NAME;

  return (
    <>
      {/* HP bar pojok kiri bawah */}
      <div className="ut-float-hp" aria-label="Player status">
        <span className="ut-float-hp__soul">
          <SoulHeart size={14} />
        </span>
        <span className="ut-float-hp__name">{PLAYER.name}</span>
        <span className="ut-float-hp__lv">LV {PLAYER.level}</span>
        <span className="ut-float-hp__bar">
          <span
            className="ut-float-hp__fill"
            style={{ width: `${(PLAYER.hp / PLAYER.maxHp) * 100}%` }}
          />
        </span>
        <span className="ut-float-hp__num">
          {PLAYER.hp}/{PLAYER.maxHp}
        </span>
      </div>

      {/* Mute + now playing pojok kanan atas */}
      <div className="ut-float-mute-group">
        <span className="ut-float-track" title="Now playing">
          <span className="ut-float-track__note" aria-hidden="true">
            {muted ? "♪̸" : "♪"}
          </span>
          <span className="ut-float-track__name">{trackName}</span>
        </span>
        <button
          type="button"
          className="ut-float-mute"
          onMouseEnter={() => play("blip")}
          onFocus={() => play("blip")}
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Unmute sound" : "Mute sound"}
          title={muted ? "Sound: OFF" : "Sound: ON"}
        >
          <span aria-hidden="true">{muted ? "♪̸" : "♪"}</span>
          <span className="sr-only">{muted ? "Unmute" : "Mute"}</span>
        </button>
      </div>
    </>
  );
}
