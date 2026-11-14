import { motion } from "framer-motion";
import { ArrowUp, ExternalLink, Orbit } from "lucide-react";
import Marquee from "./Marquee";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* regolith backdrop */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]">
        <img
          src="/images/regolith.jpg"
          alt=""
          className="h-full w-full object-cover opacity-[0.16]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 pb-10 pt-28 md:px-10 md:pt-40">
        <div className="mb-20 border-y border-white/10 py-3.5">
          <Marquee
            slow
            items={[
              "TRANQUILITY BASE",
              "OCEAN OF STORMS",
              "HADLEY RILLE",
              "TAURUS-LITTROW",
              "VON KÁRMÁN",
              "SHIV SHAKTI POINT",
              "YOUR LZ HERE",
            ]}
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-4 flex items-center gap-3 text-[10px] tracking-[0.32em] text-dim"
            >
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
              FINAL TRANSMISSION // END OF BRIEF
            </motion.div>
            <h2 className="font-display text-[clamp(2.4rem,7vw,5.6rem)] font-black uppercase leading-[0.98]">
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="block"
              >
                Ready for
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.12 }}
                className="text-stroke block"
              >
                touchdown?
              </motion.span>
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            <a
              href="#simulator"
              className="group flex items-center justify-center gap-3 border border-accent bg-accent px-8 py-4 text-[12px] font-semibold tracking-[0.24em] text-void transition-colors hover:bg-ink"
            >
              RETURN TO SIMULATOR
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
            </a>
            <a
              href="https://www.spaceappschallenge.org"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 border border-white/20 px-8 py-4 text-[12px] tracking-[0.24em] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              SPACEAPPSCHALLENGE.ORG
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>

        <div className="mt-24 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-accent/50 bg-accent/10">
              <Orbit className="h-4 w-4 text-accent" />
            </span>
            <div>
              <div className="font-display text-xs font-bold tracking-[0.2em]">AERO-DELTA</div>
              <div className="text-[9px] tracking-[0.24em] text-dim">
                CHALLENGE // LUNAR LANDING NAVIGATION
              </div>
            </div>
          </div>
          <p className="max-w-md text-[10px] leading-relaxed tracking-[0.12em] text-dim">
            BUILT FOR THE NASA INTERNATIONAL SPACE APPS CHALLENGE. EPHEMERIS DERIVED
            FROM J2000 CLOSED-FORM CELESTIAL MECHANICS CALIBRATED AGAINST NASA JPL HORIZONS.
            TOPOGRAPHY INTEGRATED WITH NASA LRO LOLA &amp; APOLLO DEM DATA.
          </p>
          <div className="text-[10px] tracking-[0.24em] text-dim">
            AD ASTRA <span className="text-accent">//</span> SOFTLY
          </div>
        </div>
      </div>
    </footer>
  );
}
