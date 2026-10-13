"use client";

/**
 * Background music — loop track retro, dikontrol oleh tombol mute yang sama
 * dengan sound effect (lewat SoundProvider).
 *
 * Track yang diputar tergantung halaman:
 *  - /roar (mini game) → "Roaring Knight" (boss theme)
 *  - lainnya           → "Vs. Lancer" (default)
 *
 * Browser melarang autoplay sebelum gestur pertama, jadi musik mulai
 * otomatis begitu pengguna klik sesuatu (mis. pilih SAVE di SAVE screen).
 * Kalau muted, musik di-pause; di-unmute, lanjut.
 *
 * Game Over: saat `bgmPaused` true (diset oleh RoarKnightGame), musik
 * di-fade-out lalu berhenti. Begitu `bgmPaused` kembali false (balik ke
 * layar awal), musik mulai lagi dari awal.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSound } from "@/components/providers/SoundProvider";

const TRACKS: Record<string, string> = {
  "/roar": "/audio/roaring-knight.mp3",
};

const DEFAULT_TRACK = "/audio/vs-lancer.mp3";
const BGM_VOLUME = 0.05; // musik sengaja pelan, jangan menutupi sound effect
const FADE_MS = 400;
const FADE_STEPS = 8;

function trackFor(pathname: string | null): string {
  if (pathname && TRACKS[pathname]) return TRACKS[pathname];
  return DEFAULT_TRACK;
}

export default function BgmPlayer() {
  const { muted, bgmPaused } = useSound();
  const silent = muted || bgmPaused;
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  const restartOnResume = useRef(false);

  // Ganti track saat pindah halaman
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = trackFor(pathname);
    if (audio.getAttribute("data-src") !== src) {
      audio.setAttribute("data-src", src);
      audio.src = src;
      audio.load();
      if (!silent) {
        const attempt = audio.play();
        if (attempt) attempt.catch(() => {});
      }
    }
  }, [pathname, silent]);

  // Play / pause mengikuti state mute & pause dari game over
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      audio.pause();
      return;
    }

    if (bgmPaused) {
      // fade-out singkat lalu berhenti; saat lanjut nanti diulang dari awal
      restartOnResume.current = true;
      let step = 0;
      const id = setInterval(() => {
        step++;
        audio.volume = Math.max(0, BGM_VOLUME * (1 - step / FADE_STEPS));
        if (step >= FADE_STEPS) {
          clearInterval(id);
          audio.pause();
          audio.volume = BGM_VOLUME;
        }
      }, FADE_MS / FADE_STEPS);
      return () => clearInterval(id);
    }

    audio.volume = BGM_VOLUME;
    if (restartOnResume.current) {
      restartOnResume.current = false;
      audio.currentTime = 0;
    }

    // Mungkin ditolak browser sebelum gestur pertama — biarkan,
    // listener gestur di bawah yang akan mencoba lagi.
    const attempt = audio.play();
    if (attempt) {
      attempt.catch(() => {
        /* menunggu gestur pengguna */
      });
    }
  }, [muted, bgmPaused]);

  // Coba play lagi pada gestur pertama (autoplay policy)
  useEffect(() => {
    const tryPlay = () => {
      const audio = audioRef.current;
      if (!audio || silent) return;
      if (audio.paused) {
        const attempt = audio.play();
        if (attempt) attempt.catch(() => {});
      }
    };

    window.addEventListener("click", tryPlay);
    window.addEventListener("keydown", tryPlay);
    return () => {
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, [silent]);

  // Volume diterapkan saat mulai diputar (sumber daya audio belum siap sebelumnya)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const apply = () => {
      audio.volume = BGM_VOLUME;
    };
    apply();
    audio.addEventListener("canplay", apply);
    return () => audio.removeEventListener("canplay", apply);
  }, []);

  return (
    <audio
      ref={audioRef}
      src={trackFor(pathname)}
      data-src={trackFor(pathname)}
      preload="auto"
      loop
      aria-hidden="true"
    />
  );
}