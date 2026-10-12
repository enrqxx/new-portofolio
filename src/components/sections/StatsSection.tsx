"use client";

/**
 * Section STATS — skill kamu ditampilkan seperti menu ITEM Undertale:
 * grid icon-only, pilih salah satu untuk melihat detailnya di panel
 * bawah. Navigasi: arrow keys + Z/Enter, atau klik.
 *
 * Tidak ada progress bar — persis seperti item menu di game.
 */

import { useCallback, useEffect, useState } from "react";
import BattleBox from "@/components/ui/BattleBox";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { SKILL_ICONS, type SkillIconName } from "@/components/ui/icons";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER, SKILLS } from "@/lib/data";

export default function StatsSection() {
  const { play } = useSound();
  const [selected, setSelected] = useState<number | null>(null);

  const select = useCallback(
    (index: number) => {
      if (index !== selected) {
        setSelected(index);
        play("select");
      }
    },
    [selected, play]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el.tagName !== "BODY") return;

      if (e.key === "x" || e.key === "X" || e.key === "Escape") {
        if (selected !== null) {
          e.preventDefault();
          setSelected(null);
          play("back");
        }
        return;
      }

      if (e.key === "z" || e.key === "Z" || e.key === "Enter") {
        if (selected === null && SKILLS.length > 0) {
          e.preventDefault();
          select(0);
        }
        return;
      }

      const cols = getGridCols();
      const current = selected ?? -1;

      let next: number | null = null;
      switch (e.key) {
        case "ArrowRight":
          next = current === -1 ? 0 : (current + 1) % SKILLS.length;
          break;
        case "ArrowLeft":
          next = current === -1 ? 0 : (current - 1 + SKILLS.length) % SKILLS.length;
          break;
        case "ArrowDown":
          next = current === -1 ? 0 : (current + cols) % SKILLS.length;
          break;
        case "ArrowUp":
          next = current === -1 ? 0 : (current - cols + SKILLS.length) % SKILLS.length;
          break;
        default:
          return;
      }

      e.preventDefault();
      select(next as number);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, select, play]);

  const activeSkill = selected !== null ? SKILLS[selected] : null;

  return (
    <section id="skills" className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">STATS</h2>
        <p className="ut-section__sub">* SKILLS &amp; ABILITIES</p>
      </div>

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

        <div className="ut-item-grid">
          {SKILLS.map((skill, index) => {
            const Icon = SKILL_ICONS[skill.icon as SkillIconName];
            const isActive = selected === index;
            return (
              <button
                key={skill.name}
                type="button"
                className={`ut-item ${isActive ? "ut-item--active" : ""}`}
                onMouseEnter={() => select(index)}
                onFocus={() => select(index)}
                onClick={() => select(index)}
                aria-pressed={isActive}
              >
                <span className="ut-item__soul">
                  {isActive && <SoulHeart size={10} animated={false} />}
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
                {(() => {
                  const Icon = SKILL_ICONS[activeSkill.icon as SkillIconName];
                  return Icon ? <Icon className="h-6 w-6" /> : null;
                })()}
              </span>
              <span className="ut-item-detail__name">{activeSkill.name}</span>
            </div>
            <p className="ut-item-detail__text">* {activeSkill.note}</p>
          </div>
        ) : (
          <p className="ut-item-empty">* (Select an item...)</p>
        )}
      </BattleBox>

      <p className="ut-section__hint">
        [ ← → ↑ ↓ ] SELECT ITEM &nbsp;·&nbsp; [ Z ] CONFIRM &nbsp;·&nbsp; [ X ] DESELECT
      </p>
    </section>
  );
}

/** Jumlah kolom grid item saat ini, biar navigasi arrow terasa natural. */
function getGridCols(): number {
  if (typeof window === "undefined") return 2;
  return window.innerWidth >= 560 ? 4 : 2;
}
