"use client";

/**
 * Section MERCY — section kontak. Di Undertale, MERCY adalah cara
 * menyelesaikan pertarungan tanpa melukai. Di sini "SPARE" = menghubungi.
 */

import BattleBox from "@/components/ui/BattleBox";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import { useSound } from "@/components/providers/SoundProvider";
import { CONTACT, PLAYER } from "@/lib/data";

export default function ContactSection() {
  const { play } = useSound();

  const handleSocial = (url: string, label: string) => {
    if (label === "EMAIL") {
      play("mercy");
      // Navigasi ke mailto: harus di location utama, bukan tab baru.
      void (() => {
        window.location.href = url;
      })();
      return;
    }
    play("mercy");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="contact" className="ut-section">
      <div className="ut-section__head">
        <h2 className="ut-section__title">MERCY</h2>
        <p className="ut-section__sub">* CONTACT</p>
      </div>

      <BattleBox>
        <div className="ut-mercy-scene">
          <div className="ut-mercy-soul">
            <SoulHeart size={48} />
          </div>
          <TypewriterText text={CONTACT.spareLine} speed={32} className="ut-check-text" />
        </div>

        <div className="ut-mercy-panel">
          <TypewriterText
            text={`* You think about reaching out to ${PLAYER.name}. ${CONTACT.mercyText}`}
            speed={22}
            startDelay={700}
            className="ut-check-text ut-check-text--small"
          />

          <div className="ut-mercy-actions">
            {CONTACT.socials.map((social) => (
              <button
                key={social.label}
                type="button"
                className="ut-mercy-btn"
                onMouseEnter={() => play("blip")}
                onFocus={() => play("blip")}
                onClick={() => handleSocial(social.url, social.label)}
              >
                <span className="ut-mercy-btn__soul">
                  <SoulHeart size={11} animated={false} />
                </span>
                {social.label}
              </button>
            ))}
          </div>

          <div className="ut-mercy-email">
            <span className="ut-mercy-email__label">* DIRECT MESSAGE:</span>
            <button
              type="button"
              className="ut-mercy-email__addr"
              onMouseEnter={() => play("blip")}
              onClick={() => handleSocial(`mailto:${CONTACT.email}`, "EMAIL")}
            >
              {CONTACT.email}
            </button>
          </div>
        </div>

        <div className="ut-actions">
          <span className="ut-action ut-action--spare">
            <span className="ut-action__soul">
              <SoulHeart size={11} animated={false} />
            </span>
            SPARE — SAY HELLO
          </span>
        </div>
      </BattleBox>

      <p className="ut-footer">
        <span className="ut-footer__heart">♥</span> THANKS FOR PLAYING — MADE WITH
        DETERMINATION
      </p>
    </section>
  );
}
