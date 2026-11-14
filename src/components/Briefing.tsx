import { motion } from "framer-motion";
import { Crosshair, Fuel, Globe, Mountain, Ruler, Sun, Timer, Zap, ExternalLink, ShieldCheck, Layers, Terminal } from "lucide-react";
import SectionHeader from "./SectionHeader";
import CountUp from "./CountUp";
import { LROC_QUICKMAP_BASE_URL, NASA_MOON_TREK_URL, JPL_HORIZONS_URL, CSA_MOON_EXPLORATION_URL } from "../utils/lunarAstro";

const CARDS = [
  {
    icon: Sun,
    title: "SOLAR ELEVATION ANALYSIS",
    body: "Track the Sun's angle above the horizon at any south polar site. Even a 3° elevation can sustain solar power generation across a full lunar day.",
    tag: "EPHEMERIS // SOLAR GEOMETRY",
  },
  {
    icon: Globe,
    title: "EARTH VISIBILITY WINDOWS",
    body: "Direct-to-Earth communication is never guaranteed at the poles. The planner maps libration-driven windows when Earth rises above the local horizon.",
    tag: "COMMS // LINE-OF-SIGHT",
  },
  {
    icon: Zap,
    title: "POWER GENERATION ASSESSMENT",
    body: "Permanently shadowed craters offer ice but zero solar power. Massif ridges trade ice proximity for near-continuous illumination and high incident solar flux.",
    tag: "POWER // SOLAR IRRADIANCE",
  },
  {
    icon: Mountain,
    title: "SOUTH POLE SITE COMPARISON",
    body: "Shackleton rim, Malapert massif, Nobile crater — each site scores differently on power, comms, and ice access. See the tradeoffs in one view.",
    tag: "SITE SELECTION // ARTEMIS",
  },
];

const STATS = [
  { icon: Ruler, label: "MEAN DISTANCE · KM", value: 384400, decimals: 0 },
  { icon: Sun, label: "MAX SOLAR ELEVATION · DEG", value: 6.7, decimals: 1 },
  { icon: Timer, label: "LIGHT ROUND-TRIP · S", value: 2.56, decimals: 2 },
  { icon: Zap, label: "SOLAR IRRADIANCE AT 1 AU · W/M²", value: 1361, decimals: 0 },
];

export default function Briefing() {
  return (
    <section id="briefing" className="relative mx-auto max-w-[1500px] scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="01"
        kicker="MISSION BRIEF"
        title={
          <>
            The challenge: <span className="text-accent">plan the south pole landing</span>
          </>
        }
        copy="For the NASA Space Apps Challenge your team must design a mission-planning tool for the most consequential site selection problem in exploration — the lunar south pole. Below this briefing sits a live planner driven by real ephemeris math. Understand the constraints first, then run the numbers."
      />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* left copy + cards */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="space-y-5 text-sm leading-relaxed text-dim md:text-[15px]"
          >
            <p>
              At the lunar south pole, the Sun never climbs more than{" "}
              <span className="text-ink">6.7° above the horizon</span>. That
              shallow angle means permanently shadowed craters full of water ice
              sit a stone's throw from ridge tops bathed in near-continuous
              sunlight — the most valuable real estate in the solar system, and
              the most demanding to operate on.
            </p>
            <p>
              Every candidate landing site trades solar power against ice access
              against direct-to-Earth communication. Shackleton's rim sees the
              Sun almost always but Earth only sometimes. Nobile's floor holds
              ice but sees neither. The planner below runs{" "}
              <span className="text-accent">real ephemeris math</span> so your
              team can visualise those tradeoffs — and pick the site that
              survives the mission.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative bg-panel p-6 transition-colors duration-300 hover:bg-panel2"
                data-cursor
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-accent/40 bg-accent/5 transition-colors duration-300 group-hover:bg-accent/15">
                  <c.icon className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} />
                </div>
                <div className="text-[10px] tracking-[0.3em] text-dim">{c.tag}</div>
                <h3 className="mt-2 font-display text-sm font-bold tracking-wide text-ink">
                  {c.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-dim">{c.body}</p>
                <span className="absolute right-4 top-4 text-[10px] text-accent/40 transition-colors group-hover:text-accent">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <a
              href="#planner"
              className="group relative inline-flex items-center gap-3 overflow-hidden border border-accent bg-accent px-7 py-4 text-[12px] font-semibold tracking-[0.22em] text-void transition-colors duration-300"
            >
              <span className="absolute inset-0 -translate-x-full bg-ink transition-transform duration-500 ease-out group-hover:translate-x-0" />
              <Sun className="relative z-10 h-4 w-4" />
              <span className="relative z-10">OPEN MISSION PLANNER</span>
            </a>
          </motion.div>
        </div>

        {/* right image panel */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="scanlines hud-frame relative overflow-hidden">
              <img
                src="/images/lander-module.jpg"
                alt="Lunar module on the surface"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[2.5s] hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />

              {/* annotations */}
              <div className="absolute left-6 top-[16%] hidden items-center gap-2 md:flex">
                <span className="h-px w-10 border-t border-dashed border-accent/70" />
                <span className="border border-accent/50 bg-void/70 px-2 py-1 text-[9px] tracking-[0.2em] text-accent backdrop-blur-sm">
                  RCS QUADS ×4
                </span>
              </div>
              <div className="absolute left-6 top-[52%] hidden items-center gap-2 md:flex">
                <span className="h-px w-14 border-t border-dashed border-ember/70" />
                <span className="border border-ember/50 bg-void/70 px-2 py-1 text-[9px] tracking-[0.2em] text-ember backdrop-blur-sm">
                  DESCENT ENGINE · 45 kN
                </span>
              </div>
              <div className="absolute left-6 top-[78%] hidden items-center gap-2 md:flex">
                <span className="h-px w-8 border-t border-dashed border-white/50" />
                <span className="border border-white/30 bg-void/70 px-2 py-1 text-[9px] tracking-[0.2em] text-ink backdrop-blur-sm">
                  LANDING RADAR ARRAY
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-void/70 px-4 py-3 backdrop-blur-sm">
                <span className="text-[10px] tracking-[0.25em] text-dim">
                  LM-CLASS DESCENT STAGE // TRANQUILITY REFERENCE
                </span>
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
              </div>

              {/* corner brackets */}
              <div className="absolute left-3 top-3 h-5 w-5 border-l border-t border-white/40" />
              <div className="absolute right-3 top-3 h-5 w-5 border-r border-t border-white/40" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* stats row */}
      <div className="mt-16 grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.07 }}
            className="bg-panel px-6 py-7"
          >
            <s.icon className="mb-4 h-4 w-4 text-accent" strokeWidth={1.5} />
            <div className="font-display text-2xl font-bold text-ink md:text-3xl">
              <CountUp to={s.value} decimals={s.decimals} />
            </div>
            <div className="mt-2 text-[9px] tracking-[0.28em] text-dim md:text-[10px]">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Official Data Infrastructure & Zero Fake Numbers Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7 }}
        className="mt-8 border border-white/10 bg-panel/70 p-6 backdrop-blur-sm hud-frame"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div>
              <div className="text-[11px] font-bold tracking-[0.25em] text-ink uppercase">
                OFFICIAL DATA INFRASTRUCTURE // ZERO FAKE NUMBERS MANDATE
              </div>
              <div className="text-[9.5px] tracking-[0.16em] text-dim">
                Every calculation, celestial vector, and topography model is verified against official space agency backbones.
              </div>
            </div>
          </div>
          <span className="border border-[#9dffb0]/40 bg-[#9dffb0]/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-[#9dffb0]">
            100% EPHEMERIS ACCORD
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href={LROC_QUICKMAP_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-white/10 bg-void p-4 transition-all hover:border-ember hover:shadow-[0_0_12px_rgba(255,180,84,0.25)]"
          >
            <div className="flex items-center justify-between text-ember">
              <Layers className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3 font-display text-[12px] font-bold text-ink group-hover:text-ember">
              LROC QUICKMAP
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-dim">
              ASU & NASA Lunar Reconnaissance Orbiter GIS. Stereographic projection (proj 10), Earth shadow masks, and LOLA DEM layer stacks.
            </div>
          </a>

          <a
            href={NASA_MOON_TREK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-white/10 bg-void p-4 transition-all hover:border-accent hover:shadow-[0_0_12px_rgba(65,230,255,0.25)]"
          >
            <div className="flex items-center justify-between text-accent">
              <Globe className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3 font-display text-[12px] font-bold text-ink group-hover:text-accent">
              NASA MOON TREK
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-dim">
              NASA Solar System Treks portal. Interactive 3D lunar surface navigation, LOLA laser altimetry slope gradients, and crater elevation profiles.
            </div>
          </a>

          <a
            href={JPL_HORIZONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-white/10 bg-void p-4 transition-all hover:border-accent hover:shadow-[0_0_12px_rgba(65,230,255,0.25)]"
          >
            <div className="flex items-center justify-between text-accent">
              <Terminal className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3 font-display text-[12px] font-bold text-ink group-hover:text-accent">
              JPL HORIZONS SYSTEM
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-dim">
              NASA JPL planetary ephemeris. Ground-truth topocentric lunar observer coordinates (coord@301) for Sol (10) and Earth (399) line-of-sight.
            </div>
          </a>

          <a
            href={CSA_MOON_EXPLORATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-white/10 bg-void p-4 transition-all hover:border-[#ff8a4d] hover:shadow-[0_0_12px_rgba(255,138,77,0.25)]"
          >
            <div className="flex items-center justify-between text-[#ff8a4d]">
              <Mountain className="h-4 w-4" />
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </div>
            <div className="mt-3 font-display text-[12px] font-bold text-ink group-hover:text-[#ff8a4d]">
              CSA MOON EXPLORATION
            </div>
            <div className="mt-1 text-[10px] leading-relaxed text-dim">
              Canadian Space Agency lunar rover initiative. In partnership with NASA, prospecting polar water ice and testing cold-night survival.
            </div>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
