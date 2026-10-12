"use client";

/**
 * Section ENCOUNTERS — project kamu ditampilkan seperti encounter musuh.
 *
 * Tiap project adalah "musuh" yang bisa di-CHECK untuk lihat detail,
 * atau di-ACT untuk buka link. Navigasi ala Undertale: arrow keys + Z.
 * Mengikuti pola UI: "* <ENEMY NAME> draws near!"
 */

import { useCallback, useEffect, useState } from "react";
import BattleBox from "@/components/ui/BattleBox";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { PROJECTS, type Project } from "@/lib/data";

export default function ProjectsSection() {
  const { play } = useSound();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"encounter" | "check">("encounter");

  const active = PROJECTS[activeIndex];

  const moveTo = useCallback(
    (index: number) => {
      const next = ((index % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
      if (next !== activeIndex) {
        setActiveIndex(next);
        setMode("encounter");
        play("move");
      }
    },
    [activeIndex, play]
  );

  const check = useCallback(() => {
    if (mode !== "check") {
      setMode("check");
      play("select");
    }
  }, [mode, play]);

  const openLink = useCallback(
    (project: Project) => {
      if (!project.url) return;
      play("mercy");
      window.open(project.url, "_blank", "noopener,noreferrer");
    },
    [play]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      // jangan intercept saat user sedang fokus di element interaktif lain
      if (el && el.tagName !== "BODY") return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          moveTo(activeIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          moveTo(activeIndex - 1);
          break;
        case "z":
        case "Z":
        case "Enter":
          e.preventDefault();
          check();
          break;
        case "x":
        case "X":
        case "Escape":
          e.preventDefault();
          if (mode === "check") {
            setMode("encounter");
            play("back");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, mode, moveTo, check, play]);

  return (
    <section id="projects" className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">ENCOUNTERS</h2>
        <p className="ut-section__sub">* PROJECTS</p>
      </div>

      <BattleBox>
        {/* Area "arena" tempat enemy muncul */}
        <div className="ut-arena">
          <div className="ut-arena__enemy-row">
            {PROJECTS.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`ut-enemy-pick ${index === activeIndex ? "ut-enemy-pick--active" : ""}`}
                onMouseEnter={() => moveTo(index)}
                onFocus={() => moveTo(index)}
                onClick={() => (mode === "check" && index === activeIndex ? openLink(project) : check())}
                aria-pressed={index === activeIndex}
              >
                <span className="ut-enemy-pick__soul">
                  {index === activeIndex && <SoulHeart size={12} animated={false} />}
                </span>
                <span
                  className="ut-enemy-pick__sprite"
                  style={{ color: project.color }}
                >
                  <EnemySprite color={project.color} />
                </span>
                <span className="ut-enemy-pick__name">{project.enemyName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ut-encounter-text">
          {mode === "encounter" ? (
            <TypewriterText
              key={`encounter-${active.id}`}
              text={`* ${active.enemyName} draws near! ${active.description}`}
              speed={26}
              className="ut-check-text"
            />
          ) : (
            <div key={`check-${active.id}`}>
              <TypewriterText
                text={active.checkText}
                speed={22}
                className="ut-check-text"
              />
              <div className="ut-check-tags">
                {active.tags.map((tag) => (
                  <span key={tag} className="ut-tag">
                    {tag}
                  </span>
                ))}
                <span className="ut-tag ut-tag--year">{active.year}</span>
              </div>
              {active.url && (
                <button
                  type="button"
                  className="ut-link-btn"
                  onMouseEnter={() => play("blip")}
                  onClick={() => openLink(active)}
                >
                  ▶ VISIT PROJECT
                </button>
              )}
              <p className="ut-encounter-hint">[ X / ESC ] BACK &nbsp;·&nbsp; [ Z ] CHECK AGAIN</p>
            </div>
          )}
        </div>

        {/* Menu aksi ala Undertale */}
        <div className="ut-actions">
          <button
            type="button"
            className={`ut-action ${mode === "check" ? "ut-action--active" : ""}`}
            onMouseEnter={() => play("blip")}
            onClick={check}
          >
            <span className="ut-action__soul">
              {mode === "check" && <SoulHeart size={11} animated={false} />}
            </span>
            CHECK
          </button>
          <button
            type="button"
            className="ut-action"
            onMouseEnter={() => play("blip")}
            onClick={() => openLink(active)}
          >
            ACT
          </button>
          <button
            type="button"
            className="ut-action"
            onMouseEnter={() => play("blip")}
            onClick={() => moveTo(activeIndex + 1)}
          >
            NEXT
          </button>
        </div>
      </BattleBox>

      <p className="ut-section__hint">
        [ ← → ] SWITCH ENEMY &nbsp;·&nbsp; [ Z ] CHECK &nbsp;·&nbsp; [ X ] BACK
      </p>
    </section>
  );
}

/** Sprite musuh generik — pixel art, warna mengikuti project. */
function EnemySprite({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="44"
      height="44"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ color }}
    >
      <g fill="currentColor">
        <rect x="3" y="1" width="10" height="2" />
        <rect x="2" y="3" width="12" height="3" />
        <rect x="1" y="6" width="14" height="5" />
        <rect x="2" y="11" width="3" height="3" />
        <rect x="11" y="11" width="3" height="3" />
        <rect x="6" y="11" width="4" height="2" />
      </g>
      <g fill="#000">
        <rect x="4" y="6" width="2" height="2" />
        <rect x="10" y="6" width="2" height="2" />
      </g>
    </svg>
  );
}
