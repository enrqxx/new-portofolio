"use client";

/**
 * Provider sound global: melacak state mute dan mengaktifkan AudioContext
 * pada gestur pertama pengguna (syarat browser).
 *
 * Volume BGM & SFX sudah diatur tetap di masing-masing modul (musik sengaja
 * pelan agar tidak menutupi sound effect).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  playSound,
  resumeAudio,
  type SoundName,
} from "@/lib/sound";

const MUTE_KEY = "ut-portfolio-muted";

type SoundContextValue = {
  muted: boolean;
  toggleMute: () => void;
  play: (name: SoundName) => void;
  /** true = BGM ditahan sementara (mis. saat layar Game Over), terpisah dari mute. */
  bgmPaused: boolean;
  setBgmPaused: (paused: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [bgmPaused, setBgmPausedState] = useState(false);
  const setBgmPaused = useCallback((paused: boolean) => setBgmPausedState(paused), []);

  // Ambil preferensi mute dari localStorage (client-only).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MUTE_KEY);
      if (stored === "true") setMuted(true);
    } catch {
      // ignore — storage mungkin tidak tersedia
    }
  }, []);

  const play = useCallback((name: SoundName) => {
    resumeAudio();
    playSound(name);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ muted, toggleMute, play, bgmPaused, setBgmPaused }),
    [muted, toggleMute, play, bgmPaused, setBgmPaused]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Fallback aman agar komponen tidak crash jika dipakai di luar provider
    return {
      muted: false,
      toggleMute: () => {},
      play: () => {},
      bgmPaused: false,
      setBgmPaused: () => {},
    };
  }
  return ctx;
}