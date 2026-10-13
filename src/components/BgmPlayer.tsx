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
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSound } from "@/components/providers/SoundProvider";

const TRACKS: Record<string, string> = {
  "/roar": "/audio/roaring-knight.mp3",
};

const DEFAULT_TRACK = "/audio/vs-lancer.mp3";
const BGM_VOLUME = 0.05; // musik sengaja pelan, jangan menutupi sound effect

function trackFor(pathname: string | null): string {
  if (pathname && TRACKS[pathname]) return TRACKS[pathname];
  return DEFAULT_TRACK;
}

export default function BgmPlayer() {
  const { muted } = useSound();
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Ganti track saat pindah halaman
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = trackFor(pathname);
    if (audio.getAttribute("data-src") !== src) {
      audio.setAttribute("data-src", src);
      audio.src = src;
      audio.load();
      if (!muted) {
        const attempt = audio.play();
        if (attempt) attempt.catch(() => {});
      }
    }
  }, [pathname, muted]);

  // Play / pause mengikuti state mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      audio.pause();
      return;
    }

    // Mungkin ditolak browser sebelum gestur pertama — biarkan,
    // listener gestur di bawah yang akan mencoba lagi.
    const attempt = audio.play();
    if (attempt) {
      attempt.catch(() => {
        /* menunggu gestur pengguna */
      });
    }
  }, [muted]);

  // Coba play lagi pada gestur pertama (autoplay policy)
  useEffect(() => {
    const tryPlay = () => {
      const audio = audioRef.current;
      if (!audio || muted) return;
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
  }, [muted]);

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
