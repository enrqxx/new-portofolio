"use client";

/**
 * Section ABOUT — meniru menu ACT → CHECK pada musuh di Undertale.
 *
 * Menampilkan flavor text, deskripsi, dan stat dasar (ATK/DEF/SPD/DEX)
 * dalam battle box.
 */

import BattleBox from "@/components/ui/BattleBox";
import HealthBar from "@/components/ui/HealthBar";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { ABOUT, PLAYER } from "@/lib/data";

export default function AboutSection() {
  const { play } = useSound();

  return (
    <section id="about" className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">CHECK</h2>
        <p className="ut-section__sub">* ABOUT</p>
      </div>

      <BattleBox>
        <div className="ut-enemy-header">
          <div className="ut-enemy-sprite ut-enemy-sprite--photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PLAYER.avatar} alt={`Portrait of ${PLAYER.name}`} />
          </div>
          <div className="ut-enemy-meta">
            <p className="ut-enemy-name">{PLAYER.name}</p>
            <p className="ut-enemy-flavor">{ABOUT.flavorText}</p>
          </div>
        </div>

        <div className="ut-check-panel">
          <TypewriterText
            text={ABOUT.checkLine}
            speed={30}
            className="ut-check-text"
          />

          <TypewriterText
            text={ABOUT.description}
            speed={18}
            startDelay={900}
            className="ut-check-desc"
          />
        </div>

        <div className="ut-stats-grid">
          {ABOUT.stats.map((stat) => (
            <HealthBar
              key={stat.label}
              current={stat.value}
              max={40}
              label={stat.label}
              note={stat.note}
              color="#ffcc00"
              soundOnHover
            />
          ))}
        </div>

        <div className="ut-equip">
          <span
            className="ut-equip__item"
            onMouseEnter={() => play("blip")}
          >
            ⚔ {PLAYER.weapon}
          </span>
          <span
            className="ut-equip__item"
            onMouseEnter={() => play("blip")}
          >
            🛡 {PLAYER.armor}
          </span>
          <span className="ut-equip__gold">G: {PLAYER.gold}</span>
        </div>
      </BattleBox>
    </section>
  );
}
