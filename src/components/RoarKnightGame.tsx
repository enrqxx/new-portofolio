"use client";

/**
 * THE ROARING KNIGHT — secret boss Deltarune Chapter 3, versi mini (HARD).
 *
 * Urutan serangan (sesuai wiki Fandom):
 *   Putaran pertama : Crystal Barrage, Knife Dance, Board Rend, Sword Tunnel, Sanguine Slash
 *   Putaran lanjut  : Crystal Barrage, Board Rend, Sword Tunnel, Knife Dance, Sanguine Slash
 *
 * Saat HP Knight <= 75%: CRYSTAL NOVA (Knight ke tengah layar, kristal ditarik
 * acak lalu berputar dari dua titik, 8 bintang pola bintang, semburan 3 bintang
 * acak yang pecah jadi serpihan, ditutup tebasan diagonal). Setelah selamat,
 * Knight lengah → satu FIGHT menamatkan battle. MERCY dicoret.
 *
 * Arena digambar di <canvas> dengan fixed timestep 60 fps; menu, HP,
 * dan teks tetap DOM supaya memakai font + TypewriterText proyekmu.
 */

import { useEffect, useRef, useState } from "react";
import SoulHeart from "@/components/ui/SoulHeart";
import TypewriterText from "@/components/ui/TypewriterText";
import GameOver, { type Phase as GameOverPhase } from "@/components/GameOver";
import { useSound } from "@/components/providers/SoundProvider";
import { PLAYER } from "@/lib/data";

/* ====================================================================
   KONFIGURASI
   ==================================================================== */

const W = 640;
const H = 330;
const BOX_DEFAULT: Rect = { x: 40, y: 160, w: 560, h: 150 };
const BOX_BOTTOM = 310;

const SOUL_R = 5; // hitbox kecil seperti di game
const SOUL_SPEED = 2.6;
const BREATH_BONUS = 0.7; // ACT "Hold Breath"
const I_FRAMES = 40; // HARD: invincibility lebih singkat

const PLAYER_MAX_HP = 100;
const BOSS_MAX_HP = 100;
const NOVA_THRESHOLD = 75; // HP% Knight saat Crystal Nova terpicu
const MAX_HIT = 11; // damage FIGHT maksimum (tengah target)

const FINGER = { x: 372, y: 74 }; // sisi kanan Knight (asal Star Show)

/* ====================================================================
   TIPE
   ==================================================================== */

type Rect = { x: number; y: number; w: number; h: number };
type PlayFn = ReturnType<typeof useSound>["play"];
type AttackKind = "barrage" | "knife" | "rend" | "tunnel" | "sanguine" | "nova";
type Pose = "idle" | "point" | "raise" | "vanish" | "glow" | "center";
type EngineMode = "idle" | "enemy" | "bar" | "resolve";

type Bullet = {
  k: "b";
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  style: "star" | "shard" | "orb";
  age: number;
  ghost?: boolean; // hiasan, tidak melukai
  life?: number; // hapus otomatis setelah N frame
  burst?: { at: number; count: number; speed: number; dmg?: number };
};
type Blade = {
  k: "blade";
  x: number;
  y: number;
  ang: number;
  state: "lock" | "fly";
  age: number;
  lock: number;
  speed: number;
  len: number;
  dmg: number;
};
type Slash = {
  k: "slash";
  px: number;
  py: number;
  ang: number;
  warn: number;
  flash: number;
  age: number;
  dmg: number;
  w: number;
};
type SwordRow = { k: "rect"; x: number; y: number; w: number; h: number; vy: number; dmg: number };
type Hazard = Bullet | Blade | Slash | SwordRow;

type Callbacks = {
  onHp: (hp: number) => void;
  onTurnEnd: () => void;
  onFightDone: () => void;
  onDeath: () => void;
};

/* ====================================================================
   SPRITE KNIGHT — GIF animasi (taruh di folder public/)
   Hitam pekat di-blend dengan mode "screen" sehingga latarnya transparan.
   ==================================================================== */

const BOSS_IMG = "/img/Knight_battle_afterimage.gif";

// Bentuk hati (sama dengan SoulHeart) untuk digambar di canvas
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

/* ====================================================================
   ENGINE (simulasi + render canvas)
   ==================================================================== */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

class Engine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private font: string;
  private reduce: boolean;

  cb: Callbacks;
  keys = new Set<string>();

  // arena
  board: Rect = { ...BOX_DEFAULT };
  target: Rect = { ...BOX_DEFAULT };
  split: { axis: "v" | "h"; gap: number; goal: number; half: 0 | 1 } | null = null;
  cut = 0; // sisa frame efek garis belahan
  cutAxis: "v" | "h" = "v";

  // pemain
  soul = { x: W / 2, y: 235 };
  soulOn = false;
  speedBonus = false;
  hp = PLAYER_MAX_HP;
  inv = 0;
  dead = false;

  // boss
  bossHp = BOSS_MAX_HP;
  pose: Pose = "idle";
  bossShake = 0;
  private bossY = 0; // geser vertikal (%) saat Knight ke tengah layar
  hpShow = 0;

  // efek
  frame = 0;
  shake = 0;
  flash = 0;
  pull = 0;

  // serangan
  hazards: Hazard[] = [];
  mode: EngineMode = "idle";
  private gen: Generator<number, void, undefined> | null = null;
  private waitF = 0;
  private tail = 0;

  // fight bar
  private bar = { x: 0, delay: 0, stopped: false, dmg: 0, finisher: false, crit: false };
  private rt = 0; // timer fase resolve
  private dmgNum: { t: number; text: string } = { t: -1, text: "" };

  constructor(
    canvas: HTMLCanvasElement,
    private bossEl: HTMLImageElement | null,
    private play: PlayFn,
    cb: Callbacks
  ) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D tidak tersedia");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.cb = cb;
    this.font = getComputedStyle(canvas).fontFamily || "monospace";
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- siklus hidup ---------- */

  start() {
    this.last = performance.now();
    const loop = (t: number) => {
      this.acc += Math.min(100, t - this.last);
      this.last = t;
      let n = 0;
      while (this.acc >= 1000 / 60 && n < 5) {
        this.step();
        this.acc -= 1000 / 60;
        n++;
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  reset() {
    this.hp = PLAYER_MAX_HP;
    this.bossHp = BOSS_MAX_HP;
    this.inv = 0;
    this.dead = false;
    this.hazards = [];
    this.gen = null;
    this.mode = "idle";
    this.soulOn = false;
    this.speedBonus = false;
    this.pose = "idle";
    this.bossY = 0;
    this.split = null;
    this.pull = 0;
    this.flash = 0;
    this.shake = 0;
    this.hpShow = 0;
    this.board = { ...BOX_DEFAULT };
    this.target = { ...BOX_DEFAULT };
  }

  heal(n: number) {
    this.hp = Math.min(PLAYER_MAX_HP, this.hp + n);
    this.cb.onHp(this.hp);
  }

  /* ---------- API untuk giliran ---------- */

  startEnemyTurn(kind: AttackKind, diff: number) {
    this.hazards = [];
    this.mode = "enemy";
    this.soulOn = true;
    this.soul = { x: W / 2, y: 240 };
    this.tail = 0;
    this.waitF = 24;
    this.gen = ATTACKS[kind](this, diff);
    this.inv = Math.max(this.inv, 30);
  }

  startFightBar(finisher: boolean) {
    this.setBoardSize(560, 110);
    this.mode = "bar";
    this.bar = { x: 0, delay: 22, stopped: false, dmg: 0, finisher, crit: false };
    this.bar.x = this.target.x + 12;
  }

  pressConfirm() {
    if (this.mode !== "bar" || this.bar.stopped || this.bar.delay > 0) return;
    const b = this.bar;
    const cx = this.target.x + this.target.w / 2;
    const half = this.target.w / 2 - 12;
    const dist = Math.abs(b.x - cx);
    b.stopped = true;
    b.crit = dist < 8;
    if (b.finisher) {
      b.dmg = this.bossHp;
    } else {
      const raw = MAX_HIT * (1 - Math.min(1, dist / half));
      b.dmg = Math.max(1, Math.round(raw * (b.crit ? 1.3 : 1)));
    }
    this.play("select");
    this.mode = "resolve";
    this.rt = 0;
  }

  /* ---------- helper untuk script serangan ---------- */

  setBoardSize(w: number, h: number) {
    this.target = { x: W / 2 - w / 2, y: BOX_BOTTOM - h, w, h };
  }

  setBoardFull() {
    this.target = { x: 8, y: 8, w: W - 16, h: H - 16 };
  }

  doSplit(axis: "v" | "h", gap: number) {
    const rects = this.boardRects();
    const r = rects[0];
    const side =
      axis === "v" ? (this.soul.x < r.x + r.w / 2 ? 0 : 1) : this.soul.y < r.y + r.h / 2 ? 0 : 1;
    this.split = { axis, gap: 0, goal: gap, half: side as 0 | 1 };
    this.cut = 12;
    this.cutAxis = axis;
  }

  unsplit() {
    if (this.split) this.split.goal = 0;
  }

  bullet(b: Partial<Bullet> & { x: number; y: number; vx: number; vy: number }) {
    this.hazards.push({ k: "b", r: 6, dmg: 10, style: "orb", age: 0, ...b });
  }

  blade(x: number, y: number, ang: number, lock: number, speed: number, dmg: number) {
    this.hazards.push({ k: "blade", x, y, ang, state: "lock", age: 0, lock, speed, len: 46, dmg });
  }

  slash(px: number, py: number, ang: number, warn: number, flash: number, w: number, dmg: number) {
    this.hazards.push({ k: "slash", px, py, ang, warn, flash, age: 0, w, dmg });
  }

  sword(x: number, y: number, w: number, vy: number, dmg: number) {
    this.hazards.push({ k: "rect", x, y, w, h: 16, vy, dmg });
  }

  boardCenter() {
    return { x: this.target.x + this.target.w / 2, y: this.target.y + this.target.h / 2 };
  }

  sfx(name: Parameters<PlayFn>[0]) {
    this.play(name);
  }

  addShake(n: number) {
    if (!this.reduce) this.shake = n;
  }

  addFlash(n: number) {
    if (!this.reduce) this.flash = n;
  }

  /* ---------- simulasi ---------- */

  private boardRects(): Rect[] {
    const b = this.board;
    if (!this.split) return [b];
    const g = this.split.gap;
    if (this.split.axis === "v") {
      const w = (b.w - g) / 2;
      return [
        { x: b.x, y: b.y, w, h: b.h },
        { x: b.x + w + g, y: b.y, w, h: b.h },
      ];
    }
    const h = (b.h - g) / 2;
    return [
      { x: b.x, y: b.y, w: b.w, h },
      { x: b.x, y: b.y + h + g, w: b.w, h },
    ];
  }

  private step() {
    this.frame++;

    // kotak mengikuti target dengan easing
    const k = 0.22;
    this.board.x += (this.target.x - this.board.x) * k;
    this.board.y += (this.target.y - this.board.y) * k;
    this.board.w += (this.target.w - this.board.w) * k;
    this.board.h += (this.target.h - this.board.h) * k;

    if (this.split) {
      this.split.gap += (this.split.goal - this.split.gap) * 0.25;
      if (this.split.goal === 0 && this.split.gap < 0.5) this.split = null;
    }

    if (this.inv > 0) this.inv--;
    if (this.shake > 0) this.shake--;
    if (this.cut > 0) this.cut--;
    if (this.bossShake > 0) this.bossShake--;
    if (this.hpShow > 0) this.hpShow--;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.04);

    if (this.mode === "enemy") this.stepEnemy();
    else if (this.mode === "bar") this.stepBar();
    else if (this.mode === "resolve") this.stepResolve();
  }

  private stepEnemy() {
    this.moveSoul();

    if (this.gen) {
      if (this.waitF > 0) this.waitF--;
      else {
        const r = this.gen.next();
        if (r.done) {
          this.gen = null;
          this.tail = 0;
        } else this.waitF = Math.max(1, Math.round(r.value));
      }
    }

    this.updateHazards();
    if (this.mode !== "enemy") return; // mati di tengah update

    if (!this.gen) {
      this.tail++;
      const live = this.hazards.some((h) => !(h.k === "b" && h.ghost));
      if (!live || this.tail > 240) this.endEnemy();
    }
  }

  private endEnemy() {
    this.hazards = [];
    this.soulOn = false;
    this.pose = "idle";
    this.pull = 0;
    this.split = null;
    this.mode = "idle";
    this.target = { ...BOX_DEFAULT };
    this.cb.onTurnEnd();
  }

  private moveSoul() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has("ArrowLeft")) dx -= 1;
    if (this.keys.has("ArrowRight")) dx += 1;
    if (this.keys.has("ArrowUp")) dy -= 1;
    if (this.keys.has("ArrowDown")) dy += 1;
    if (dx && dy) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    const sp = SOUL_SPEED + (this.speedBonus ? BREATH_BONUS : 0);
    this.soul.x += dx * sp;
    this.soul.y += dy * sp;

    if (this.pull > 0) {
      const c = this.boardCenter();
      const vx = c.x - this.soul.x;
      const vy = c.y - this.soul.y;
      const d = Math.hypot(vx, vy) || 1;
      this.soul.x += (vx / d) * this.pull;
      this.soul.y += (vy / d) * this.pull;
    }

    const rects = this.boardRects();
    const r = this.split ? rects[this.split.half] : rects[0];
    this.soul.x = clamp(this.soul.x, r.x + 10, r.x + r.w - 10);
    this.soul.y = clamp(this.soul.y, r.y + 10, r.y + r.h - 10);
  }

  private updateHazards() {
    const list = this.hazards;
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      let remove = false;

      if (h.k === "b") {
        h.x += h.vx;
        h.y += h.vy;
        h.age++;
        if (h.burst && h.age >= h.burst.at) {
          const { count, speed } = h.burst;
          const off = Math.random() * Math.PI;
          for (let n = 0; n < count; n++) {
            const a = off + (n / count) * Math.PI * 2;
            this.bullet({
              x: h.x,
              y: h.y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              r: 4,
              dmg: h.burst.dmg ?? 8,
              style: "shard",
            });
          }
          remove = true;
        }
        if (h.life !== undefined && h.age >= h.life) remove = true;
        if (h.x < -50 || h.x > W + 50 || h.y < -50 || h.y > H + 50) remove = true;
      } else if (h.k === "blade") {
        h.age++;
        if (h.state === "lock") {
          if (h.age >= h.lock) {
            // kunci terakhir: arahkan ke posisi SOUL saat ini, lalu melesat
            h.ang = Math.atan2(this.soul.y - h.y, this.soul.x - h.x);
            h.state = "fly";
            h.age = 0;
            this.play("alert");
          }
        } else {
          h.x += Math.cos(h.ang) * h.speed;
          h.y += Math.sin(h.ang) * h.speed;
          if (h.x < -320 || h.x > W + 320 || h.y < -320 || h.y > H + 320) remove = true;
        }
      } else if (h.k === "slash") {
        h.age++;
        if (h.age === h.warn) {
          this.play("slash");
          this.addShake(4);
        }
        if (h.age >= h.warn + h.flash + 6) remove = true;
      } else {
        h.y += h.vy;
        if (h.y > H + 30) remove = true;
      }

      if (remove) {
        list.splice(i, 1);
        continue;
      }
      if (this.inv === 0 && this.hits(h)) this.damage(h.dmg);
      if (this.mode !== "enemy") return;
    }
  }

  private hits(h: Hazard): boolean {
    const sx = this.soul.x;
    const sy = this.soul.y;
    if (h.k === "b") {
      if (h.ghost) return false;
      const rr = h.r + SOUL_R;
      return (h.x - sx) ** 2 + (h.y - sy) ** 2 < rr * rr;
    }
    if (h.k === "blade") {
      if (h.state !== "fly") return false;
      const dx = Math.cos(h.ang);
      const dy = Math.sin(h.ang);
      const t = clamp((sx - h.x) * dx + (sy - h.y) * dy, -h.len / 2, h.len / 2);
      const px = h.x + dx * t;
      const py = h.y + dy * t;
      const rr = 4 + SOUL_R;
      return (px - sx) ** 2 + (py - sy) ** 2 < rr * rr;
    }
    if (h.k === "slash") {
      if (h.age < h.warn || h.age >= h.warn + h.flash) return false;
      const d = Math.abs((sx - h.px) * Math.sin(h.ang) - (sy - h.py) * Math.cos(h.ang));
      return d < h.w / 2 + SOUL_R;
    }
    return sx + SOUL_R > h.x && sx - SOUL_R < h.x + h.w && sy + SOUL_R > h.y && sy - SOUL_R < h.y + h.h;
  }

  private damage(d: number) {
    this.hp = Math.max(0, this.hp - d);
    this.inv = I_FRAMES;
    this.addShake(6);
    this.play("hurt");
    this.cb.onHp(this.hp);
    if (this.hp <= 0) {
      this.dead = true;
      this.mode = "idle";
      this.cb.onDeath();
    }
  }

  private stepBar() {
    if (this.bar.delay > 0) {
      this.bar.delay--;
      this.bar.x = this.target.x + 12;
      return;
    }
    this.bar.x += 12;
    if (this.bar.x > this.target.x + this.target.w - 12) {
      // lewat ujung = meleset
      this.bar.stopped = true;
      this.bar.dmg = 0;
      this.bar.crit = false;
      this.mode = "resolve";
      this.rt = 0;
    }
  }

  private stepResolve() {
    this.rt++;
    if (this.rt === 30) {
      if (this.bar.dmg > 0) {
        this.play("slash");
        this.bossHp = Math.max(0, this.bossHp - this.bar.dmg);
        this.bossShake = 16;
        this.hpShow = 85;
        this.dmgNum = { t: 0, text: String(this.bar.dmg) };
      } else {
        this.play("back");
        this.dmgNum = { t: 0, text: "MISS" };
        this.hpShow = 55;
      }
    }
    if (this.dmgNum.t >= 0) this.dmgNum.t++;
    if (this.rt >= 110) {
      this.mode = "idle";
      this.target = { ...BOX_DEFAULT };
      this.dmgNum.t = -1;
      this.cb.onFightDone();
    }
  }

  /* ---------- render ---------- */

  private draw() {
    const c = this.ctx;
    c.save();
    c.fillStyle = "#000";
    c.fillRect(0, 0, W, H);

    if (this.shake > 0 && !this.reduce) {
      c.translate((Math.random() - 0.5) * this.shake * 1.6, (Math.random() - 0.5) * this.shake * 1.6);
    }

    this.drawBoss();
    this.drawBoard();
    if (this.mode === "bar" || (this.mode === "resolve" && this.rt < 110)) this.drawBar();
    for (const h of this.hazards) this.drawHazard(h);
    if (this.soulOn) this.drawSoul();
    this.drawHud();

    c.restore();

    if (this.flash > 0) {
      c.fillStyle = `rgba(255,255,255,${this.flash * 0.85})`;
      c.fillRect(0, 0, W, H);
    }
  }

  private drawBoss() {
    const c = this.ctx;
    const bob = Math.sin(this.frame * 0.05) * 3;
    const hit = this.bossShake > 0 ? (this.bossShake % 4 < 2 ? -5 : 5) : 0;

    // aura ungu di belakang Knight saat Nova
    const glowOn = this.pose === "glow" || this.pose === "center";
    this.bossY += ((this.pose === "center" ? 40 : 0) - this.bossY) * 0.06;
    if (glowOn) {
      const ay = this.pose === "center" ? 150 : 80;
      const g = c.createRadialGradient(W / 2, ay, 10, W / 2, ay, 130);
      g.addColorStop(0, "rgba(190,150,255,0.55)");
      g.addColorStop(1, "rgba(190,150,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }

    // sprite GIF adalah elemen DOM (supaya animasinya jalan); engine hanya
    // menggeser / menyembunyikannya sesuai pose, getaran, dan bob.
    const el = this.bossEl;
    if (el) {
      const jx = this.shake > 0 && !this.reduce ? (Math.random() - 0.5) * this.shake * 1.6 : 0;
      const jy = this.shake > 0 && !this.reduce ? (Math.random() - 0.5) * this.shake * 1.6 : 0;
      el.style.transform = `translate(${hit + jx}px, calc(${bob + jy}px + ${this.bossY}%))`;
      el.style.opacity = this.pose === "vanish" ? "0" : "1";
      el.style.filter =
        glowOn ? "drop-shadow(0 0 8px #b896ff) brightness(1.25)" : "none";
    }
  }

  private drawBoard() {
    const c = this.ctx;
    const box = (r: Rect) => {
      c.fillStyle = "#000";
      c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = "#fff";
      c.lineWidth = 4;
      c.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    };
    for (const r of this.boardRects()) box(r);

    if (this.pose === "point") {
      c.fillStyle = "rgba(170,70,255,0.16)";
      for (const r of this.boardRects()) c.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
    }

    // garis tebasan saat kotak dibelah
    if (this.cut > 0) {
      const b = this.board;
      c.strokeStyle = "#fff";
      c.lineWidth = 6;
      c.beginPath();
      if (this.cutAxis === "v") {
        c.moveTo(b.x + b.w / 2, b.y - 20);
        c.lineTo(b.x + b.w / 2, b.y + b.h + 20);
      } else {
        c.moveTo(b.x - 20, b.y + b.h / 2);
        c.lineTo(b.x + b.w + 20, b.y + b.h / 2);
      }
      c.stroke();
    }

    // aura Crystal Nova (digambar di atas kotak layar penuh)
    if (this.pose === "center") {
      const g = c.createRadialGradient(W / 2, 150, 10, W / 2, 150, 150);
      g.addColorStop(0, "rgba(150,210,255,0.28)");
      g.addColorStop(1, "rgba(150,210,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }

    // titik hisap ROAR
    if (this.pose === "glow") {
      const cc = this.boardCenter();
      const r = 16 + Math.sin(this.frame * 0.2) * 5;
      const g = c.createRadialGradient(cc.x, cc.y, 2, cc.x, cc.y, r * 2.4);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(1, "rgba(160,110,255,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cc.x, cc.y, r * 2.4, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawBar() {
    const c = this.ctx;
    const b = this.board;
    const cx = b.x + b.w / 2;
    const top = b.y + 14;
    const hgt = b.h - 28;

    // papan target: pita gelap bergradasi ke tengah
    c.fillStyle = "#101010";
    c.fillRect(b.x + 10, top, b.w - 20, hgt);
    for (let i = 0; i < 6; i++) {
      const w = (b.w - 20) * (1 - i * 0.17);
      c.strokeStyle = `rgba(255,255,255,${0.18 + i * 0.1})`;
      c.lineWidth = 2;
      c.strokeRect(cx - w / 2, top + i * 3, w, hgt - i * 6);
    }
    c.fillStyle = "#ffcc00";
    c.fillRect(cx - 2, top - 2, 4, hgt + 4);

    // kursor berkedip putih/hitam seperti di game
    const x = this.bar.x;
    const stopped = this.bar.stopped;
    const blink = stopped ? this.rt % 6 < 3 : this.frame % 8 < 4;
    c.fillStyle = blink ? "#fff" : "#444";
    c.fillRect(x - 5, top - 6, 10, hgt + 12);
    c.strokeStyle = "#000";
    c.lineWidth = 2;
    c.strokeRect(x - 5, top - 6, 10, hgt + 12);
  }

  private drawHazard(h: Hazard) {
    const c = this.ctx;

    if (h.k === "b") {
      c.save();
      c.translate(h.x, h.y);
      if (h.ghost) c.globalAlpha = 0.45;
      if (h.style === "star") {
        c.rotate(h.age * 0.12);
        c.fillStyle = "#cfeeff";
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const rr = i % 2 === 0 ? h.r * 1.7 : h.r * 0.65;
          const a = (i / 8) * Math.PI * 2;
          c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath();
        c.fill();
      } else if (h.style === "shard") {
        c.rotate(Math.atan2(h.vy, h.vx));
        c.fillStyle = "#8fd8ff";
        c.beginPath();
        c.moveTo(h.r * 1.6, 0);
        c.lineTo(0, h.r * 0.8);
        c.lineTo(-h.r * 1.2, 0);
        c.lineTo(0, -h.r * 0.8);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = h.ghost ? "#b090ff" : "#fff";
        c.beginPath();
        c.arc(0, 0, h.r, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
      return;
    }

    if (h.k === "blade") {
      c.save();
      c.translate(h.x, h.y);
      c.rotate(h.ang);
      const lockJitter = h.state === "lock" ? (Math.random() - 0.5) * 1.5 : 0;
      c.translate(0, lockJitter);
      c.fillStyle = h.state === "fly" ? "#ff2b4b" : "#f2f2ff";
      c.fillRect(-h.len / 2, -2, h.len, 4);
      c.beginPath();
      c.moveTo(h.len / 2, -3);
      c.lineTo(h.len / 2 + 10, 0);
      c.lineTo(h.len / 2, 3);
      c.closePath();
      c.fill();
      c.fillStyle = "#5c5c7a";
      c.fillRect(-h.len / 2 - 2, -6, 4, 12);
      c.restore();
      return;
    }

    if (h.k === "slash") {
      const len = 900;
      const dx = Math.cos(h.ang) * len;
      const dy = Math.sin(h.ang) * len;
      c.save();
      c.lineCap = "round";
      if (h.age < h.warn) {
        // telegraf garis merah, makin terang menjelang tebasan
        const a = 0.3 + 0.6 * (h.age / h.warn);
        c.strokeStyle = `rgba(255,43,75,${a})`;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(h.px - dx, h.py - dy);
        c.lineTo(h.px + dx, h.py + dy);
        c.stroke();
      } else {
        const t = h.age - h.warn;
        const fade = t < h.flash ? 1 : 1 - (t - h.flash) / 6;
        c.strokeStyle = `rgba(255,255,255,${Math.max(0, fade)})`;
        c.lineWidth = h.w * (t < h.flash ? 1 : Math.max(0.1, fade));
        c.beginPath();
        c.moveTo(h.px - dx, h.py - dy);
        c.lineTo(h.px + dx, h.py + dy);
        c.stroke();
      }
      c.restore();
      return;
    }

    // baris pedang (Sword Tunnel): deretan bilah menghadap ke bawah
    for (let x = h.x; x < h.x + h.w - 1; x += 14) {
      const bw = Math.min(10, h.x + h.w - x - 2);
      if (bw <= 0) break;
      c.fillStyle = "#e8e8f4";
      c.fillRect(x + 2, h.y - 14, bw, h.h);
      c.beginPath();
      c.moveTo(x + 2, h.y + h.h - 14);
      c.lineTo(x + 2 + bw, h.y + h.h - 14);
      c.lineTo(x + 2 + bw / 2, h.y + h.h + 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#6a6a88";
      c.fillRect(x, h.y - 16, bw + 4, 4);
    }
  }

  private drawSoul() {
    if (this.inv > 0 && this.frame % 8 < 4) return;
    const c = this.ctx;
    c.fillStyle = "#ff2b4b";
    const ox = Math.round(this.soul.x - 8);
    const oy = Math.round(this.soul.y - 8);
    for (const [x, y, w, h] of SOUL_RECTS) c.fillRect(ox + x, oy + y, w, h);
  }

  private drawHud() {
    const c = this.ctx;

    // efek tebasan FIGHT di tubuh Knight
    if (this.mode === "resolve" && this.rt >= 30 && this.rt < 48 && this.bar.dmg > 0) {
      const p = (this.rt - 30) / 18;
      c.strokeStyle = "#fff";
      c.lineWidth = 6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(W / 2 - 44, 24);
      c.lineTo(W / 2 - 44 + 88 * p, 24 + 88 * p);
      c.stroke();
    }

    // bar HP Knight (abu-abu + hijau) muncul sesaat setelah kena
    if (this.hpShow > 0) {
      const w = 150;
      const x = W / 2 - w / 2;
      const y = 124;
      c.fillStyle = "#555";
      c.fillRect(x, y, w, 12);
      c.fillStyle = "#00c000";
      c.fillRect(x, y, w * (this.bossHp / BOSS_MAX_HP), 12);
    }

    // angka damage
    if (this.dmgNum.t >= 0 && this.dmgNum.t < 70) {
      const t = this.dmgNum.t;
      const bounce = Math.abs(Math.sin(Math.min(1, t / 14) * Math.PI)) * 22;
      c.font = `28px ${this.font}`;
      c.textAlign = "center";
      c.fillStyle = this.dmgNum.text === "MISS" ? "#c8c8c8" : "#ff3030";
      c.strokeStyle = "#000";
      c.lineWidth = 4;
      const y = 112 - bounce;
      c.strokeText(this.dmgNum.text, W / 2, y);
      c.fillText(this.dmgNum.text, W / 2, y);
    }
  }
}

/* ====================================================================
   SERANGAN KNIGHT (script berbasis generator: yield = tunggu N frame)
   ==================================================================== */

type Script = (e: Engine, d: number) => Generator<number, void, undefined>;

// 1. Crystal Barrage — kristal-bintang dari ujung jari, pecah jadi serpihan
function* crystalBarrage(e: Engine, d: number) {
  e.setBoardSize(215, 145);
  e.pose = "point";
  e.sfx("alert");
  yield 45;

  const volleys = Math.round(5 + d * 2);
  for (let v = 0; v < volleys; v++) {
    const base = Math.atan2(e.soul.y - FINGER.y, e.soul.x - FINGER.x);
    const n = v % 2 === 0 ? 6 : 5;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.3 + Math.sin(v * 1.7) * 0.15;
      const sp = 2.6 * Math.min(d, 1.7);
      e.bullet({
        x: FINGER.x,
        y: FINGER.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: 6,
        dmg: 12,
        style: "star",
        burst: { at: 38, count: 7, speed: 2.5, dmg: 8 },
      });
    }
    e.sfx("blip");
    yield Math.max(18, 34 - d * 6);
  }
  yield 90;
}

// 2. Knife Dance — pisau mengunci SOUL dari berbagai arah, lalu melesat merah
function* knifeDance(e: Engine, d: number) {
  e.setBoardSize(260, 145);
  e.pose = "raise";
  e.sfx("alert");
  yield 45;

  const axes = [0, Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4];
  const rounds = 4;
  for (let r = 0; r < rounds; r++) {
    const n = 5 + Math.floor(d * 2);
    for (let i = 0; i < n; i++) {
      const a = axes[(i + r) % 4];
      const sgn = i % 2 === 0 ? 1 : -1;
      const dist = 190;
      const tx = e.soul.x + (Math.random() - 0.5) * 40;
      const ty = e.soul.y + (Math.random() - 0.5) * 40;
      e.blade(
        tx - Math.cos(a) * dist * sgn,
        ty - Math.sin(a) * dist * sgn,
        a,
        40 + i * 5,
        7 + d,
        22
      );
    }
    yield Math.max(58, 88 - d * 12);
  }
  yield 60;
}

// 3. Board Rend — kotak dibelah, proyektil diagonal (putaran lanjut: 2x belahan)
function* boardRend(e: Engine, d: number) {
  e.setBoardSize(320, 175);
  e.pose = "raise";
  yield 55;

  const first: "v" | "h" = Math.random() < 0.5 ? "v" : "h";
  const passes = d > 1.4 ? 2 : 1;

  for (let p = 0; p < passes; p++) {
    const axis: "v" | "h" = p === 0 ? first : first === "v" ? "h" : "v";
    e.sfx("slash");
    e.addShake(8);
    e.doSplit(axis, 44);
    yield 24;

    const b = e.target;
    const count = Math.round(14 + d * 6);
    for (let i = 0; i < count; i++) {
      const fromLeft = Math.random() < 0.5;
      const sx = fromLeft ? b.x - 14 : b.x + b.w + 14;
      const sy = b.y + Math.random() * b.h;
      const s = 2.6 * Math.min(d, 1.7);
      if (i % 3 === 2) {
        const a = Math.atan2(e.soul.y - sy, e.soul.x - sx);
        e.bullet({ x: sx, y: sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 6, dmg: 14, style: "shard" });
      } else {
        e.bullet({
          x: sx,
          y: sy,
          vx: fromLeft ? s : -s,
          vy: (Math.random() < 0.5 ? 1 : -1) * s * 0.85,
          r: 6,
          dmg: 14,
          style: "shard",
        });
      }
      yield Math.max(6, 12 - d * 2);
    }
    yield 70;
    e.unsplit();
    yield 36;
  }
  yield 10;
}

// 4. Sword Tunnel — Knight lenyap, lorong pedang menerjang SOUL
function* swordTunnel(e: Engine, d: number) {
  e.setBoardSize(260, 190);
  e.pose = "vanish";
  e.sfx("alert");
  yield 55;

  const b = e.target;
  const L = b.x;
  const R = b.x + b.w;
  const speed = 3.8 + d * 0.6;
  const spacing = 44;
  const gapW = Math.max(62, 86 - d * 8);
  const phase = Math.random() * 6;
  const freq = 0.5;
  const amp = Math.min(66, (b.w - gapW) / 2 - 8);

  for (let i = 0; i < 32; i++) {
    const cx = (L + R) / 2 + Math.sin(phase + i * freq) * amp;
    const gl = cx - gapW / 2;
    const gr = cx + gapW / 2;
    e.sword(L, b.y - 18, gl - L, speed, 26);
    e.sword(gr, b.y - 18, R - gr, speed, 26);
    yield Math.round(spacing / speed);
  }
  yield 80;
}

// 5. Sanguine Slash — garis merah lalu tebasan, tiap ronde nambah garis
function* sanguineSlash(e: Engine, d: number) {
  e.setBoardSize(240, 170);
  e.pose = "raise";
  yield 45;

  const rounds = Math.round(6 + (d - 1) * 5);
  for (let r = 0; r < rounds; r++) {
    const lines = Math.min(1 + Math.floor(r * 0.8), 5);
    for (let j = 0; j < lines; j++) {
      const jitter = j === 0 ? 10 : 70;
      e.slash(
        e.soul.x + (Math.random() - 0.5) * 2 * jitter,
        e.soul.y + (Math.random() - 0.5) * 2 * jitter,
        Math.random() * Math.PI,
        Math.max(22, 38 - d * 5),
        10,
        18,
        32
      );
    }
    e.sfx("alert");
    yield Math.max(42, 70 - d * 8) + 10;
  }
  yield 35;
}

// 6. Crystal Nova — Knight ke tengah layar (HP 75%), tarik kristal acak lalu
//    berputar, bintang pola 8, semburan 3 bintang acak, tutup dengan tebasan diagonal.
function* crystalNova(e: Engine, d: number) {
  e.setBoardFull();
  e.pose = "center";
  e.soul = { x: W / 2, y: 275 };
  e.sfx("roar");
  e.addFlash(0.7);
  e.addShake(12);
  yield 90;

  const c = e.boardCenter();
  const P1 = { x: 70, y: 60 }; // dua titik berlawanan
  const P2 = { x: W - 70, y: H - 60 };

  // A. tarik kristal acak ke arah Knight (hiasan)
  for (let i = 0; i < 30; i++) {
    for (const P of [P1, P2]) {
      const sx = P.x + (Math.random() - 0.5) * 90;
      const sy = P.y + (Math.random() - 0.5) * 90;
      const tx = c.x + (Math.random() - 0.5) * 160;
      const ty = c.y + (Math.random() - 0.5) * 100;
      e.bullet({ x: sx, y: sy, vx: (tx - sx) / 38, vy: (ty - sy) / 38, r: 4, dmg: 0, style: "shard", ghost: true, life: 38 });
    }
    if (i % 5 === 0) e.sfx("blip");
    yield 3;
  }
  yield 10;

  // B. pola berputar dari dua titik berlawanan (kali ini melukai)
  e.pull = 0.4;
  for (let t = 0; t < 150; t++) {
    if (t % 3 === 0) {
      for (const [P, flip] of [
        [P1, 1],
        [P2, -1],
      ] as const) {
        const base = Math.atan2(c.y - P.y, c.x - P.x);
        const a = base + t * 0.2 * flip;
        const sp = 2.7;
        e.bullet({ x: P.x, y: P.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 4, dmg: 9, style: "shard", life: 130 });
      }
    }
    yield 1;
  }
  e.pull = 0;
  yield 40;
  e.inv = Math.max(e.inv, 40);

  // C. 8 bintang berpola bintang, 3 gelombang berputar
  for (let w = 0; w < 3; w++) {
    const off = w * (Math.PI / 8) + Math.random() * 0.2;
    for (let i = 0; i < 8; i++) {
      const a = off + (i / 8) * Math.PI * 2;
      e.bullet({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * 2.2,
        vy: Math.sin(a) * 2.2,
        r: 7,
        dmg: 14,
        style: "star",
        burst: { at: 46, count: 8, speed: 2.4, dmg: 9 },
      });
    }
    e.sfx("blip");
    yield 52;
  }
  yield 20;

  // D. semburan 3 bintang, sebaran acak
  const bursts = Math.round(7 + d * 2);
  for (let b = 0; b < bursts; b++) {
    const dir = Math.atan2(e.soul.y - c.y, e.soul.x - c.x) + (Math.random() - 0.5) * 2.4;
    for (let k = -1; k <= 1; k++) {
      const a = dir + k * (0.25 + Math.random() * 0.45);
      const sp = 2.4 + Math.random() * 0.8;
      e.bullet({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: 7,
        dmg: 14,
        style: "star",
        burst: { at: 38 + Math.floor(Math.random() * 22), count: 8, speed: 2.4, dmg: 9 },
      });
    }
    e.sfx("blip");
    yield Math.max(26, 44 - d * 8);
  }
  yield 90;

  // E. tebasan diagonal menembus tengah layar
  const diag = Math.random() < 0.5 ? Math.PI / 4 : -Math.PI / 4;
  e.slash(c.x, c.y, diag, 70, 18, 46, 50);
  e.sfx("alert");
  yield 120;
  e.flash = 0;
}

const ATTACKS: Record<AttackKind, Script> = {
  barrage: crystalBarrage,
  knife: knifeDance,
  rend: boardRend,
  tunnel: swordTunnel,
  sanguine: sanguineSlash,
  nova: crystalNova,
};
// Putaran pertama vs putaran berikutnya (sesuai wiki):
const FIRST_ORDER: AttackKind[] = ["barrage", "knife", "rend", "tunnel", "sanguine"];
const LATER_ORDER: AttackKind[] = ["barrage", "rend", "tunnel", "knife", "sanguine"];

/* ====================================================================
   UI (React)
   ==================================================================== */

type Phase = "intro" | "menu" | "act" | "item" | "bar" | "dialog" | "enemy" | "won" | "lost";

const MENU = ["FIGHT", "ACT", "ITEM", "MERCY"] as const;
const ACTS = ["Check", "Hold Breath"] as const;
const FLAVOR = [
  "* The Roaring Knight's blade gleams.",
  "* A cold wind howls through the arena.",
  "* The Knight stares. It does not blink.",
  "* Your SOUL trembles... but holds.",
];

type Item = { name: string; heal: number; left: number };
const START_ITEMS: Item[] = [
  { name: "Dark Candy", heal: 30, left: 2 },
  { name: "CD Bagel", heal: 55, left: 1 },
];

const CSS = `
.rk-wrap { max-width: 640px; margin: 0 auto; container-type: inline-size; font-family: var(--font-terminal), monospace; color: #fff; }
.rk-stage { position: relative; background: #000; }
.rk-canvas { display: block; width: 100%; height: auto; image-rendering: pixelated; font-family: var(--font-pixel), monospace; }
.rk-boss { position: absolute; left: 35.9375%; top: 1.8%; width: 28.125%; height: auto; image-rendering: pixelated; mix-blend-mode: screen; pointer-events: none; user-select: none; transition: opacity 0.15s linear; }
.rk-overlay { position: absolute; left: 6.25%; top: 48.5%; width: 87.5%; height: 45.4%; padding: 3.4cqw 3.8cqw; overflow: hidden; font-size: 3.7cqw; line-height: 1.45; }
.rk-text { margin: 0; white-space: pre-wrap; color: #fff; }
.rk-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4cqw 3cqw; align-content: start; }
.rk-item { display: flex; align-items: center; gap: 1.6cqw; background: none; border: 0; color: #fff; font: inherit; text-align: left; cursor: pointer; padding: 0; }
.rk-item[disabled] { color: #808080; cursor: default; }
.rk-soulslot { width: 2.6cqw; height: 2.6cqw; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.rk-intro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.4cqw; background: rgba(0,0,0,0.8); text-align: center; padding: 0 6cqw; }
.rk-intro p { margin: 0; font-size: 3.8cqw; }
.rk-go { background: #000; color: #ff7f27; border: 0.6cqw solid #ff7f27; font-family: var(--font-pixel), monospace; font-size: 3.4cqw; padding: 1.4cqw 5cqw; cursor: pointer; }
.rk-go:hover, .rk-go:focus-visible { color: #ff0; border-color: #ff0; outline: none; }
.rk-hud { display: flex; align-items: center; gap: 3cqw; padding: 1.6cqw 2cqw 0.6cqw; font-size: 3.5cqw; white-space: nowrap; }
.rk-hud__name { overflow: hidden; text-overflow: ellipsis; max-width: 22cqw; }
.rk-hud__lbl { font-family: var(--font-pixel), monospace; font-size: 2.4cqw; }
.rk-hp { display: flex; align-items: center; gap: 1.6cqw; }
.rk-hp__bar { width: 20cqw; height: 3.6cqw; background: #c00; }
.rk-hp__fill { height: 100%; background: #ff0; }
.rk-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2cqw; padding: 1cqw 0.5cqw 0; }
.rk-btn { display: flex; align-items: center; justify-content: center; gap: 1.2cqw; background: #000; border: 0.6cqw solid #ff7f27; color: #ff7f27; font-family: var(--font-pixel), monospace; font-size: 3cqw; padding: 1.5cqw 0; cursor: pointer; }
.rk-btn--on { border-color: #ff0; color: #ff0; }
.rk-btn--dim .rk-btn__label { text-decoration: line-through; opacity: 0.7; }
.rk-btn[disabled] { cursor: default; }
`;

export default function RoarKnightGame() {
  const { play, setBgmPaused } = useSound();
  const playRef = useRef(play);
  const bgmRef = useRef(setBgmPaused);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bossRef = useRef<HTMLImageElement>(null);
  const engineRef = useRef<Engine | null>(null);

  // Update ref di effect, bukan saat render (aturan react-hooks)
  useEffect(() => {
    playRef.current = play;
    bgmRef.current = setBgmPaused;
  }, [play, setBgmPaused]);

  const [phase, setPhase] = useState<Phase>("intro");
  useEffect(() => {
    bgmRef.current(phase === "lost");
  }, [phase]);
  // pastikan BGM tidak tertahan kalau komponen ditinggalkan saat game over
  useEffect(() => () => bgmRef.current(false), []);
  const [menuIdx, setMenuIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [text, setText] = useState("");
  const [hp, setHp] = useState(PLAYER_MAX_HP);
  const [items, setItems] = useState<Item[]>(START_ITEMS);

  // meta battle (tidak perlu me-render ulang)
  const meta = useRef({ turn: 0, novaDone: false, justNova: false, guardDown: false });
  const typed = useRef(false);

  // cermin state terbaru untuk handler keyboard & callback engine
  const ui = useRef({ phase, menuIdx, subIdx, items });
  useEffect(() => {
    ui.current = { phase, menuIdx, subIdx, items };
  }, [phase, menuIdx, subIdx, items]);

  const showText = (t: string) => {
    typed.current = false;
    setText(t);
  };

  const beginEnemyTurn = () => {
    const eng = engineRef.current;
    if (!eng) return;
    const m = meta.current;
    let kind: AttackKind;
    // HARD: kesulitan awal 1.2, naik 0.25 tiap putaran 5 serangan
    const diff = 1.2 + Math.floor(m.turn / FIRST_ORDER.length) * 0.25;
    if (!m.novaDone && eng.bossHp <= NOVA_THRESHOLD) {
      kind = "nova";
      m.novaDone = true;
      m.justNova = true;
    } else {
      const order = m.turn < FIRST_ORDER.length ? FIRST_ORDER : LATER_ORDER;
      kind = order[m.turn % order.length];
      m.turn++;
    }
    setPhase("enemy");
    eng.startEnemyTurn(kind, diff);
  };

  const backToMenu = () => {
    const m = meta.current;
    setPhase("menu");
    if (m.justNova) {
      m.justNova = false;
      m.guardDown = true;
      showText("* The Roaring Knight lowers its blade.\n* Its guard is down!");
    } else {
      showText(FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);
    }
  };

  const startBattle = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.reset();
    meta.current = { turn: 0, novaDone: false, justNova: false, guardDown: false };
    setHp(PLAYER_MAX_HP);
    setItems(START_ITEMS.map((i) => ({ ...i })));
    setMenuIdx(0);
    setSubIdx(0);
    playRef.current("encounter");
    setPhase("menu");
    showText("* The Roaring Knight appeared.");
  };

  const dialog = (t: string) => {
    setPhase("dialog");
    showText(t);
  };

  const advanceDialog = () => beginEnemyTurn();

  const confirmMenu = (idx: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    playRef.current("select");
    if (idx === 0) {
      setPhase("bar");
      eng.startFightBar(meta.current.guardDown);
    } else if (idx === 1) {
      setSubIdx(0);
      setPhase("act");
    } else if (idx === 2) {
      setSubIdx(0);
      setPhase("item");
    } else {
      playRef.current("back");
      showText("* The Roaring Knight can't be spared.\n* There is no mercy here.");
    }
  };

  const doAct = (i: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    playRef.current("select");
    if (i === 0) {
      dialog(
        "* ROARING KNIGHT - ATK ?? DEF ??\n* Its blade never rests. Wear it down before it lets its guard fall."
      );
    } else if (eng.speedBonus) {
      dialog("* You're already holding your breath.");
    } else {
      eng.speedBonus = true;
      dialog("* You held your breath.\n* Your SOUL feels lighter. SPEED up!");
    }
  };

  const doItem = (i: number) => {
    const eng = engineRef.current;
    const it = ui.current.items[i];
    if (!eng || !it || it.left <= 0) {
      playRef.current("back");
      return;
    }
    playRef.current("heal");
    const before = eng.hp;
    eng.heal(it.heal);
    const gained = eng.hp - before;
    setItems((prev) => prev.map((x, n) => (n === i ? { ...x, left: x.left - 1 } : x)));
    dialog(
      `* You used the ${it.name}.\n* ${eng.hp >= PLAYER_MAX_HP ? "HP maxed out!" : `Recovered ${gained} HP.`}`
    );
  };

  // fungsi terbaru diakses engine / keyboard lewat ref (hindari closure basi)
  const fns = useRef({ beginEnemyTurn, backToMenu, startBattle, confirmMenu, doAct, doItem, advanceDialog });
  useEffect(() => {
    fns.current = { beginEnemyTurn, backToMenu, startBattle, confirmMenu, doAct, doItem, advanceDialog };
  }, [beginEnemyTurn, backToMenu, startBattle, confirmMenu, doAct, doItem, advanceDialog]);

  /* ---------- engine ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, bossRef.current, (n) => playRef.current(n), {
      onHp: (v) => setHp(v),
      onTurnEnd: () => fns.current.backToMenu(),
      onFightDone: () => {
        const eng = engineRef.current;
        if (eng && eng.bossHp <= 0) {
          playRef.current("mercy");
          setPhase("won");
          typed.current = false;
          setText("* YOU WON!\n* The Roaring Knight fades into the dark.");
        } else {
          fns.current.beginEnemyTurn();
        }
      },
      onDeath: () => {
        playRef.current("hurt");
        setPhase("lost");
      },
    });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

    // kembali dari submenu: tampilkan flavor baru
    const showTextSafe = () => {
      typed.current = false;
      setText(FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);
    };

    const onDown = (e: KeyboardEvent) => {
      if (!e.isTrusted) return; // abaikan event sintetis (lihat skip teks)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const { phase: ph, menuIdx: mi, subIdx: si, items: its } = ui.current;
      const eng = engineRef.current;
      if (!eng) return;

      // gerak SOUL saat giliran Knight
      if (ARROWS.includes(e.key)) {
        eng.keys.add(e.key);
        if (ph !== "intro" && ph !== "lost") e.preventDefault();
      }
      if (ph === "enemy") return;

      const confirm = e.key === "z" || e.key === "Z" || e.key === "Enter";
      const cancel = e.key === "x" || e.key === "X" || e.key === "Shift";

      if (ph === "bar") {
        if (confirm && !e.repeat) {
          e.preventDefault();
          eng.pressConfirm();
        }
        return;
      }

      if (ph === "menu") {
        if (e.key === "ArrowLeft") {
          const n = (mi + MENU.length - 1) % MENU.length;
          setMenuIdx(n);
          playRef.current("move");
        } else if (e.key === "ArrowRight") {
          const n = (mi + 1) % MENU.length;
          setMenuIdx(n);
          playRef.current("move");
        } else if (confirm && !e.repeat) {
          e.preventDefault();
          fns.current.confirmMenu(mi);
        }
        return;
      }

      if (ph === "act" || ph === "item") {
        const len = ph === "act" ? ACTS.length : its.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          setSubIdx((si + len - 1) % len);
          playRef.current("move");
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          setSubIdx((si + 1) % len);
          playRef.current("move");
        } else if (confirm && !e.repeat) {
          e.preventDefault();
          if (ph === "act") fns.current.doAct(si);
          else fns.current.doItem(si);
        } else if (cancel && !e.repeat) {
          setPhase("menu");
          showTextSafe();
          playRef.current("back");
        }
        return;
      }

      if (ph === "dialog") {
        if (confirm && !e.repeat) {
          e.preventDefault();
          if (typed.current) fns.current.advanceDialog();
          else window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })); // skip ketikan
        }
        return;
      }

      if (ph === "won" && confirm && !e.repeat) {
        e.preventDefault();
        fns.current.startBattle();
      }
    };

    const onUp = (e: KeyboardEvent) => engineRef.current?.keys.delete(e.key);
    const onBlur = () => engineRef.current?.keys.clear();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* ---------- game over (reuse komponen GameOver) ---------- */
  const handleGameOverPhase = (p: GameOverPhase) => {
    if (p === "crack") playRef.current("crack");
    else if (p === "shatter") playRef.current("shatter");
    else if (p === "text") playRef.current("gameover");
  };
  const handleGameOverDone = () => {
    engineRef.current?.reset();
    setPhase("intro");
  };

  /* ---------- render ---------- */
  const showOverlay =
    phase === "menu" || phase === "act" || phase === "item" || phase === "dialog" || phase === "won";
  const menuActive = phase === "menu" || phase === "act" || phase === "item";
  const typedText = (
    <TypewriterText
      key={text}
      text={text}
      speed={26}
      className="rk-text"
      onComplete={() => {
        typed.current = true;
      }}
    />
  );

  return (
    <section className="ut-section ut-roar">
      <style>{CSS}</style>

      <div className="ut-section__head">
        <h2 className="ut-section__title">THE ROARING KNIGHT</h2>
        <p className="ut-section__sub">* SECRET BOSS</p>
      </div>

      <div className="rk-wrap">
        <div className="rk-stage">
          <canvas
            ref={canvasRef}
            className="rk-canvas"
            aria-label="Battle arena: The Roaring Knight"
            role="img"
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={bossRef}
            src={BOSS_IMG}
            alt="The Roaring Knight"
            className="rk-boss"
            draggable={false}
          />

          {showOverlay && (
            <div className="rk-overlay">
              {(phase === "menu" || phase === "dialog" || phase === "won") && typedText}

              {phase === "won" && (
                <button type="button" className="rk-go" style={{ marginTop: "2cqw" }} onClick={() => fns.current.startBattle()}>
                  PLAY AGAIN
                </button>
              )}

              {phase === "act" && (
                <div className="rk-list">
                  {ACTS.map((a, i) => (
                    <button
                      key={a}
                      type="button"
                      className="rk-item"
                      onMouseEnter={() => i !== subIdx && (setSubIdx(i), playRef.current("move"))}
                      onClick={() => fns.current.doAct(i)}
                    >
                      <span className="rk-soulslot">{subIdx === i && <SoulHeart size={14} animated={false} />}</span>
                      * {a}
                    </button>
                  ))}
                </div>
              )}

              {phase === "item" && (
                <div className="rk-list">
                  {items.map((it, i) => (
                    <button
                      key={it.name}
                      type="button"
                      className="rk-item"
                      disabled={it.left <= 0}
                      onMouseEnter={() => i !== subIdx && (setSubIdx(i), playRef.current("move"))}
                      onClick={() => fns.current.doItem(i)}
                    >
                      <span className="rk-soulslot">{subIdx === i && <SoulHeart size={14} animated={false} />}</span>
                      * {it.name} x{it.left}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {phase === "intro" && (
            <div className="rk-intro">
              <p>* The ROARING KNIGHT draws near!</p>
              <button type="button" className="rk-go" onClick={() => fns.current.startBattle()} onMouseEnter={() => play("move")}>
                FIGHT
              </button>
            </div>
          )}
        </div>

        <div className="rk-hud">
          <span className="rk-hud__name">{String(PLAYER.name).toUpperCase()}</span>
          <span className="rk-hud__lbl">LV {PLAYER.level}</span>
          <span className="rk-hp">
            <span className="rk-hud__lbl">HP</span>
            <span className="rk-hp__bar">
              <span className="rk-hp__fill" style={{ display: "block", width: `${(hp / PLAYER_MAX_HP) * 100}%` }} />
            </span>
            <span>
              {hp} / {PLAYER_MAX_HP}
            </span>
          </span>
        </div>

        <div className="rk-btns">
          {MENU.map((label, i) => {
            const on = menuActive && menuIdx === i;
            return (
              <button
                key={label}
                type="button"
                disabled={phase !== "menu"}
                className={`rk-btn ${on ? "rk-btn--on" : ""} ${label === "MERCY" ? "rk-btn--dim" : ""}`}
                onMouseEnter={() => {
                  if (phase === "menu" && menuIdx !== i) {
                    setMenuIdx(i);
                    playRef.current("move");
                  }
                }}
                onClick={() => phase === "menu" && fns.current.confirmMenu(i)}
              >
                <span className="rk-soulslot">{on && <SoulHeart size={14} animated={false} />}</span>
                <span className="rk-btn__label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="ut-roar-hint">
        [ ← → ↑ ↓ ] MOVE &nbsp;·&nbsp; [ Z / ENTER ] CONFIRM &nbsp;·&nbsp; [ X ] CANCEL — hit Z at the center of the bar!
      </p>

      {phase === "lost" && <GameOver onPhase={handleGameOverPhase} onDone={handleGameOverDone} />}
    </section>
  );
}