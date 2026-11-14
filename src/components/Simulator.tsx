import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Play,
  RotateCcw,
  Rocket,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import SectionHeader from "./SectionHeader";

/* ---------------------------------------------------------- types ---- */
type Phase = "idle" | "countdown" | "flying" | "landed" | "crashed";
type Tone = "ok" | "warn" | "danger" | "dim";

interface Diff {
  key: string;
  label: string;
  fuel: number;
  padW: number;
  drift: number;
  rough: number;
  mult: number;
  desc: string;
  maxVy: number;
  maxVx: number;
  maxTiltDeg: number;
  burnRate: number;
}

const DIFFS: Diff[] = [
  {
    key: "cadet",
    label: "CADET",
    fuel: 260,
    padW: 280,
    drift: 6,
    rough: 0.45,
    mult: 1,
    desc: "WIDE LZ · DEEP TANKS · STABILIZED SAS",
    maxVy: 4.2,
    maxVx: 3.4,
    maxTiltDeg: 24,
    burnRate: 6.8,
  },
  {
    key: "pilot",
    label: "PILOT",
    fuel: 190,
    padW: 190,
    drift: 12,
    rough: 0.85,
    mult: 2,
    desc: "NOMINAL APOLLO P66 PROFILE",
    maxVy: 3.2,
    maxVx: 2.4,
    maxTiltDeg: 18,
    burnRate: 8.2,
  },
  {
    key: "commander",
    label: "COMMANDER",
    fuel: 130,
    padW: 110,
    drift: 20,
    rough: 1.4,
    mult: 3,
    desc: "TIGHT FUEL MARGIN · NEEDLE-THREADING",
    maxVy: 2.5,
    maxVx: 1.8,
    maxTiltDeg: 13,
    burnRate: 9.5,
  },
];

interface Pad { x: number; w: number; label: string }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
}
interface LogMsg { id: number; tag: string; msg: string; tone: Tone }
interface Result {
  ok: boolean;
  title: string;
  detail: string;
  score: number;
  vs: number; hs: number; tilt: number; fuelPct: number;
}

/* ---------------------------------------------------------- audio ---- */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engGain: GainNode | null = null;
  private muted = false;

  ensure() {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.4;
      this.master.connect(this.ctx.destination);

      const len = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lp = lp * 0.85 + white * 0.15;
        d[i] = lp * 2.4;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 200;
      bp.Q.value = 0.5;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start();
      this.engGain = g;
    } else if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.4, this.ctx.currentTime + 0.08);
    }
  }

  engine(level: number) {
    if (!this.engGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const target = level > 0.02 ? 0.1 + level * 0.28 : 0;
    this.engGain.gain.cancelScheduledValues(t);
    this.engGain.gain.linearRampToValueAtTime(target, t + 0.1);
  }

  beep(freq = 880, dur = 0.07, type: OscillatorType = "square", vol = 0.1) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  success() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.16, "sine", 0.16), i * 120)
    );
  }

  crash() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.55);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.65);
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.5;
    s.connect(g2); g2.connect(this.master);
    s.start(t);
  }
}

/* ---------------------------------------------------------- world ---- */
const SEG = 20;
const W = 7200;
const N = Math.floor(W / SEG) + 1;
const GRAV = 6.4;
const THRUST_A = 15.6;
const ROT = 1.9;
const FOOT = 7.6;

interface GState {
  phase: Phase;
  x: number; y: number; vx: number; vy: number;
  theta: number; fuel: number; fuelMax: number; thrust: number;
  dead: boolean;
  camX: number; camY: number; camScale: number;
  terrain: number[];
  pads: Pad[];
  target: Pad;
  particles: Particle[];
  shake: number; flash: number;
  flags: Set<string>;
  stars: { x: number; y: number; r: number; p: number }[];
  idleT: number;
}

function makeTerrain(rough: number, pads: Pad[]): number[] {
  const t = new Array<number>(N);
  let v = 0;
  for (let i = 0; i < N; i++) {
    v += (Math.random() - 0.5) * 34 * rough;
    v *= 0.92;
    t[i] = v;
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < N - 1; i++) t[i] = (t[i - 1] + t[i] * 2 + t[i + 1]) / 4;
  }
  // flatten pads with soft shoulders
  for (const p of pads) {
    const i0 = Math.floor(p.x / SEG);
    const i1 = Math.ceil((p.x + p.w) / SEG);
    for (let i = i0; i <= i1; i++) t[i] = 0;
    const blend = 10;
    for (let k = 1; k <= blend; k++) {
      const f = k / (blend + 1);
      if (i0 - k >= 0) t[i0 - k] *= f;
      if (i1 + k < N) t[i1 + k] *= f;
    }
  }
  return t;
}

function surfaceY(t: number[], x: number): number {
  const fx = Math.min(Math.max(x / SEG, 0), N - 1.001);
  const i = Math.floor(fx);
  return t[i] + (t[i + 1] - t[i]) * (fx - i);
}

const TONE_COLOR: Record<Tone, string> = {
  ok: "#9dffb0",
  warn: "#ffb454",
  danger: "#ff5064",
  dim: "#8a93a8",
};

/* ---------------------------------------------------------- component */
export default function Simulator() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [diffKey, setDiffKey] = useState("pilot");
  const [muted, setMuted] = useState(false);
  const [log, setLog] = useState<LogMsg[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const sfxRef = useRef<Sfx>(new Sfx());
  const keysRef = useRef<Set<string>>(new Set());
  const diffRef = useRef<Diff>(DIFFS[1]);
  const logId = useRef(0);

  // HUD refs (updated imperatively per frame)
  const altEl = useRef<HTMLSpanElement>(null);
  const vsEl = useRef<HTMLSpanElement>(null);
  const hsEl = useRef<HTMLSpanElement>(null);
  const tiltEl = useRef<HTMLSpanElement>(null);
  const fuelEl = useRef<HTMLDivElement>(null);
  const fuelTxt = useRef<HTMLSpanElement>(null);
  const thrustEl = useRef<HTMLDivElement>(null);
  const tgtEl = useRef<HTMLSpanElement>(null);

  const gRef = useRef<GState>({
    phase: "idle",
    x: 0, y: -1000, vx: 0, vy: 0, theta: 0, fuel: 100, fuelMax: 100, thrust: 0,
    dead: false,
    camX: 0, camY: 0, camScale: 0.6,
    terrain: [],
    pads: [],
    target: { x: 0, w: 0, label: "B" },
    particles: [],
    shake: 0, flash: 0,
    flags: new Set(),
    stars: [],
    idleT: 0,
  });

  const pushLog = (tag: string, msg: string, tone: Tone = "dim") => {
    const id = ++logId.current;
    setLog((l) => [...l.slice(-4), { id, tag, msg, tone }]);
  };

  const resetWorld = (d: Diff) => {
    const g = gRef.current;
    const p1: Pad = { x: W * 0.2 + Math.random() * 300, w: d.padW, label: "A" };
    const p2: Pad = { x: W * 0.48 + Math.random() * 300, w: d.padW * 0.9, label: "B" };
    const p3: Pad = { x: W * 0.76 + Math.random() * 300, w: d.padW * 1.15, label: "C" };
    g.pads = [p1, p2, p3];
    g.terrain = makeTerrain(d.rough, g.pads);
    g.target = Math.random() < 0.5 ? p2 : Math.random() < 0.5 ? p1 : p3;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const spawnDist = d.key === "cadet" ? (260 + Math.random() * 180) : d.key === "pilot" ? (380 + Math.random() * 220) : (520 + Math.random() * 280);
    g.x = g.target.x + g.target.w / 2 + dir * spawnDist;
    g.y = d.key === "cadet" ? -680 : -760;
    g.vx = -dir * d.drift * (0.6 + Math.random() * 0.5);
    g.vy = 3.0;
    g.theta = 0;
    g.fuel = d.fuel;
    g.fuelMax = d.fuel;
    g.thrust = 0;
    g.dead = false;
    g.particles = [];
    g.shake = 0;
    g.flash = 0;
    g.flags = new Set();
    g.camX = g.x;
    g.camY = g.y;
    g.camScale = 0.62;
    if (g.stars.length === 0) {
      for (let i = 0; i < 180; i++) {
        g.stars.push({
          x: Math.random() * 1600,
          y: Math.random() * 900,
          r: 0.4 + Math.random() * 1.2,
          p: 0.15 + Math.random() * 0.55,
        });
      }
    }
  };

  const begin = (instant = false) => {
    sfxRef.current.ensure();
    const d = DIFFS.find((x) => x.key === diffRef.current.key)!;
    resetWorld(d);
    setResult(null);
    setLog([]);
    if (instant) {
      gRef.current.phase = "flying";
      setPhase("flying");
      pushLog("GUID", "DESCENT RE-INITIALISED", "ok");
      sfxRef.current.beep(660, 0.08, "square", 0.08);
      return;
    }
    gRef.current.phase = "countdown";
    setPhase("countdown");
    setCount(3);
    pushLog("GUID", "DESCENT PROGRAM LOADED // P63", "ok");
    let c = 3;
    sfxRef.current.beep(440, 0.09, "square", 0.1);
    const iv = setInterval(() => {
      c -= 1;
      if (c > 0) {
        setCount(c);
        sfxRef.current.beep(440, 0.09, "square", 0.1);
      } else {
        clearInterval(iv);
        setCount(0);
        gRef.current.phase = "flying";
        setPhase("flying");
        pushLog("NAV", "IGNITION // POWERED DESCENT INITIATED", "ok");
        sfxRef.current.beep(880, 0.16, "sine", 0.14);
      }
    }, 780);
  };

  /* main loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cw = 0, ch = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      cw = r.width; ch = r.height;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    resetWorld(diffRef.current);
    // park on pad B for idle attract mode
    const g = gRef.current;
    const parkPad = g.pads[1];
    g.x = parkPad.x + parkPad.w / 2;
    g.y = -FOOT;
    g.camX = g.x;
    g.camY = -40;
    g.camScale = 1.15;

    let raf = 0;
    let last = performance.now();

    const setRef = (el: HTMLSpanElement | null, text: string, tone?: Tone) => {
      if (!el) return;
      el.textContent = text;
      if (tone) el.style.color = TONE_COLOR[tone];
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 24);
      last = now;
      const keys = keysRef.current;
      const d = diffRef.current;

      /* ------- update ------- */
      if (g.phase === "flying" && !g.dead) {
        const wantThrust =
          (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space")) && g.fuel > 0;
        g.thrust += ((wantThrust ? 1 : 0) - g.thrust) * Math.min(1, dt * 14);
        sfxRef.current.engine(g.phase === "flying" ? g.thrust : 0);

        if (wantThrust) {
          g.fuel = Math.max(0, g.fuel - dt * d.burnRate);
        }
        const rotIn =
          (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
          (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
        if (rotIn !== 0) {
          g.theta += rotIn * ROT * dt;
        } else {
          // SAS Attitude Hold: actively restores vehicle to upright when steering is released
          g.theta -= g.theta * (d.key === "cadet" ? 3.4 : 2.4) * dt;
        }
        g.theta = Math.max(-1.1, Math.min(1.1, g.theta));

        const ta = THRUST_A * g.thrust;
        g.vx += Math.sin(g.theta) * ta * dt;
        g.vy += (GRAV - Math.cos(g.theta) * ta) * dt;
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // exhaust particles
        if (g.thrust > 0.05) {
          const nx = g.x - Math.sin(g.theta) * 4;
          const ny = g.y + Math.cos(g.theta) * 4.5;
          for (let i = 0; i < 3; i++) {
            g.particles.push({
              x: nx + (Math.random() - 0.5) * 2,
              y: ny,
              vx: -Math.sin(g.theta) * 40 + (Math.random() - 0.5) * 26,
              vy: Math.cos(g.theta) * (46 + Math.random() * 30),
              life: 1,
              max: 0.5 + Math.random() * 0.4,
              size: 1 + Math.random() * 2.2,
              color: Math.random() < 0.3 ? "#eaf0fb" : Math.random() < 0.6 ? "#ffb454" : "#ff8a4d",
            });
          }
        }

        const gy = surfaceY(g.terrain, g.x);
        const alt = gy - g.y - FOOT;

        // dust kicked near ground
        if (alt < 60 && (g.thrust > 0.1)) {
          for (let i = 0; i < 2; i++) {
            g.particles.push({
              x: g.x + (Math.random() - 0.5) * 60,
              y: gy - 1,
              vx: (Math.random() - 0.5) * 90,
              vy: -(4 + Math.random() * 14),
              life: 1, max: 0.9 + Math.random() * 0.5,
              size: 1 + Math.random() * 2,
              color: "#8a93a8",
            });
          }
        }

        // flavour logs
        if (alt < 780 && !g.flags.has("hg")) {
          g.flags.add("hg");
          pushLog("NAV", "HIGH GATE // ATTITUDE HOLD", "dim");
          sfxRef.current.beep(620, 0.06, "square", 0.07);
        }
        if (alt < 260 && !g.flags.has("lg")) {
          g.flags.add("lg");
          pushLog("NAV", "LOW GATE // DESIGNATOR ON LZ-" + g.target.label, "ok");
          sfxRef.current.beep(740, 0.06, "square", 0.07);
        }
        if (g.fuel / g.fuelMax < 0.32 && !g.flags.has("fa")) {
          g.flags.add("fa");
          pushLog("WARN", "FUEL ADVISORY // 30% REMAINING", "warn");
          sfxRef.current.beep(392, 0.14, "square", 0.1);
        }
        if (g.fuel <= 0 && !g.flags.has("fe")) {
          g.flags.add("fe");
          pushLog("WARN", "FUEL DEPLETED // BALLISTIC ARC", "danger");
          sfxRef.current.beep(233, 0.3, "sawtooth", 0.12);
        }

        // contact
        if (g.y + FOOT >= gy && g.vy > 0) {
          const pad = g.pads.find(
            (p) => g.x >= p.x - 6 && g.x <= p.x + p.w + 6
          );
          const vy = g.vy;
          const vx = Math.abs(g.vx);
          const th = Math.abs(g.theta);
          const thDeg = (th * 180) / Math.PI;

          const softOk = vy <= d.maxVy && vx <= d.maxVx && thDeg <= d.maxTiltDeg;
          const firmOk = vy <= d.maxVy * 1.35 && vx <= d.maxVx * 1.35 && thDeg <= d.maxTiltDeg * 1.35;

          if (pad && softOk) {
            g.phase = "landed";
            g.y = gy - FOOT;
            const softScore = Math.max(0, (d.maxVy - vy) / d.maxVy);
            const score = Math.round(
              (500 + softScore * 500 + (g.fuel / g.fuelMax) * 400) * d.mult
            );
            const rating =
              vy <= d.maxVy * 0.45 && vx <= d.maxVx * 0.45 && thDeg <= 6
                ? "PERFECT // THE EAGLE HAS LANDED"
                : vy <= d.maxVy * 0.8
                  ? "NOMINAL TOUCHDOWN // SMOOTH DESCENT"
                  : "FIRM TOUCHDOWN // SHOCKS COMPRESSED";
            pushLog("GUID", "CONTACT LIGHT // ENGINE STOP", "ok");
            sfxRef.current.engine(0);
            sfxRef.current.success();
            setResult({
              ok: true, title: "TOUCHDOWN CONFIRMED", detail: rating, score,
              vs: vy, hs: vx, tilt: thDeg,
              fuelPct: (g.fuel / g.fuelMax) * 100,
            });
            setPhase("landed");
          } else if (pad && firmOk) {
            g.phase = "landed";
            g.y = gy - FOOT;
            const score = Math.round((360 + (g.fuel / g.fuelMax) * 260) * d.mult);
            pushLog("GUID", "HARD LANDING // GEAR COMPRESSED", "warn");
            sfxRef.current.engine(0);
            sfxRef.current.success();
            setResult({
              ok: true, title: "HARD LANDING // VEHICLE INTACT", detail: "SURVIVABLE TOUCHDOWN // OFF-NOMINAL VELOCITY", score,
              vs: vy, hs: vx, tilt: thDeg,
              fuelPct: (g.fuel / g.fuelMax) * 100,
            });
            setPhase("landed");
          } else if (!pad && (softOk || firmOk)) {
            g.phase = "landed";
            g.y = gy - FOOT;
            const score = Math.round(200 * d.mult);
            pushLog("GUID", "ROUGH REGOLITH // OFF LZ TOUCHDOWN", "warn");
            sfxRef.current.engine(0);
            sfxRef.current.success();
            setResult({
              ok: true, title: "DOWN IN REGOLITH // OFF LZ", detail: "VEHICLE STANDING ON LUNAR TERRAIN // MISSION CONTINUES", score,
              vs: vy, hs: vx, tilt: thDeg,
              fuelPct: (g.fuel / g.fuelMax) * 100,
            });
            setPhase("landed");
          } else {
            g.phase = "crashed";
            g.dead = true;
            g.shake = 16;
            g.flash = 1;
            const reason = !pad && (vy > d.maxVy * 1.35 || vx > d.maxVx * 1.35)
              ? "TERRAIN IMPACT // EXCESS IMPACT RATE OUTSIDE LZ"
              : vy > d.maxVy * 1.35
                ? `EXCESS DESCENT RATE // ${vy.toFixed(1)} M/S (MAX ${(d.maxVy * 1.35).toFixed(1)} M/S)`
                : vx > d.maxVx * 1.35
                  ? `LATERAL DRIFT // ${vx.toFixed(1)} M/S INDUCED ROLLOVER`
                  : `ATTITUDE EXCEEDED // ${thDeg.toFixed(0)}° TILT TIPPED LANDER`;
            pushLog("WARN", "TELEMETRY LOST // STRUCTURAL BREAKUP", "danger");
            sfxRef.current.engine(0);
            sfxRef.current.crash();
            for (let i = 0; i < 90; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 20 + Math.random() * 140;
              g.particles.push({
                x: g.x, y: g.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
                life: 1, max: 0.7 + Math.random() * 0.9,
                size: 1 + Math.random() * 2.6,
                color: Math.random() < 0.4 ? "#ff5064" : Math.random() < 0.6 ? "#ffb454" : "#eaf0fb",
              });
            }
            setResult({
              ok: false, title: "IMPACT // VEHICLE LOST", detail: reason, score: 0,
              vs: vy, hs: vx, tilt: thDeg,
              fuelPct: (g.fuel / g.fuelMax) * 100,
            });
            setPhase("crashed");
          }
        }
      } else {
        sfxRef.current.engine(0);
      }

      // idle attract drift
      if (g.phase === "idle") {
        g.idleT += dt;
        const parkPad2 = g.pads[1];
        g.camX = parkPad2.x + parkPad2.w / 2 + Math.sin(g.idleT * 0.12) * 90;
        g.camY = -60 + Math.sin(g.idleT * 0.2) * 14;
      }

      // particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.life -= dt / p.max;
        if (p.life <= 0) { g.particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += GRAV * 0.25 * dt;
      }
      if (g.particles.length > 420) g.particles.splice(0, g.particles.length - 420);

      // camera
      if (g.phase === "flying" || g.phase === "countdown" || g.dead || g.phase === "landed") {
        const gy = surfaceY(g.terrain, g.x);
        const dist = Math.max(0, gy - g.y);
        const targetScale = Math.max(0.55, Math.min(2.4, ch / Math.max(260, Math.min(1150, dist * 1.5 + 240))));
        g.camScale += (targetScale - g.camScale) * Math.min(1, dt * 2.2);
        g.camX += (g.x + g.vx * 2.4 - g.camX) * Math.min(1, dt * 3.4);
        g.camY += (g.y + g.vy * 2.2 - 24 - g.camY) * Math.min(1, dt * 3.4);
      }
      g.shake *= Math.pow(0.001, dt);
      g.flash *= Math.pow(0.005, dt);

      /* ------- render ------- */
      const shX = (Math.random() - 0.5) * g.shake;
      const shY = (Math.random() - 0.5) * g.shake;
      const w2s = (wx: number, wy: number): [number, number] => [
        (wx - g.camX) * g.camScale + cw / 2 + shX,
        (wy - g.camY) * g.camScale + ch / 2 + shY,
      ];

      const bg = ctx.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, "#03050c");
      bg.addColorStop(1, "#070c1c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);

      // stars
      for (const s of g.stars) {
        let sx = (((s.x - g.camX * s.p * 0.3) % 1600) + 1600) % 1600;
        sx = (sx / 1600) * cw;
        const sy = (s.y / 900) * ch;
        ctx.fillStyle = `rgba(220,235,255,${0.25 + s.p * 0.4})`;
        ctx.fillRect(sx, sy, s.r, s.r);
      }

      // earth
      const ex = cw * 0.84 - g.camX * 0.015 % 40;
      const ey = ch * 0.13;
      const eg = ctx.createRadialGradient(ex - 6, ey - 6, 2, ex, ey, 26);
      eg.addColorStop(0, "#d9f2ff");
      eg.addColorStop(0.4, "#4fa7e8");
      eg.addColorStop(0.8, "#123060");
      eg.addColorStop(1, "rgba(5,11,24,0)");
      ctx.fillStyle = "rgba(90,170,255,0.12)";
      ctx.beginPath(); ctx.arc(ex, ey, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(ex, ey, 18, 0, Math.PI * 2); ctx.fill();

      // terrain
      const x0 = g.camX - cw / 2 / g.camScale - SEG;
      const x1 = g.camX + cw / 2 / g.camScale + SEG;
      const i0 = Math.max(0, Math.floor(x0 / SEG));
      const i1 = Math.min(N - 2, Math.ceil(x1 / SEG));
      ctx.beginPath();
      let [px0, py0] = w2s(i0 * SEG, g.terrain[i0]);
      ctx.moveTo(px0, py0);
      for (let i = i0 + 1; i <= i1 + 1; i++) {
        const [sx, sy] = w2s(i * SEG, g.terrain[i]);
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(cw + 60, ch + 60);
      ctx.lineTo(-60, ch + 60);
      ctx.closePath();
      ctx.fillStyle = "#0a1024";
      ctx.fill();
      // ridge line
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      for (let i = i0 + 1; i <= i1 + 1; i++) {
        const [sx, sy] = w2s(i * SEG, g.terrain[i]);
        ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = "rgba(140,170,220,0.5)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // landing pads
      const blinkA = 0.45 + 0.55 * Math.sin(now / 260);
      for (const p of g.pads) {
        const [ax, ay] = w2s(p.x, 0);
        const [bx] = w2s(p.x + p.w, 0);
        if (bx < -40 || ax > cw + 40) continue;
        const isTarget = p === g.target;
        ctx.strokeStyle = isTarget ? "#41e6ff" : "rgba(65,230,255,0.35)";
        ctx.lineWidth = isTarget ? 3 : 2;
        ctx.shadowColor = "rgba(65,230,255,0.8)";
        ctx.shadowBlur = isTarget ? 14 : 6;
        ctx.beginPath();
        ctx.moveTo(ax - 6, ay);
        ctx.lineTo(bx + 6, ay);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // end ticks
        ctx.strokeStyle = isTarget ? `rgba(65,230,255,${blinkA})` : `rgba(65,230,255,${blinkA * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - 6, ay); ctx.lineTo(ax - 6, ay - 10);
        ctx.moveTo(bx + 6, ay); ctx.lineTo(bx + 6, ay - 10);
        ctx.stroke();
        // beacons
        ctx.fillStyle = `rgba(65,230,255,${blinkA})`;
        ctx.beginPath(); ctx.arc(ax - 6, ay - 14, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + 6, ay - 14, 2.4, 0, Math.PI * 2); ctx.fill();
        // label
        ctx.fillStyle = isTarget ? "rgba(65,230,255,0.95)" : "rgba(138,147,168,0.7)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`LZ-${p.label}${isTarget ? " ◆ TARGET" : ""}`, (ax + bx) / 2, ay + 20);
      }

      // particles
      for (const p of g.particles) {
        const [sx, sy] = w2s(p.x, p.y);
        if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) continue;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        const sz = p.size * g.camScale * 0.8;
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;

      // lander
      if (!g.dead) {
        const [lx, ly] = w2s(g.x, g.y);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(g.theta);
        const s = g.camScale;
        // flame
        if (g.thrust > 0.02 && g.phase === "flying") {
          const L = (14 + Math.random() * 12) * g.thrust;
          const fg = ctx.createLinearGradient(0, 3.5 * s, 0, (3.5 + L) * s);
          fg.addColorStop(0, "rgba(255,255,255,0.95)");
          fg.addColorStop(0.35, "rgba(255,180,84,0.85)");
          fg.addColorStop(1, "rgba(255,120,60,0)");
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(-1.6 * s, 3.5 * s);
          ctx.lineTo(1.6 * s, 3.5 * s);
          ctx.lineTo(0, (3.5 + L) * s);
          ctx.closePath();
          ctx.fill();
        }
        ctx.lineCap = "round";
        // legs
        ctx.strokeStyle = "#8a93a8";
        ctx.lineWidth = 0.75 * s;
        ctx.beginPath();
        ctx.moveTo(-3 * s, 2 * s); ctx.lineTo(-5.4 * s, FOOT * s);
        ctx.moveTo(3 * s, 2 * s); ctx.lineTo(5.4 * s, FOOT * s);
        ctx.moveTo(-2.4 * s, 2 * s); ctx.lineTo(-3.2 * s, FOOT * s);
        ctx.moveTo(2.4 * s, 2 * s); ctx.lineTo(3.2 * s, FOOT * s);
        ctx.stroke();
        ctx.lineWidth = 0.9 * s;
        ctx.beginPath();
        ctx.moveTo(-6.4 * s, FOOT * s); ctx.lineTo(-4 * s, FOOT * s);
        ctx.moveTo(-4.2 * s, FOOT * s); ctx.lineTo(-2 * s, FOOT * s);
        ctx.moveTo(2 * s, FOOT * s); ctx.lineTo(4.2 * s, FOOT * s);
        ctx.moveTo(4 * s, FOOT * s); ctx.lineTo(6.4 * s, FOOT * s);
        ctx.stroke();
        // lower stage
        ctx.fillStyle = "#182136";
        ctx.strokeStyle = "#ffb454";
        ctx.lineWidth = 0.65 * s;
        ctx.beginPath();
        ctx.rect(-3.6 * s, -1 * s, 7.2 * s, 3.6 * s);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "rgba(255,180,84,0.5)";
        ctx.beginPath();
        ctx.moveTo(-3.6 * s, 0.2 * s); ctx.lineTo(3.6 * s, 0.2 * s);
        ctx.moveTo(-1.2 * s, -1 * s); ctx.lineTo(-1.2 * s, 2.6 * s);
        ctx.moveTo(1.2 * s, -1 * s); ctx.lineTo(1.2 * s, 2.6 * s);
        ctx.stroke();
        // upper stage
        ctx.fillStyle = "#101a30";
        ctx.strokeStyle = "#eaf0fb";
        ctx.lineWidth = 0.7 * s;
        ctx.beginPath();
        ctx.moveTo(-2.8 * s, -1 * s);
        ctx.lineTo(-1.5 * s, -4.4 * s);
        ctx.lineTo(1.9 * s, -4.4 * s);
        ctx.lineTo(2.9 * s, -1 * s);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // window
        ctx.fillStyle = "#41e6ff";
        ctx.shadowColor = "rgba(65,230,255,0.9)";
        ctx.shadowBlur = 8;
        ctx.fillRect(-0.9 * s, -3.6 * s, 1.7 * s, 1.1 * s);
        ctx.shadowBlur = 0;
        // antenna
        ctx.strokeStyle = "#eaf0fb";
        ctx.lineWidth = 0.4 * s;
        ctx.beginPath();
        ctx.moveTo(0.2 * s, -4.4 * s); ctx.lineTo(0.2 * s, -6.2 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0.2 * s, -6.6 * s, 0.9 * s, 0, Math.PI * 2);
        ctx.stroke();
        // nozzle
        ctx.fillStyle = "#0a0f1f";
        ctx.beginPath();
        ctx.moveTo(-1.4 * s, 2.6 * s);
        ctx.lineTo(1.4 * s, 2.6 * s);
        ctx.lineTo(2 * s, 3.6 * s);
        ctx.lineTo(-2 * s, 3.6 * s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // flash
      if (g.flash > 0.01) {
        ctx.fillStyle = `rgba(255,120,90,${g.flash * 0.55})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      /* ------- HUD ------- */
      const gy = surfaceY(g.terrain, g.x);
      const alt = Math.max(0, gy - g.y - FOOT);
      setRef(altEl.current, alt < 100 ? alt.toFixed(1) : alt.toFixed(0));
      setRef(vsEl.current, `${g.vy >= 0 ? "+" : ""}${g.vy.toFixed(1)}`,
        g.vy > 3 ? "danger" : g.vy > 1.8 ? "warn" : g.vy < -0.5 ? "ok" : "dim");
      setRef(hsEl.current, `${g.vx >= 0 ? "+" : ""}${g.vx.toFixed(1)}`,
        Math.abs(g.vx) > 2 ? "danger" : Math.abs(g.vx) > 1.1 ? "warn" : "dim");
      const tdeg = (g.theta * 180) / Math.PI;
      setRef(tiltEl.current, `${tdeg >= 0 ? "+" : ""}${tdeg.toFixed(0)}°`,
        Math.abs(tdeg) > 14 ? "danger" : Math.abs(tdeg) > 7 ? "warn" : "dim");
      const fpct = g.fuel / g.fuelMax;
      if (fuelEl.current) {
        fuelEl.current.style.transform = `scaleX(${fpct})`;
        fuelEl.current.style.background = fpct < 0.2 ? "#ff5064" : fpct < 0.4 ? "#ffb454" : "#41e6ff";
      }
      setRef(fuelTxt.current, `${Math.round(fpct * 100)}%`);
      if (thrustEl.current) {
        thrustEl.current.style.transform = `scaleY(${g.thrust})`;
      }
      const tgtC = g.target.x + g.target.w / 2;
      const ddd = tgtC - g.x;
      setRef(tgtEl.current, `${ddd >= 0 ? "→" : "←"} ${Math.abs(ddd).toFixed(0)} M`);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keyboard */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current.add(e.code);
      if (e.code === "KeyM") {
        setMuted((m) => {
          sfxRef.current.setMuted(!m);
          return !m;
        });
      }
      if (e.code === "KeyR") begin(true);
      if (
        (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") &&
        (gRef.current.phase === "idle" || gRef.current.phase === "landed" || gRef.current.phase === "crashed")
      ) {
        begin(false);
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDiff = (k: string) => {
    setDiffKey(k);
    diffRef.current = DIFFS.find((d) => d.key === k)!;
    if (gRef.current.phase === "idle") {
      resetWorld(diffRef.current);
      const g = gRef.current;
      const parkPad = g.pads[1];
      g.x = parkPad.x + parkPad.w / 2;
      g.y = -FOOT;
      g.camX = g.x;
    }
  };

  const touch = (code: string, on: boolean) => {
    sfxRef.current.ensure();
    if (on) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };

  const diff = DIFFS.find((d) => d.key === diffKey)!;

  return (
    <section id="simulator" className="relative mx-auto max-w-[1500px] scroll-mt-24 px-5 py-28 md:px-10 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-[1500px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <SectionHeader
        index="02"
        kicker="INTERACTIVE TRAINER"
        title={
          <>
            Descent <span className="text-accent glow-accent">simulator</span>
          </>
        }
        copy="A real physics sandbox running lunar ballistics with Apollo SAS attitude stabilization. Pulse the descent engine, control your approach vector, and touch down inside the designated LZ. Fly Cadet for training margins, Pilot for nominal Apollo P66 gate, or Commander for needle-threading."
      />

      {/* toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[10px] tracking-[0.3em] text-dim">CLASS:</span>
          {DIFFS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDiff(d.key)}
              className={`border px-4 py-2 text-[10px] tracking-[0.22em] transition-all duration-300 ${
                diffKey === d.key
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-white/15 text-dim hover:border-white/40 hover:text-ink"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-4 text-[10px] tracking-[0.2em] text-dim md:flex">
          <span className="flex items-center gap-1.5"><span className="kbd">W</span>/<span className="kbd">↑</span> THRUST</span>
          <span className="flex items-center gap-1.5"><span className="kbd">A</span><span className="kbd">D</span> ROTATE</span>
          <span className="flex items-center gap-1.5"><span className="kbd">R</span> RESTART</span>
          <span className="flex items-center gap-1.5"><span className="kbd">M</span> SOUND</span>
        </div>
      </div>

      {/* cockpit frame */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative border border-white/15 bg-panel shadow-[0_0_80px_rgba(65,230,255,0.07)]"
      >
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${phase === "flying" ? "animate-blink bg-lime" : phase === "crashed" ? "bg-danger" : "bg-ember"}`} />
            <span className="text-[10px] tracking-[0.3em] text-dim">
              AERO-DELTA GNC // P66 RATE-OF-DESCENT // CLASS {diff.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMuted((m) => {
                  sfxRef.current.setMuted(!m);
                  return !m;
                });
              }}
              className="flex h-8 w-8 items-center justify-center border border-white/15 text-dim transition-colors hover:border-accent/60 hover:text-accent"
              aria-label="Toggle sound"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => begin(true)}
              className="flex h-8 w-8 items-center justify-center border border-white/15 text-dim transition-colors hover:border-accent/60 hover:text-accent"
              aria-label="Restart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* canvas area */}
        <div ref={wrapRef} className="scanlines relative h-[64vh] min-h-[460px] w-full overflow-hidden bg-[#04060e] select-none">
          <canvas ref={canvasRef} className="absolute inset-0" />

          {/* HUD: top-left fuel */}
          <div className="pointer-events-none absolute left-4 top-4 space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between gap-6 text-[9px] tracking-[0.26em] text-dim">
                <span>PROPELLANT</span>
                <span ref={fuelTxt} className="text-ink">100%</span>
              </div>
              <div className="h-2 w-40 border border-white/20 bg-void/60 p-[2px]">
                <div ref={fuelEl} className="h-full w-full origin-left bg-accent" style={{ transform: "scaleX(1)" }} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-[9px] tracking-[0.26em] text-dim">THR</div>
              <div className="relative h-10 w-2 border border-white/20 bg-void/60">
                <div ref={thrustEl} className="absolute bottom-0 left-0 right-0 top-0 origin-bottom bg-ember" style={{ transform: "scaleY(0)" }} />
              </div>
            </div>
            <div className="text-[9px] tracking-[0.2em]">
              <span className="text-dim">TARGET LZ-{gRef.current.target.label}: </span>
              <span ref={tgtEl} className="text-accent">→ 0 M</span>
            </div>
          </div>

          {/* HUD: top-center altitude */}
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center">
            <div className="text-[9px] tracking-[0.32em] text-dim">ALTITUDE // M</div>
            <div className="font-display text-3xl font-bold text-ink md:text-4xl">
              <span ref={altEl}>0</span>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-5 text-[11px] tabular-nums">
              <span className="text-dim">V/S <span ref={vsEl} className="text-ink">+0.0</span></span>
              <span className="text-dim">H/S <span ref={hsEl} className="text-ink">+0.0</span></span>
              <span className="text-dim">TILT <span ref={tiltEl} className="text-ink">+0°</span></span>
            </div>
          </div>

          {/* HUD: mission log (bottom-left) */}
          <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-[300px] flex-col gap-1 md:flex">
            <AnimatePresence initial={false}>
              {log.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9.5px] tracking-[0.14em]"
                >
                  <span style={{ color: TONE_COLOR[l.tone] }}>[{l.tag}]</span>{" "}
                  <span className="text-ink/75">{l.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* touch controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between md:hidden">
            <div className="pointer-events-auto flex gap-2">
              <button
                className="flex h-14 w-14 items-center justify-center border border-white/25 bg-void/60 text-ink backdrop-blur-sm active:border-accent active:text-accent"
                onPointerDown={() => touch("ArrowLeft", true)}
                onPointerUp={() => touch("ArrowLeft", false)}
                onPointerLeave={() => touch("ArrowLeft", false)}
                aria-label="Rotate left"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                className="flex h-14 w-14 items-center justify-center border border-white/25 bg-void/60 text-ink backdrop-blur-sm active:border-accent active:text-accent"
                onPointerDown={() => touch("ArrowRight", true)}
                onPointerUp={() => touch("ArrowRight", false)}
                onPointerLeave={() => touch("ArrowRight", false)}
                aria-label="Rotate right"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <button
              className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border border-accent/60 bg-accent/15 text-accent backdrop-blur-sm active:bg-accent active:text-void"
              onPointerDown={() => touch("ArrowUp", true)}
              onPointerUp={() => touch("ArrowUp", false)}
              onPointerLeave={() => touch("ArrowUp", false)}
              aria-label="Thrust"
            >
              <ArrowUp className="h-7 w-7" />
            </button>
          </div>

          {/* IDLE overlay */}
          <AnimatePresence>
            {phase === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="absolute inset-0 flex items-center justify-center bg-void/55 backdrop-blur-[3px]"
              >
                <div className="mx-4 max-w-md border border-white/15 bg-panel/90 p-8 text-center shadow-2xl">
                  <Rocket className="mx-auto mb-4 h-6 w-6 text-accent" strokeWidth={1.5} />
                  <div className="text-[10px] tracking-[0.34em] text-accent">DESCENT PROFILE ARMED</div>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase">
                    Class {diff.label}
                  </h3>
                  <p className="mt-1.5 text-[10px] tracking-[0.26em] text-dim">{diff.desc}</p>
                  <div className="mt-5 grid grid-cols-3 gap-px border border-white/10 bg-white/10 text-center">
                    <div className="bg-panel px-2 py-3">
                      <div className="font-display text-sm text-ink">{diff.fuel}</div>
                      <div className="mt-1 text-[8px] tracking-[0.2em] text-dim">FUEL UNITS</div>
                    </div>
                    <div className="bg-panel px-2 py-3">
                      <div className="font-display text-sm text-ink">{diff.padW} M</div>
                      <div className="mt-1 text-[8px] tracking-[0.2em] text-dim">PAD WIDTH</div>
                    </div>
                    <div className="bg-panel px-2 py-3">
                      <div className="font-display text-sm text-ink">×{diff.mult}</div>
                      <div className="mt-1 text-[8px] tracking-[0.2em] text-dim">SCORE</div>
                    </div>
                  </div>
                  <button
                    onClick={() => begin(false)}
                    className="group mt-6 flex w-full items-center justify-center gap-3 border border-accent bg-accent px-6 py-3.5 text-[11px] font-semibold tracking-[0.24em] text-void transition-colors hover:bg-ink"
                  >
                    <Play className="h-4 w-4" />
                    ENGAGE DESCENT
                  </button>
                  <p className="mt-3.5 text-[9px] tracking-[0.2em] text-dim">
                    OR PRESS <span className="kbd ml-1">SPACE</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* COUNTDOWN overlay */}
          <AnimatePresence>
            {phase === "countdown" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  key={count}
                  initial={{ opacity: 0, scale: 1.6, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`font-display text-[9rem] font-black leading-none md:text-[13rem] ${
                    count === 0 ? "text-accent glow-accent" : "text-stroke"
                  }`}
                >
                  {count === 0 ? "GO" : count}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULT overlay */}
          <AnimatePresence>
            {(phase === "landed" || phase === "crashed") && result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                className="absolute inset-0 flex items-center justify-center bg-void/55 backdrop-blur-[3px]"
              >
                <motion.div
                  initial={{ scale: 0.92, y: 24 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  className={`mx-4 w-full max-w-md border bg-panel/95 p-8 text-center shadow-2xl ${
                    result.ok ? "border-accent/50" : "border-danger/50"
                  }`}
                >
                  {result.ok ? (
                    <Trophy className="mx-auto mb-4 h-6 w-6 text-accent" strokeWidth={1.5} />
                  ) : (
                    <RotateCcw className="mx-auto mb-4 h-6 w-6 text-danger" strokeWidth={1.5} />
                  )}
                  <div
                    className={`text-[10px] tracking-[0.34em] ${result.ok ? "text-accent" : "text-danger"}`}
                  >
                    {result.ok ? "MISSION LOG // ENTRY RECORDED" : "ACCIDENT REPORT // FILED"}
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-black uppercase leading-tight">
                    {result.title}
                  </h3>
                  <p className={`mt-2 text-[10px] tracking-[0.2em] ${result.ok ? "text-lime" : "text-danger"}`}>
                    {result.detail}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
                    {[
                      { l: "V/SPEED", v: `${result.vs.toFixed(1)} M/S` },
                      { l: "H/SPEED", v: `${result.hs.toFixed(1)} M/S` },
                      { l: "TILT", v: `${result.tilt.toFixed(0)}°` },
                      { l: "FUEL", v: `${result.fuelPct.toFixed(0)}%` },
                    ].map((s) => (
                      <div key={s.l} className="bg-panel px-2 py-3">
                        <div className="font-display text-sm text-ink">{s.v}</div>
                        <div className="mt-1 text-[8px] tracking-[0.2em] text-dim">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {result.ok && (
                    <div className="mt-4 border border-accent/30 bg-accent/5 px-4 py-3">
                      <div className="text-[9px] tracking-[0.3em] text-dim">MISSION SCORE</div>
                      <div className="font-display text-3xl font-black text-accent glow-accent">
                        {result.score.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => begin(false)}
                      className={`flex flex-1 items-center justify-center gap-2 border px-5 py-3.5 text-[11px] font-semibold tracking-[0.22em] transition-colors ${
                        result.ok
                          ? "border-accent bg-accent text-void hover:bg-ink"
                          : "border-danger bg-danger text-void hover:bg-ink"
                      }`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      FLY AGAIN
                    </button>
                    <button
                      onClick={() => {
                        setPhase("idle");
                        gRef.current.phase = "idle";
                        resetWorld(diffRef.current);
                        const g = gRef.current;
                        const pp = g.pads[1];
                        g.x = pp.x + pp.w / 2;
                        g.y = -FOOT;
                        g.camX = g.x; g.camY = -40; g.camScale = 1.15;
                        setResult(null);
                      }}
                      className="border border-white/20 px-5 py-3.5 text-[11px] tracking-[0.22em] text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      CHANGE CLASS
                    </button>
                  </div>
                  <p className="mt-3.5 text-[9px] tracking-[0.2em] text-dim">
                    <span className="kbd mr-1">R</span> QUICK RELAUNCH
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* bottom bar */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[9px] tracking-[0.24em] text-dim">
          <span className="hidden sm:block">GNC LOOP 60 HZ // GUIDANCE NOMINAL</span>
          <span className="sm:hidden">GNC LOOP ACTIVE</span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
            TELEMETRY UPLINK // 2.56 S DELAY
          </span>
        </div>
      </motion.div>
    </section>
  );
}
