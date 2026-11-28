"use client";

/**
 * Halaman 404 custom bertema Undertale — "* But nobody came."
 * Mendukung klik & navigasi keyboard (Z / Enter / X / Esc) untuk kembali ke Hub.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BattleBox from "@/components/ui/BattleBox";
import FloatingHud from "@/components/FloatingHud";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";

export default function NotFound() {
  const router = useRouter();
  const { play } = useSound();

  useEffect(() => {
    play("ominous");
  }, [play]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.key === "z" ||
        e.key === "Z" ||
        e.key === "Enter" ||
        e.key === "x" ||
        e.key === "X" ||
        e.key === "Escape"
      ) {
        e.preventDefault();
        play("back");
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [play, router]);

  return (
    <div className="ut-viewport">
      <FloatingHud />
      <main className="ut-main">
        <section className="ut-section">
          <div className="ut-section__head">
            <h1 className="ut-section__title">404</h1>
            <p className="ut-section__sub">* ROUTE NOT FOUND</p>
          </div>

          <BattleBox>
            <div className="ut-notfound">
              <div className="ut-notfound__soul" aria-hidden="true">
                <SoulHeart size={42} animated={false} />
              </div>

              <TypewriterText
                text="* But nobody came."
                speed={55}
                className="ut-check-text ut-notfound__lead"
              />

              <TypewriterText
                text="* This path does not exist in this timeline. Better head back to the save point."
                speed={24}
                startDelay={1150}
                className="ut-check-text ut-check-text--small"
              />
            </div>

            <div className="ut-actions ut-notfound__actions">
              <Link
                href="/"
                className="ut-action ut-action--active"
                style={{ textDecoration: "none" }}
                onMouseEnter={() => play("blip")}
                onFocus={() => play("blip")}
                onClick={() => play("back")}
              >
                <span className="ut-action__soul">
                  <SoulHeart size={11} animated={false} />
                </span>
                RETURN TO HUB
              </Link>
            </div>
          </BattleBox>

          <p className="ut-section__hint">
            [ Z / ENTER / ESC ] RETURN TO HUB
          </p>
        </section>
      </main>
    </div>
  );
}
