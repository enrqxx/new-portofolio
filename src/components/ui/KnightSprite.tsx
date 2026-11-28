"use client";

import { useEffect, useRef } from "react";

type Props = {
  frames: string[]; // ["/knight/idle-0.png", "/knight/idle-1.png", ...]
  w: number; // lebar asli frame (px sumber)
  h: number; // tinggi asli frame
  scale?: number; // pakai angka bulat: 2, 3, 4
  fps?: number;
  loop?: boolean;
  className?: string;
  onEnd?: () => void;
};

export default function KnightSprite({
  frames,
  w,
  h,
  scale = 3,
  fps = 10,
  loop = true,
  className,
  onEnd,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const k = Math.max(1, Math.round(scale * dpr)); // faktor skala bulat

    canvas.width = w * k;
    canvas.height = h * k;
    canvas.style.width = `${(w * k) / dpr}px`;
    canvas.style.height = `${(h * k) / dpr}px`;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let cancelled = false;
    const imgs = frames.map((src) => {
      const im = new Image();
      im.src = src;
      return im;
    });

    Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => {
      if (cancelled) return;
      let last = performance.now();
      let idx = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const im = imgs[idx];
        if (im && im.naturalWidth > 0) {
          ctx.drawImage(im, 0, 0, w * k, h * k);
        }
      };
      draw();
      const tick = (t: number) => {
        if (t - last >= 1000 / fps) {
          last = t;
          idx++;
          if (idx >= imgs.length) {
            if (!loop) {
              onEnd?.();
              return;
            }
            idx = 0;
          }
          draw();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [frames, w, h, scale, fps, loop, onEnd]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
