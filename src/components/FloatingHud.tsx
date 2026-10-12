"use client";

/**
 * HUD melayang — elemen UI game yang menempel di pojok layar:
 * HP bar + nama & LV di kiri bawah, tombol mute di kanan atas.
 * Tidak ada navbar lagi; navigasi lewat hub dan tombol BACK.
 */

import SoulHeart from "@/components/ui/SoulHeart";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER } from "@/lib/data";

export default function FloatingHud() {
  const { muted, toggleMute, play } = useSound();

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

      {/* Mute pojok kanan atas */}
      <div className="ut-float-mute-group">
        <span className="ut-float-track" title="Now playing">
          <span className="ut-float-track__note" aria-hidden="true">
            {muted ? "♪̸" : "♪"}
          </span>
          <span className="ut-float-track__name">VS. LANCER</span>
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
