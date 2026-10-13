/**
 * Procedural 8-bit sound engine using the Web Audio API.
 *
 * Undertale's UI sounds are short square/blip tones. We synthesize them on the
 * fly so the project ships zero audio assets. All sounds are optional — if the
 * AudioContext cannot be created (e.g. SSR or unsupported browser), everything
 * degrades silently.
 */

export type SoundName =
  | "blip" // typewriter character tick
  | "move" // menu cursor movement
  | "select" // confirm an option
  | "back" // cancel / back
  | "hurt" // take damage
  | "heal" // heal / save
  | "save" // SAVE screen confirm
  | "encounter" // enemy encounter sting
  | "mercy" // spare sting
  | "turn" // end of turn / transition
  | "break" // soul shatter (game over)
  | "slash" // tebasan pedang (Knight / FIGHT)
  | "roar" // raungan Roaring Knight
  | "alert" // "!" muncul saat encounter
  | "fall" // soul meluncur ke bawah saat encounter
  | "crack" // soul cracks in half (game over, step 2)
  | "shatter" // soul shards scatter (game over, step 3)
  | "gameover"; // game over jingle

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;

  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AC) return null;

  try {
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(ctx.destination);
  } catch {
    return null;
  }

  return ctx;
}

/** Browsers start the AudioContext suspended until a user gesture. */
export function resumeAudio(): void {
  const context = getCtx();
  if (context && context.state === "suspended") {
    void context.resume();
  }
}

type ToneOptions = {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  sweepTo?: number;
};

function tone({
  freq,
  duration = 0.08,
  type = "square",
  volume = 0.5,
  delay = 0,
  sweepTo,
}: ToneOptions): void {
  const context = getCtx();
  if (!context || !masterGain) return;

  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
  }

  // Sharp envelope: instant attack, quick decay — chiptek style.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

type NoiseOptions = {
  duration?: number;
  volume?: number;
  delay?: number;
  /** Highpass cutoff (Hz) — makin tinggi makin "kaca". */
  highpass?: number;
};

/** Semburan white-noise pendek, untuk suara retak/pecah. */
function noise({
  duration = 0.1,
  volume = 0.4,
  delay = 0,
  highpass = 1500,
}: NoiseOptions = {}): void {
  const context = getCtx();
  if (!context || !masterGain) return;

  const start = context.currentTime + delay;
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const src = context.createBufferSource();
  src.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpass;

  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(start);
  src.stop(start + duration + 0.02);
}

const SOUND_PRESETS: Record<SoundName, () => void> = {
  // Voice teks: blip square sangat pendek, nada tetap (tanpa jitter acak),
  // diputar di tiap huruf sehingga terdengar seperti "bip-bip-bip" game aslinya.
  blip: () => tone({ freq: 520, duration: 0.022, type: "square", volume: 0.2 }),
  move: () => tone({ freq: 660, duration: 0.05, volume: 0.35 }),
  select: () => {
    tone({ freq: 660, duration: 0.05, volume: 0.4 });
    tone({ freq: 880, duration: 0.07, volume: 0.4, delay: 0.05 });
  },
  back: () => tone({ freq: 330, duration: 0.07, volume: 0.35, sweepTo: 180 }),
  hurt: () => {
    tone({ freq: 220, duration: 0.12, type: "sawtooth", volume: 0.45, sweepTo: 90 });
    tone({ freq: 160, duration: 0.18, type: "square", volume: 0.3, delay: 0.06 });
  },
  heal: () => {
    tone({ freq: 523, duration: 0.08, volume: 0.35 });
    tone({ freq: 659, duration: 0.08, volume: 0.35, delay: 0.07 });
    tone({ freq: 784, duration: 0.14, volume: 0.35, delay: 0.14 });
  },
  save: () => {
    tone({ freq: 587, duration: 0.1, volume: 0.4 });
    tone({ freq: 880, duration: 0.18, volume: 0.4, delay: 0.09 });
  },
  encounter: () => {
    tone({ freq: 180, duration: 0.1, type: "square", volume: 0.45 });
    tone({ freq: 240, duration: 0.1, type: "square", volume: 0.45, delay: 0.1 });
    tone({ freq: 320, duration: 0.2, type: "square", volume: 0.45, delay: 0.2 });
  },
  mercy: () => {
    tone({ freq: 660, duration: 0.09, volume: 0.35 });
    tone({ freq: 990, duration: 0.09, volume: 0.35, delay: 0.08 });
    tone({ freq: 1320, duration: 0.2, volume: 0.3, delay: 0.16 });
  },
  turn: () => {
    tone({ freq: 392, duration: 0.07, volume: 0.3 });
    tone({ freq: 523, duration: 0.12, volume: 0.3, delay: 0.07 });
  },
  break: () => {
    // suara pecahan kristal: nada tinggi cepat turun + noise klik
    tone({ freq: 1200, duration: 0.05, type: "triangle", volume: 0.4 });
    tone({ freq: 800, duration: 0.06, type: "triangle", volume: 0.35, delay: 0.05 });
    tone({ freq: 500, duration: 0.1, type: "square", volume: 0.25, delay: 0.1 });
  },
  slash: () => {
    noise({ duration: 0.12, volume: 0.45, highpass: 2200 });
    tone({ freq: 1400, duration: 0.1, type: "triangle", volume: 0.3, sweepTo: 200 });
  },
  roar: () => {
    noise({ duration: 0.7, volume: 0.4, highpass: 250 });
    tone({ freq: 95, duration: 0.8, type: "sawtooth", volume: 0.45, sweepTo: 42 });
    tone({ freq: 190, duration: 0.55, type: "square", volume: 0.25, delay: 0.08, sweepTo: 60 });
  },
  alert: () => tone({ freq: 1046, duration: 0.09, type: "square", volume: 0.4 }),
  fall: () => {
    // soul meluncur: nada turun panjang, seperti suara masuk ke battle
    tone({ freq: 900, duration: 0.65, type: "square", volume: 0.28, sweepTo: 120 });
    tone({ freq: 450, duration: 0.65, type: "triangle", volume: 0.25, sweepTo: 60 });
  },
  crack: () => {
    // retakan tajam: klik noise + nada tinggi jatuh cepat
    noise({ duration: 0.05, volume: 0.55, highpass: 2500 });
    tone({ freq: 1500, duration: 0.07, type: "square", volume: 0.45, sweepTo: 300 });
  },
  shatter: () => {
    // ledakan kaca + serpihan berdenting, selaras dengan jeda 45 ms tiap serpihan
    noise({ duration: 0.28, volume: 0.5, highpass: 3000 });
    for (let i = 0; i < 9; i++) {
      tone({
        freq: 1600 + Math.random() * 2600,
        duration: 0.05 + Math.random() * 0.08,
        type: "triangle",
        volume: 0.22,
        delay: 0.02 + i * 0.045,
        sweepTo: 700 + Math.random() * 500,
      });
    }
  },
  gameover: () => {
    // tema pelan: turun murung (E-D-C-B), lalu naik jadi akor A minor "determination"
    const melody: [number, number, number][] = [
      [330, 0.5, 0],
      [294, 0.5, 0.5],
      [262, 0.5, 1.0],
      [247, 0.45, 1.5],
    ];
    melody.forEach(([freq, duration, delay]) => {
      tone({ freq, duration, type: "triangle", volume: 0.32, delay });
      tone({ freq: freq / 2, duration, type: "square", volume: 0.08, delay });
    });

    tone({ freq: 262, duration: 0.3, type: "triangle", volume: 0.32, delay: 2.0 });
    tone({ freq: 330, duration: 0.3, type: "triangle", volume: 0.32, delay: 2.3 });
    // akor akhir A minor
    [220, 262, 330, 440].forEach((freq) =>
      tone({ freq, duration: 0.9, type: "triangle", volume: 0.26, delay: 2.6 })
    );
    tone({ freq: 110, duration: 0.9, type: "square", volume: 0.1, delay: 2.6 });
  },
};

export function playSound(name: SoundName): void {
  const context = getCtx();
  if (!context) return;
  if (context.state === "suspended") return; // wait for a user gesture
  SOUND_PRESETS[name]();
}

const DEFAULT_VOLUME = 0.18;

export function setMasterVolume(value?: number): void {
  if (masterGain) masterGain.gain.value = value ?? DEFAULT_VOLUME;
}