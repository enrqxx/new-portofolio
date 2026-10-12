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
  | "turn"; // end of turn / transition

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

const SOUND_PRESETS: Record<SoundName, () => void> = {
  blip: () => tone({ freq: 440 + Math.random() * 60, duration: 0.03, volume: 0.22 }),
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
