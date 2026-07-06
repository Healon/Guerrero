// ============================================================
// WebAudio 合成音效與 BGM（無任何外部音檔）
// ============================================================
import { AUDIO } from '../config.js';

let ctx = null;
let master = null;
let sfxBus = null;
let bgmBus = null;
let muted = false;
let noiseBuf = null;

const bgm = { timer: null, step: 0, nextTime: 0, bpm: AUDIO.bgmBpm, mode: null };

function ensure() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : AUDIO.master;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = AUDIO.sfx;
    sfxBus.connect(master);
    bgmBus = ctx.createGain();
    bgmBus.gain.value = AUDIO.bgm;
    bgmBus.connect(master);
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return true;
  } catch (e) {
    return false;
  }
}

export function unlockAudio() {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : AUDIO.master;
}
export function isMuted() { return muted; }

function tone({ type = 'square', f0 = 440, f1 = null, dur = 0.1, vol = 0.4, delay = 0, bus = null }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(25, f0), t0);
  if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(25, f1), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(bus || sfxBus);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.15, vol = 0.35, f = 1200, f1 = null, q = 0.7, type = 'bandpass', delay = 0, bus = null }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const flt = ctx.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(f, t0);
  if (f1 != null) flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
  flt.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(bus || sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

export const sfx = {
  jump()      { tone({ type: 'square', f0: 170, f1: 340, dur: 0.11, vol: 0.3 }); },
  swing()     { noise({ f: 2600, f1: 700, dur: 0.09, vol: 0.28, q: 1.2 }); },
  hit()       { tone({ type: 'square', f0: 270, f1: 70, dur: 0.09, vol: 0.4 }); noise({ f: 900, dur: 0.05, vol: 0.2 }); },
  crate()     { noise({ type: 'lowpass', f: 620, dur: 0.18, vol: 0.5 }); tone({ type: 'square', f0: 95, f1: 55, dur: 0.12, vol: 0.3 }); },
  pickup()    { tone({ type: 'triangle', f0: 760, dur: 0.06, vol: 0.3 }); tone({ type: 'triangle', f0: 1180, dur: 0.09, vol: 0.28, delay: 0.06 }); },
  heart()     { tone({ type: 'triangle', f0: 520, dur: 0.08, vol: 0.3 }); tone({ type: 'triangle', f0: 780, dur: 0.12, vol: 0.3, delay: 0.08 }); },
  hurt()      { tone({ type: 'sawtooth', f0: 300, f1: 80, dur: 0.22, vol: 0.4 }); },
  die()       { tone({ type: 'sawtooth', f0: 260, f1: 45, dur: 0.6, vol: 0.4 }); noise({ f: 400, f1: 90, dur: 0.5, vol: 0.25, type: 'lowpass' }); },
  checkpoint(){ [523, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.1, vol: 0.28, delay: i * 0.09 })); },
  spike()     { tone({ type: 'sawtooth', f0: 340, f1: 90, dur: 0.18, vol: 0.4 }); },
  bossRoar()  { tone({ type: 'sawtooth', f0: 130, f1: 42, dur: 0.7, vol: 0.5 }); noise({ type: 'lowpass', f: 300, dur: 0.7, vol: 0.3 }); },
  bossHit()   { tone({ type: 'square', f0: 190, f1: 95, dur: 0.08, vol: 0.4 }); },
  bossSlam()  { noise({ type: 'lowpass', f: 240, dur: 0.35, vol: 0.55 }); tone({ type: 'square', f0: 70, f1: 40, dur: 0.3, vol: 0.4 }); },
  bossThrow() { noise({ f: 1800, f1: 500, dur: 0.25, vol: 0.3, q: 2 }); },
  bossDie()   {
    [0, 0.18, 0.36, 0.55].forEach((d) => noise({ type: 'lowpass', f: 500, dur: 0.22, vol: 0.4, delay: d }));
    tone({ type: 'sawtooth', f0: 200, f1: 30, dur: 1.1, vol: 0.4, delay: 0.3 });
  },
  clear()     {
    [659, 784, 988, 1319, 988, 1319].forEach((f, i) =>
      tone({ type: 'triangle', f0: f, dur: 0.14, vol: 0.3, delay: i * 0.13 }));
  },
  blip()      { tone({ type: 'square', f0: 880, dur: 0.05, vol: 0.25 }); },
  wave()      { tone({ type: 'square', f0: 540, f1: 920, dur: 0.07, vol: 0.2 }); noise({ f: 2800, f1: 4400, dur: 0.06, vol: 0.12, q: 2 }); },
  powerup()   {
    [440, 554, 659, 880, 1108].forEach((f, i) =>
      tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.3, delay: i * 0.07 }));
    noise({ f: 5000, f1: 8000, dur: 0.25, vol: 0.07, delay: 0.36 });
  }
};

// ---------- BGM 音序器 ----------
const midi2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

// A 小調，2 小節 16 分音符（32 步）
const BASS_SEQ = [
  45, 0, 45, 0, 52, 0, 45, 0, 48, 0, 45, 0, 43, 0, 45, 0,
  45, 0, 45, 0, 52, 0, 45, 0, 48, 0, 50, 0, 43, 0, 40, 0
];
const LEAD_SEQ = [
  69, 0, 0, 0, 72, 0, 76, 0, 74, 0, 72, 0, 71, 0, 0, 0,
  69, 0, 0, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 71, 0
];

function playStep(step, t, mode) {
  const when = Math.max(0, t - ctx.currentTime);
  const bass = BASS_SEQ[step];
  if (bass) {
    tone({ type: 'square', f0: midi2f(bass), dur: 0.12, vol: 0.2, delay: when, bus: bgmBus });
  }
  const lead = LEAD_SEQ[step];
  if (lead) {
    tone({ type: 'triangle', f0: midi2f(lead + (mode === 'boss' ? 12 : 0)), dur: 0.18, vol: mode === 'boss' ? 0.17 : 0.13, delay: when, bus: bgmBus });
  }
  if (step % 4 === 2) {
    noise({ f: 6000, dur: 0.03, vol: 0.05, delay: when, bus: bgmBus });
  }
  if (mode === 'boss' && step % 8 === 4) {
    noise({ type: 'lowpass', f: 400, dur: 0.1, vol: 0.18, delay: when, bus: bgmBus });
  }
}

export function startBgm(mode = 'level') {
  if (!ensure()) return;
  stopBgm();
  bgm.mode = mode;
  bgm.bpm = mode === 'boss' ? AUDIO.bossBpm : AUDIO.bgmBpm;
  bgm.step = 0;
  bgm.nextTime = ctx.currentTime + 0.08;
  bgm.timer = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    while (bgm.nextTime < ctx.currentTime + 0.18) {
      playStep(bgm.step, bgm.nextTime, bgm.mode);
      bgm.nextTime += 60 / bgm.bpm / 4;
      bgm.step = (bgm.step + 1) % 32;
    }
  }, 55);
}

export function stopBgm() {
  if (bgm.timer) {
    clearInterval(bgm.timer);
    bgm.timer = null;
  }
  bgm.mode = null;
}

export function bgmMode() { return bgm.mode; }
