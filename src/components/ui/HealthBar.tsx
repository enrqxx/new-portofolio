"use client";

/**
 * HP bar khas Undertale: kuning untuk HP saat ini, merah untuk damage,
 * dengan label "HP" dan angka. Juga dipakai sebagai progress bar skill.
 */

import { useSound } from "@/components/providers/SoundProvider";

export default function HealthBar({
  current,
  max,
  label,
  note,
  color = "#ffcc00", // kuning HP Undertale
  soundOnHover = false,
}: {
  current: number;
  max: number;
  label?: string;
  note?: string;
  color?: string;
  soundOnHover?: boolean;
}) {
  const { play } = useSound();
  const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));

  return (
    <div
      className="ut-hpbar"
      onMouseEnter={() => soundOnHover && play("blip")}
    >
      {label && (
        <div className="ut-hpbar__label">
          <span className="ut-hpbar__name">{label}</span>
          {note && <span className="ut-hpbar__note">{note}</span>}
        </div>
      )}
      <div className="ut-hpbar__track">
        <div
          className="ut-hpbar__fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
        {/* lapisan "damage" merah di belakang */}
        <div
          className="ut-hpbar__damage"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="ut-hpbar__numbers">
        {current} / {max}
      </div>
    </div>
  );
}
