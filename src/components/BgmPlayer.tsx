"use client";

/**
 * Background music — loop track retro, dikontrol oleh volume bar & tombol
 * mute yang sama dengan sound effect (lewat SoundProvider).
 *
 * Browser melarang autoplay sebelum gestur pertama, jadi musik mulai
 * otomatis begitu pengguna klik sesuatu (mis. pilih SAVE di SAVE screen).
 * Kalau muted/volume 0, musik di-pause; di-unmute, lanjut.
 */

import { useEffect, useRef } from "react";
import { useSound } from "@/components/providers/SoundProvider";

const TRACK_SRC = "/audio/vs-lancer.mp3";
// Musik sengaja pelan (5%) — background saja, jangan menutupi sound effect.
const BGM_VOLUME = 0.05;

export default function BgmPlayer() {
  const { muted } = useSound();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Terapkan volume ke elemen audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : BGM_VOLUME;
  }, [muted]);

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

  return (
    <audio ref={audioRef} src={TRACK_SRC} preload="auto" loop aria-hidden="true" />
  );
}
