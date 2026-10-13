"use client";

/**
 * Section STATS — skill kamu ditampilkan seperti menu ITEM Undertale:
 * grid icon-only dengan kursor hati. Geser kursor (arrow keys / hover),
 * lalu tekan Z / Enter / klik untuk memeriksa item; detailnya diketik di
 * panel bawah. X menutup detail.
 *
 * Suara mengikuti game: "move" saat kursor bergeser, "select" saat
 * konfirmasi, "back" saat menutup.
 *
 * Tidak ada progress bar — persis seperti item menu di game.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import BattleBox from "@/components/ui/BattleBox";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { SKILL_ICONS, type SkillIconName } from "@/components/ui/icons";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER, SKILLS } from "@/lib/data";

export default function StatsSection() {
  const { play } = useSound();
  // kursor hati: selalu ada, mulai di item pertama (tanpa bunyi)
  const [cursor, setCursor] = useState(0);
  // item yang sedang diperiksa (setelah Z / klik); null = detail tertutup
  const [inspected, setInspected] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const moveCursor = useCallback(
    (index: number) => {
      if (index === cursor) return;
      setCursor(index);
      setInspected(null); // pindah item → detail lama ditutup
      play("move");
    },
    [cursor, play]
  );

  const inspect = useCallback(
    (index: number) => {
      if (index !== cursor) {
        setCursor(index);
      }
      setInspected(index);
      play("select");
    },
    [cursor, play]
  );

  useEffect(() => {
    if (SKILLS.length === 0) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Hanya tangani tombol saat fokus ada di body atau di grid item ini.
      // Fokus di input / link / tombol lain dibiarkan apa adanya.
      const target = e.target as HTMLElement | null;
      const ours =
        !target ||
        target === document.body ||
        (gridRef.current?.contains(target) ?? false);
      if (!ours) return;

      // Konfirmasi: Z / Enter (tanpa auto-repeat)
      if (e.key === "z" || e.key === "Z" || e.key === "Enter") {
        e.preventDefault(); // cegah klik ganda pada tombol yang sedang fokus
        if (!e.repeat) inspect(cursor);
        return;
      }

      // Batal: X / Escape
      if (e.key === "x" || e.key === "X" || e.key === "Escape") {
        if (inspected !== null) {
          e.preventDefault();
          if (!e.repeat) {
            setInspected(null);
            play("back");
          }
        }
        return;
      }

      const next = nextIndex(
        cursor,
        e.key,
        getGridCols(gridRef.current),
        SKILLS.length
      );
      if (next === null) return;

      e.preventDefault();
      moveCursor(next);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cursor, inspected, inspect, moveCursor, play]);

  const activeSkill = inspected !== null ? SKILLS[inspected] : null;
  const ActiveIcon = activeSkill
    ? SKILL_ICONS[activeSkill.icon as SkillIconName]
    : null;

  return (
    <section id="skills" className="ut-section">
      {/* Judul disembunyikan dari tampilan, tapi tetap ada untuk screen reader & SEO */}
      <h2 className="sr-only">Stats — Skills &amp; Abilities</h2>

      <BattleBox>
        <div className="ut-stat-row ut-stat-row--lv">
          <span className="ut-stat-row__label">NAME</span>
          <span className="ut-stat-row__label">LV</span>
          <span className="ut-stat-row__label">HP</span>
        </div>
        <div className="ut-stat-row ut-stat-row--values">
          <span className="ut-stat-row__value">{PLAYER.name}</span>
          <span className="ut-stat-row__value">{PLAYER.level}</span>
          <span className="ut-stat-row__value">
            {PLAYER.hp} / {PLAYER.maxHp}
          </span>
        </div>

        <div className="ut-hpbar ut-hpbar--big">
          <div className="ut-hpbar__track">
            <div
              className="ut-hpbar__fill"
              style={{
                width: `${(PLAYER.hp / PLAYER.maxHp) * 100}%`,
                backgroundColor: "#ffcc00",
              }}
            />
          </div>
        </div>

        <div className="ut-divider" />

        <TypewriterText
          text="* Your SKILLS. Select one to inspect it."
          speed={28}
          className="ut-check-text ut-check-text--small"
        />

        <div className="ut-item-grid" ref={gridRef}>
          {SKILLS.map((skill, index) => {
            const Icon = SKILL_ICONS[skill.icon as SkillIconName];
            const isActive = cursor === index;
            return (
              <button
                key={skill.name}
                type="button"
                className={`ut-item ${isActive ? "ut-item--active" : ""}`}
                onMouseEnter={() => moveCursor(index)}
                onFocus={() => moveCursor(index)}
                onClick={() => inspect(index)}
                aria-pressed={inspected === index}
              >
                <span className="ut-item__soul">
                  {isActive && <SoulHeart size={14} animated={false} />}
                </span>
                {Icon && (
                  <span className="ut-item__icon">
                    <Icon className="h-9 w-9" />
                  </span>
                )}
                <span className="ut-item__name">{skill.name}</span>
              </button>
            );
          })}
        </div>

        {activeSkill ? (
          <div className="ut-item-detail">
            <div className="ut-item-detail__head">
              <span className="ut-item-detail__icon">
                {ActiveIcon ? <ActiveIcon className="h-6 w-6" /> : null}
              </span>
              <span className="ut-item-detail__name">{activeSkill.name}</span>
            </div>
            {/* key = item → teks diketik ulang (dengan blip) tiap item diperiksa.
                TypewriterText sendiri sudah merender <p>, jadi tidak dibungkus lagi. */}
            <TypewriterText
              key={`${inspected}-${activeSkill.name}`}
              text={`* ${activeSkill.note}`}
              speed={24}
              className="ut-item-detail__text"
            />
          </div>
        ) : (
          <p className="ut-item-empty">* (Press Z or click to inspect.)</p>
        )}
      </BattleBox>

      <p className="ut-section__hint">
        [ ← → ↑ ↓ ] MOVE &nbsp;·&nbsp; [ Z / ENTER ] INSPECT &nbsp;·&nbsp; [ X ] CLOSE
      </p>
    </section>
  );
}

/**
 * Jumlah kolom grid yang sebenarnya, dibaca dari CSS (auto-fill bergantung
 * lebar container), supaya panah atas/bawah selalu cocok dengan tampilan.
 */
function getGridCols(grid: HTMLElement | null): number {
  if (!grid) return 1;
  const cols = getComputedStyle(grid)
    .gridTemplateColumns.split(" ")
    .filter(Boolean).length;
  return Math.max(1, cols);
}

/**
 * Indeks kursor berikutnya untuk sebuah tombol panah, atau null kalau
 * bukan tombol panah. Kiri/kanan wrap linear; atas/bawah wrap dalam kolom
 * yang sama (aman untuk baris terakhir yang tidak penuh).
 */
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
      return next < total ? next : col; // wrap ke baris pertama, kolom sama
    }
    case "ArrowUp": {
      const prev = current - cols;
      if (prev >= 0) return prev;
      // wrap ke baris terakhir yang masih punya item di kolom ini
      return col + Math.floor((total - 1 - col) / cols) * cols;
    }
    default:
      return null;
  }
}