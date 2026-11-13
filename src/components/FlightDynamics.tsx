import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, ArrowDownToLine, Gauge, Radio } from "lucide-react";
import SectionHeader from "./SectionHeader";

const PATH_D =
  "M40,64 C 210,70 268,300 430,336 C 560,364 700,372 764,382";

function DescentChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const haloRef = useRef<SVGCircleElement>(null);
  const altRef = useRef<SVGTextElement>(null);
  const inView = useInView(wrapRef, { margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    let start: number | null = null;
    const DURATION = 5200;
    const HOLD = 1600;
    const cycle = DURATION + HOLD;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);

    const step = (now: number) => {
      if (start === null) start = now;
      const elapsed = (now - start) % cycle;
      const t = Math.min(elapsed / DURATION, 1);
      const te = ease(t);
      const path = pathRef.current;
      const dot = dotRef.current;
      const halo = haloRef.current;
      if (path && dot && halo) {
        const len = path.getTotalLength();
        const p = path.getPointAtLength(len * te);
        dot.setAttribute("cx", String(p.x));
        dot.setAttribute("cy", String(p.y));
        halo.setAttribute("cx", String(p.x));
        halo.setAttribute("cy", String(p.y));
        if (altRef.current) {
          const alt = Math.max(0, 15200 * Math.pow(1 - te, 1.5));
          altRef.current.textContent = `${alt.toFixed(0)} M`;
          altRef.current.setAttribute("x", String(Math.min(p.x + 10, 660)));
          altRef.current.setAttribute("y", String(p.y - 12));
          altRef.current.setAttribute("opacity", te > 0.985 ? "0" : "0.85");
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div ref={wrapRef} className="hud-frame scanlines relative overflow-hidden p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] text-dim">
          <Activity className="h-3.5 w-3.5 text-accent" />
          POWERED DESCENT PROFILE // ALT × RANGE
        </div>
        <span className="text-[10px] tracking-[0.2em] text-accent">P63 → P66</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 800 420" className="h-auto w-full">
        {/* grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 90} y1={20} x2={40 + i * 90} y2={382} stroke="rgba(234,240,251,0.06)" strokeDasharray="2 6" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={40} y1={20 + i * 72} x2={770} y2={20 + i * 72} stroke="rgba(234,240,251,0.06)" strokeDasharray="2 6" />
        ))}
        {/* surface line */}
        <line x1={40} y1={382} x2={770} y2={382} stroke="rgba(65,230,255,0.4)" strokeWidth="1.5" />
        <text x={42} y={404} fill="rgba(138,147,168,0.8)" fontSize="10" letterSpacing="3">SURFACE // SEA LEVEL MEAN RADIUS 1,737.4 KM</text>
        <text x={42} y={34} fill="rgba(138,147,168,0.8)" fontSize="10" letterSpacing="3">15.2 KM // HIGH GATE</text>

        {/* descent path */}
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="#41e6ff"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ filter: "drop-shadow(0 0 6px rgba(65,230,255,0.6))" }}
        />
        <path ref={pathRef} d={PATH_D} fill="none" stroke="transparent" />

        {/* gate markers */}
        <circle cx={430} cy={336} r={4} fill="none" stroke="rgba(255,180,84,0.9)" strokeWidth="1.5" />
        <text x={418} y={318} fill="rgba(255,180,84,0.9)" fontSize="9" letterSpacing="2">LOW GATE</text>
        <circle cx={764} cy={382} r={5} fill="none" stroke="#9dffb0" strokeWidth="1.5" />
        <text x={700} y={404} fill="#9dffb0" fontSize="9" letterSpacing="2">TOUCHDOWN</text>

        {/* traveler */}
        <circle ref={haloRef} r={11} fill="rgba(65,230,255,0.15)" />
        <circle ref={dotRef} r={4} fill="#41e6ff" />
        <text ref={altRef} fill="#41e6ff" fontSize="10" letterSpacing="2" opacity="0.85">15200 M</text>
      </svg>
    </div>
  );
}

export default function FlightDynamics() {
  return (
    <section id="dynamics" className="relative mx-auto max-w-[1500px] scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-[1500px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <SectionHeader
        index="03"
        kicker="FLIGHT DYNAMICS"
        title={
          <>
            Ballistics of a <span className="text-stroke-accent">soft touchdown</span>
          </>
        }
        copy="Powered descent is a brake against 1,700 metres-per-second of sideways momentum, flown backwards into a hole in the dark. These are the numbers that separate a landing from geology."
      />

      <div className="grid gap-10 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7"
        >
          <DescentChart />
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["P63 · BRAKING", "P64 · ATTITUDE HOLD", "P66 · RATE-OF-DESCENT", "P67 · MANUAL OVERRIDE"].map((p) => (
              <span
                key={p}
                className="border border-white/15 bg-panel px-3 py-1.5 text-[10px] tracking-[0.22em] text-dim transition-colors hover:border-accent/50 hover:text-accent"
              >
                {p}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* gravity compare */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="hud-frame p-6"
          >
            <div className="mb-5 flex items-center gap-2 text-[10px] tracking-[0.28em] text-dim">
              <Gauge className="h-3.5 w-3.5 text-accent" />
              GRAVITY LEDGER
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-[10px] tracking-[0.2em]">
                  <span className="text-dim">EARTH</span>
                  <span className="text-ink">9.81 M/S²</span>
                </div>
                <div className="h-2.5 w-full bg-white/5">
                  <motion.div
                    className="h-full bg-dim/70"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-[10px] tracking-[0.2em]">
                  <span className="text-accent">LUNA</span>
                  <span className="text-accent">1.62 M/S²</span>
                </div>
                <div className="h-2.5 w-full bg-white/5">
                  <motion.div
                    className="h-full bg-accent shadow-[0_0_14px_rgba(65,230,255,0.7)]"
                    initial={{ width: 0 }}
                    whileInView={{ width: "16.5%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-dim">
              You fall six times slower — but nothing slows you except fire.
              No parachutes work in vacuum. Every metre per second is purchased
              at the engine bell.
            </p>
          </motion.div>

          {/* light delay */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hud-frame p-6"
          >
            <div className="mb-5 flex items-center gap-2 text-[10px] tracking-[0.28em] text-dim">
              <Radio className="h-3.5 w-3.5 text-accent" />
              SIGNAL ROUND TRIP // 2.56 S
            </div>
            <div className="relative flex items-center gap-4">
              <div
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full"
                style={{ boxShadow: "0 0 18px rgba(90,170,255,0.4)" }}
              >
                <img src="/images/earthrise.jpg" alt="Earth" className="h-full w-full object-cover" />
              </div>
              <div className="relative h-px flex-1 border-t border-dashed border-white/25">
                <span className="animate-ping-travel absolute -top-[4px] block h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(65,230,255,0.9)]" />
              </div>
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                <img src="/images/moon-hero.jpg" alt="Moon" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[9px] tracking-[0.25em] text-dim">
              <span>EARTH // HOUSTON</span>
              <span>LUNA // LZ</span>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-dim">
              A command sent now arrives when the lander is already somewhere else.
              Final guidance must live aboard the spacecraft — autonomous, or in the
              hands of the crew.
            </p>
          </motion.div>

          {/* margin chip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center gap-4 border border-ember/40 bg-ember/[0.06] p-5"
          >
            <ArrowDownToLine className="h-5 w-5 shrink-0 text-ember" strokeWidth={1.5} />
            <p className="text-[12px] leading-relaxed text-ember/90">
              APOLLO 11 touched down with roughly 25 seconds of hover fuel remaining.
              Armstrong flew past a boulder field to find it. The margin you leave
              yourself is the experiment.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
