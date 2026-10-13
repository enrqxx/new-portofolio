"use client";

/**
 * ENCOUNTER — transisi masuk minigame ala Undertale.
 *
 * Urutan:
 *   1. FLASH  : layar menggelap, SOUL muncul di titik klik + "!" , berkedip 2x (beep)
 *   2. FLY    : SOUL berputar terbang ke pojok kiri-bawah (posisi tombol FIGHT)
 *   3. COVER  : layar hitam penuh, router.push(href)
 *   4. REVEAL : setelah halaman tujuan terbuka, layar hitam memudar
 *
 * Overlay hidup di layout (tidak ikut unmount saat pindah route),
 * jadi transisinya tidak terputus di tengah navigasi.
 *
 * Suara dibuat dengan Web Audio API (tanpa file audio tambahan).
 * prefers-reduced-motion: hanya fade hitam sederhana, tanpa kedip/putaran.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/* ====================================================================
   KONFIGURASI
   ==================================================================== */

const HEART_W = 24;
const HEART_H = 21;
const FLASH_COUNT = 2;
const FLASH_ON = 110; // ms hati terlihat
const FLASH_OFF = 90; // ms hati hilang
const FLY_MS = 720;
const NAV_TIMEOUT = 4000; // batas tunggu halaman tujuan
const HOLD_AFTER_NAV = 350; // jeda hitam setelah halaman tujuan terbuka
const REVEAL_MS = 500;

// Tujuan terbang SOUL (fraksi viewport) — kira-kira tombol FIGHT di minigame
const TARGET = { x: 0.12, y: 0.88 };

// Bentuk hati (sama dengan SoulHeart/RoarKnightGame): [x, y, w, h]
const SOUL_RECTS: [number, number, number, number][] = [
  [2, 2, 3, 1],
  [11, 2, 3, 1],
  [1, 3, 5, 2],
  [10, 3, 5, 2],
  [0, 5, 7, 3],
  [9, 5, 7, 3],
  [1, 8, 14, 2],
  [2, 10, 12, 2],
  [4, 12, 8, 1],
  [6, 13, 4, 1],
];

/**
 * Route yang memicu transisi encounter. Link biasa (<Link>/<a>) ke route ini
 * otomatis ditangkap — Hub.tsx tidak perlu diubah.
 * Isi dengan path minigame kamu, mis. ["/roaring-knight"].
 */
export const ENCOUNTER_ROUTES: string[] = ["/roar"];

/** Penanda untuk halaman tujuan: "wait:<ts>" = transisi masih jalan, "go:<ts>" = sudah dibuka. */
export const ENCOUNTER_KEY = "encounter:pending";
export const ENCOUNTER_EVENT = "encounter:reveal";

const mark = (state: "wait" | "go") => {
  try {
    sessionStorage.setItem(ENCOUNTER_KEY, `${state}:${Date.now()}`);
  } catch {
    /* storage diblokir — abaikan */
  }
};

/* ====================================================================
   TIPE + CONTEXT
   ==================================================================== */

type Origin = { x: number; y: number };
type Stage = "idle" | "flash" | "fly" | "cover" | "reveal";

type EncounterCtx = {
  /** Mulai transisi lalu pindah ke `href`. `origin` = titik awal SOUL (px viewport). */
  encounter: (href: string, origin?: Origin) => void;
  busy: boolean;
};

const Ctx = createContext<EncounterCtx>({
  encounter: () => {},
  busy: false,
});

export const useEncounter = () => useContext(Ctx);

/* ====================================================================
   SFX (Web Audio)
   ==================================================================== */

type Sfx = {
  blip: (freq: number) => void;
  swoosh: () => void;
  thud: () => void;
};

function createSfx(): Sfx | null {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC();
  void ctx.resume();

  const tone = (
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number
  ) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  return {
    blip: (freq) => tone("square", freq, freq, 0.11, 0.07),
    swoosh: () => {
      tone("sawtooth", 1500, 90, FLY_MS / 1000, 0.05);
      tone("square", 700, 60, FLY_MS / 1000, 0.025);
    },
    thud: () => tone("square", 120, 45, 0.28, 0.09),
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ====================================================================
   PROVIDER
   ==================================================================== */

export function EncounterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [stage, setStage] = useState<Stage>("idle");
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0 });
  const [heartOn, setHeartOn] = useState(true);

  const busyRef = useRef(false);
  const heartRef = useRef<HTMLDivElement>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const navWaiter = useRef<{ path: string; done: () => void } | null>(null);

  // Halaman tujuan sudah terbuka → lepaskan penunggu
  useEffect(() => {
    const w = navWaiter.current;
    if (w && pathname === w.path) w.done();
  }, [pathname]);

  const encounter = useCallback(
    async (href: string, from?: Origin) => {
      if (busyRef.current) return;
      busyRef.current = true;
      mark("wait");

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dest = new URL(href, window.location.origin).pathname;

      const goAndWait = async () => {
        if (dest !== window.location.pathname) {
          const arrived = new Promise<void>((resolve) => {
            navWaiter.current = { path: dest, done: resolve };
          });
          router.push(href);
          await Promise.race([arrived, sleep(NAV_TIMEOUT)]);
          navWaiter.current = null;
        }
        await sleep(HOLD_AFTER_NAV);
      };

      /* --- reduced motion: fade hitam saja --- */
      if (reduce) {
        setHeartOn(false);
        setStage("cover");
        await sleep(250);
        await goAndWait();
        mark("go");
        window.dispatchEvent(new Event(ENCOUNTER_EVENT));
        setStage("reveal");
        await sleep(REVEAL_MS);
        setStage("idle");
        busyRef.current = false;
        return;
      }

      const o = from ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setOrigin(o);
      if (!sfxRef.current) sfxRef.current = createSfx();
      const sfx = sfxRef.current;

      /* --- 1. FLASH --- */
      setHeartOn(true);
      setStage("flash");
      for (let i = 0; i < FLASH_COUNT; i++) {
        setHeartOn(true);
        sfx?.blip(i === 0 ? 660 : 880);
        await sleep(FLASH_ON);
        setHeartOn(false);
        await sleep(FLASH_OFF);
      }
      setHeartOn(true);
      await sleep(FLASH_ON + 40);

      /* --- 2. FLY (spiral ke pojok kiri-bawah) --- */
      setStage("fly");
      sfx?.swoosh();

      const tx = window.innerWidth * TARGET.x;
      const ty = window.innerHeight * TARGET.y;
      const dx = tx - o.x;
      const dy = ty - o.y;
      const mx = o.x + dx * 0.5 - dy * 0.3;
      const my = o.y + dy * 0.5 + dx * 0.3;
      const at = (x: number, y: number, rot: number, s: number) =>
        `translate(${x - HEART_W / 2}px, ${y - HEART_H / 2}px) rotate(${rot}deg) scale(${s})`;

      const el = heartRef.current;
      if (el) {
        const anim = el.animate(
          [
            { transform: at(o.x, o.y, 0, 1) },
            { transform: at(mx, my, 360, 1.5), offset: 0.4 },
            { transform: at(tx, ty, 720, 1) },
          ],
          { duration: FLY_MS, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" }
        );
        await anim.finished.catch(() => {});
        // hati tetap di posisi akhir sampai overlay hilang
        anim.commitStyles();
        anim.cancel();
      } else {
        await sleep(FLY_MS);
      }

      /* --- 3. COVER + navigasi --- */
      setOrigin({ x: tx, y: ty });
      setStage("cover");
      sfx?.thud();
      await sleep(220);
      await goAndWait();

      /* --- 4. REVEAL --- */
      mark("go");
      window.dispatchEvent(new Event(ENCOUNTER_EVENT)); // minigame mulai bertarung di sini
      setStage("reveal");
      await sleep(REVEAL_MS);
      setStage("idle");
      busyRef.current = false;
    },
    [router]
  );

  // Tangkap klik link ke ENCOUNTER_ROUTES (fase capture, sebelum handler Next.js)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if (!ENCOUNTER_ROUTES.includes(path)) return;

      e.preventDefault();
      e.stopPropagation();
      const r = a.getBoundingClientRect();
      const from =
        e.detail === 0
          ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          : { x: e.clientX, y: e.clientY };
      void encounter(url.pathname + url.search + url.hash, from);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [encounter]);

  const value = useMemo(() => ({ encounter, busy: stage !== "idle" }), [encounter, stage]);

  return (
    <Ctx.Provider value={value}>
      {children}

      <div className="enc" data-stage={stage} aria-hidden="true">
        <div
          ref={heartRef}
          className="enc__heart"
          style={{
            transform: `translate(${origin.x - HEART_W / 2}px, ${origin.y - HEART_H / 2}px)`,
            visibility: heartOn ? "visible" : "hidden",
          }}
        >
          {stage === "flash" && <span className="enc__bang">!</span>}
          <svg
            width={HEART_W}
            height={HEART_H}
            viewBox="0 0 16 14"
            shapeRendering="crispEdges"
            style={{ display: "block" }}
          >
            {SOUL_RECTS.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="var(--color-ut-soul, #ff2b4b)" />
            ))}
          </svg>
        </div>
      </div>

      <style>{CSS}</style>
    </Ctx.Provider>
  );
}

const CSS = `
.enc {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.enc[data-stage="flash"]  { visibility: visible; pointer-events: auto; opacity: .88; transition: opacity 60ms linear; }
.enc[data-stage="fly"]    { visibility: visible; pointer-events: auto; opacity: .94; }
.enc[data-stage="cover"]  { visibility: visible; pointer-events: auto; opacity: 1; transition: opacity 200ms linear; }
.enc[data-stage="reveal"] { visibility: visible; pointer-events: auto; opacity: 0; transition: opacity ${REVEAL_MS}ms linear; }

.enc__heart {
  position: absolute;
  left: 0;
  top: 0;
  width: ${HEART_W}px;
  height: ${HEART_H}px;
  will-change: transform;
}
.enc__bang {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  font-family: var(--font-pixel), monospace;
  font-size: 18px;
  line-height: 1;
  color: #fff;
}
`;