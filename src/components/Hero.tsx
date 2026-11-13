import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ChevronDown, Play } from "lucide-react";
import Marquee from "./Marquee";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};

const reveal = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
};

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" as const } },
};

function MissionClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setT((Date.now() - start) / 1000), 100);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(t / 3600)).padStart(2, "0");
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  const ds = String(Math.floor((t % 1) * 10));
  return (
    <span className="tabular-nums">
      T+{hh}:{mm}:{ss}
      <span className="text-accent">.{ds}</span>
    </span>
  );
}

function RangeTicker() {
  const [dist, setDist] = useState("384400.0");
  useEffect(() => {
    const update = () => {
      // Real physical Earth-Moon instantaneous distance
      const now = new Date();
      const jd = now.getTime() / 86400000 + 2440587.5;
      const daysSinceJ2000 = jd - 2451545.0;
      // Mean anomaly of the Moon (period = 27.55455 days)
      const M = (2 * Math.PI * (daysSinceJ2000 % 27.55455)) / 27.55455;
      // Semi-major axis = 384,400 km, eccentricity = 0.0549
      const a = 384400;
      const e = 0.0549;
      // First-order Keplerian orbit distance calculation
      const r = a * (1 - e * Math.cos(M) - 0.5 * e * e * (Math.cos(2 * M) - 1));
      setDist(r.toFixed(1));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums text-ink">{dist}</span>;
}

interface HeroProps {
  onOpenPresentation?: () => void;
}

export default function Hero({ onOpenPresentation }: HeroProps) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const moonX = useTransform(sx, (v) => v * 34);
  const moonY = useTransform(sy, (v) => v * 22);
  const earthX = useTransform(sx, (v) => v * -16);
  const earthY = useTransform(sy, (v) => v * -10);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-accent/[0.05] blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-10 h-[420px] w-[420px] rounded-full bg-ember/[0.04] blur-[120px]" />

      {/* distant earth */}
      <motion.div
        className="pointer-events-none absolute right-[12%] top-[14%] hidden md:block"
        style={{ x: earthX, y: earthY }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 1.6 }}
          className="relative h-10 w-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 30%, #d9f2ff 0%, #4fa7e8 34%, #14386e 72%, #050b18 100%)",
            boxShadow: "0 0 34px rgba(90,170,255,0.5)",
          }}
        >
          <span className="absolute inset-0 rounded-full animate-pulse-ring border border-sky-300/40" />
        </motion.div>
      </motion.div>

      {/* the moon */}
      <motion.div
        className="pointer-events-none absolute right-[-38vw] top-1/2 aspect-square w-[88vw] -translate-y-1/2 sm:right-[-24vw] sm:w-[64vw] lg:right-[-14vw] lg:w-[52vw] xl:right-[-9vw] xl:w-[46vw]"
        style={{ x: moonX, y: moonY }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.15, filter: "blur(14px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="animate-floaty h-full w-full"
        >
          <div
            className="absolute inset-[-6%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(200,225,255,0.16) 0%, rgba(120,170,255,0.06) 55%, transparent 72%)",
            }}
          />
          <img
            src="/images/moon-hero.jpg"
            alt="The Moon"
            className="animate-spin-slower h-full w-full rounded-full object-cover opacity-90"
            style={{
              maskImage: "radial-gradient(circle, black 62%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle, black 62%, transparent 70%)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* HUD corner brackets */}
      <div className="pointer-events-none absolute inset-4 z-10 hidden md:block">
        <div className="absolute left-0 top-14 h-8 w-8 border-l border-t border-white/25" />
        <div className="absolute right-0 top-14 h-8 w-8 border-r border-t border-white/25" />
        <div className="absolute bottom-16 left-0 h-8 w-8 border-b border-l border-white/25" />
        <div className="absolute bottom-16 right-0 h-8 w-8 border-b border-r border-white/25" />
      </div>

      {/* main content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-20 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center px-5 pb-28 pt-28 md:px-10"
      >
        <motion.div variants={fade} className="mb-8 flex items-center gap-3 text-[10px] tracking-[0.34em] text-dim md:text-[11px]">
          <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          NASA INTERNATIONAL SPACE APPS CHALLENGE
          <span className="hidden h-px w-16 bg-white/20 sm:block" />
          <span className="hidden text-accent sm:block">CHALLENGE: LUNAR LANDING NAVIGATION</span>
        </motion.div>

        <h1 className="font-display font-black uppercase leading-[0.95] tracking-tight">
          <span className="block overflow-hidden">
            <motion.span variants={reveal} className="block text-[clamp(3rem,10vw,8.6rem)]">
              Lunar
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              variants={reveal}
              className="text-stroke block text-[clamp(3rem,10vw,8.6rem)]"
            >
              Descent
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span
              variants={reveal}
              className="block text-[clamp(1rem,2.4vw,1.9rem)] font-medium tracking-[0.42em] text-dim"
            >
              NAVIGATION <span className="text-accent">//</span> GUIDANCE{" "}
              <span className="text-accent">//</span> CONTROL
            </motion.span>
          </span>
        </h1>

        <motion.p variants={fade} className="mt-8 max-w-xl text-sm leading-relaxed text-dim md:text-[15px]">
          There is no atmosphere to slow you down. No runway. No second pass.
          This is an interactive descent-training ground that drops a lunar
          module into your hands — throttle, tilt, and fuel budget included.
          Set her down softly, pilot. The regolith remembers everything.
        </motion.p>

        <motion.div variants={fade} className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#simulator"
            className="group relative flex items-center gap-3 overflow-hidden border border-accent bg-accent px-7 py-4 text-[12px] font-semibold tracking-[0.22em] text-void transition-colors duration-300"
          >
            <span className="absolute inset-0 -translate-x-full bg-ink transition-transform duration-500 ease-out group-hover:translate-x-0" />
            <Play className="relative z-10 h-4 w-4" />
            <span className="relative z-10">PILOT THE LANDER</span>
          </a>
          <a
            href="#briefing"
            className="flex items-center gap-3 border border-white/20 px-7 py-4 text-[12px] tracking-[0.22em] text-ink transition-all duration-300 hover:border-accent hover:text-accent"
          >
            READ THE BRIEF
            <ArrowDown className="h-4 w-4" />
          </a>
          {onOpenPresentation && (
            <button
              onClick={onOpenPresentation}
              className="flex items-center gap-2.5 border border-ember/60 bg-ember/15 px-7 py-4 text-[12px] font-semibold tracking-[0.22em] text-ember transition-all duration-300 hover:bg-ember hover:text-void shadow-[0_0_15px_rgba(255,180,84,0.35)]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              FLIGHT PRESENTATION
            </button>
          )}
        </motion.div>

        {/* telemetry strip */}
        <motion.div
          variants={fade}
          className="mt-14 grid max-w-2xl grid-cols-3 divide-x divide-white/10 border border-white/10 bg-panel/60 backdrop-blur-sm"
        >
          <div className="px-4 py-3.5">
            <div className="text-[9px] tracking-[0.28em] text-dim">MISSION CLOCK</div>
            <div className="mt-1 text-sm text-accent md:text-base">
              <MissionClock />
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-[9px] tracking-[0.28em] text-dim">RANGE TO LUNA · KM</div>
            <div className="mt-1 text-sm md:text-base">
              <RangeTicker />
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="text-[9px] tracking-[0.28em] text-dim">DEEP SPACE LINK</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-lime md:text-base">
              <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-lime" />
              LOCKED
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-20 right-6 z-20 hidden flex-col items-center gap-2 md:right-14 lg:flex"
      >
        <span className="text-[9px] tracking-[0.4em] text-dim" style={{ writingMode: "vertical-rl" }}>
          SCROLL TO DESCEND
        </span>
        <ChevronDown className="h-4 w-4 animate-scroll-cue text-accent" />
      </motion.div>

      {/* marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="relative z-20 border-y border-white/10 bg-panel/40 py-3.5 backdrop-blur-sm"
      >
        <Marquee
          items={[
            "LUNAR LANDING NAVIGATION",
            "GRAVITY 1.62 M/S²",
            "SOFT-TOUCH PROTOCOL",
            "NASA SPACE APPS HACKATHON",
            "DELTA-V BUDGET ACTIVE",
            "TERRAIN-RELATIVE NAVIGATION",
            "P64 // ATTITUDE HOLD",
            "THE EAGLE HAS LANDED",
            "SOLAR ELEVATION ANALYSIS",
            "EARTH VISIBILITY WINDOWS",
            "SOUTH POLE MISSION PLANNING",
            "EPHEMERIS ENGINE ACTIVE",
          ]}
        />
      </motion.div>
    </section>
  );
}
