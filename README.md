# 🎮 Yusyfi — Undertale Portfolio

Portfolio pribadi bertema **Undertale**, dibangun dengan Next.js 16 (App Router), React 19, dan Tailwind CSS v4. Semua suara dibuat secara prosedural lewat Web Audio API — zero audio asset untuk SFX.

## ✨ Fitur

- **SAVE screen pembuka** — "* You're filled with DETERMINATION." + menu SAVE / CONTINUE / RESET (keyboard & mouse)
- **Game Over animation** — soul bergetar, retak, pecah, lalu "STAY DETERMINED!" saat RESET
- **5 section utama** (multi-page, bukan landing page):
  - `/about` — **CHECK** — about + stats (ATK/DEF/SPD/DEX)
  - `/skills` — **STATS** — skill sebagai menu ITEM ala Undertale (icon-only, tanpa bar)
  - `/projects` — **ENCOUNTERS** — project sebagai enemy encounter
  - `/experience` — **JOURNEY** — riwayat dalam bentuk dialog
  - `/contact` — **MERCY** — kontak + WhatsApp + email
- **Mini game rahasia** di `/roar` — **The Roaring Knight** (boss Deltarune), bullet-hell battle dengan canvas engine
- **Sound engine prosedural** — blip, move, select, hurt, heal, save, encounter, mercy, crack, shatter, gameover
- **BGM route-aware** — "Vs. Lancer" (default) & "Roaring Knight" (di halaman game), volume 5%
- **Pixel art UI** — Press Start 2P + VT323 fonts, scanlines CRT, soul hati merah, battle box

## 🎯 Cara main

| Kontrol | Fungsi |
|---|---|
| **← → ↑ ↓** | Navigasi menu / gerak SOUL |
| **Z / Enter** | Confirm / serang |
| **X / Shift / Esc** | Cancel / kembali |
| **Klik** | Semua juga bisa pakai mouse |

## 🛠️ Development

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

## 🚀 Deploy ke Vercel

Project ini siap deploy tanpa konfigurasi tambahan:

1. Push repository ke GitHub
2. Buka [vercel.com/new](https://vercel.com/new) lalu import repository
3. Klik **Deploy** — tidak perlu setting env variable

Atau pakai Vercel CLI:

```bash
npm i -g vercel
vercel
```

## 📁 Struktur

```
src/
├── app/
│   ├── (game)/            # Route group: about, skills, projects, experience, contact, roar
│   ├── layout.tsx         # Root layout: fonts, SoundProvider, BgmPlayer
│   ├── page.tsx           # SAVE screen + Hub
│   └── globals.css        # Theme Undertale (colors, animations, battle box)
├── components/
│   ├── sections/          # 5 section utama
│   ├── ui/                # SoulHeart, TypewriterText, HealthBar, icons
│   ├── providers/         # SoundProvider
│   ├── SaveScreen.tsx
│   ├── GameOver.tsx
│   ├── Hub.tsx
│   ├── FloatingHud.tsx    # HP bar + mute + now playing
│   ├── BgmPlayer.tsx      # BGM route-aware
│   └── RoarKnightGame.tsx # Mini game (canvas engine)
└── lib/
    ├── data.ts            # SEMUA konten portfolio (nama, skills, projects, kontak)
    └── sound.ts           # Sound engine prosedural
```

## ✏️ Customize

Semua konten ada di **`src/lib/data.ts`** — nama, role, avatar, skills, projects, journey, kontak, dan teks SAVE screen. Ganti di situ saja, langsung tersimpan ke seluruh halaman.

Ganti avatar: timpa `public/img/avatar.jpeg`.

Ganti BGM: timpa `public/audio/vs-lancer.mp3` & `public/audio/roaring-knight.mp3`.

## 📝 Catatan

- Browser membatasi autoplay audio, jadi BGM & SFX baru mulai setelah klik pertama (SAVE screen)
- Preferensi mute disimpan di `localStorage`
- Mini game di `/roar` pakai canvas + `requestAnimationFrame`, state di luar React untuk performa
