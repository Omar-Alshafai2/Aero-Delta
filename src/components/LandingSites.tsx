import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MapPin, Box, Image as ImageIcon, ExternalLink, Layers, Globe } from "lucide-react";
import SectionHeader from "./SectionHeader";
import TerrainViewer3D from "./TerrainViewer3D";
import { getLROCQuickMapUrl, getMoonTrekUrl, CSA_MOON_EXPLORATION_URL } from "../utils/lunarAstro";

interface Site {
  name: string;
  craft: string;
  region: string;
  lat: string;
  lon: string;
  date: string;
  img: string;
  stl?: string;
  note: string;
  link?: string;
}

function parseCoord(s: string): number {
  const num = parseFloat(s.replace(/[^0-9.-]/g, ""));
  if (s.includes("S") || s.includes("W")) return -Math.abs(num);
  return Math.abs(num);
}

const SITES: Site[] = [
  {
    name: "APOLLO 11",
    craft: "EAGLE · ARMSTRONG / ALDRIN",
    region: "MARE TRANQUILLITATIS",
    lat: "0.6741° N",
    lon: "23.4731° E",
    date: "20 JUL 1969",
    img: "/images/site-tranquility.jpg",
    stl: "/models/Apollo_11_Landing_Site.stl",
    note: "The first. Armstrong flew semi-manual past a boulder-strewn crater and touched down with roughly 25 seconds of hover fuel in reserve.",
  },
  {
    name: "APOLLO 12",
    craft: "INTREPID · CONRAD / BEAN",
    region: "OCEANUS PROCELLARUM",
    lat: "3.0124° S",
    lon: "23.4216° W",
    date: "19 NOV 1969",
    img: "/images/site-procellarum.jpg",
    note: "A pinpoint touchdown 160 m from the Surveyor 3 probe — the mission that proved precision landing was a solved problem.",
  },
  {
    name: "APOLLO 14",
    craft: "ANTARIS · SHEPARD / MITCHELL",
    region: "FRA MAURO HIGHLANDS",
    lat: "3.6453° S",
    lon: "17.4714° W",
    date: "5 FEB 1971",
    img: "/images/site-tranquility.jpg",
    stl: "/models/Apollo_14_Landing_Site.stl",
    note: "Highland impact ejecta exploration around Cone Crater. Alan Shepard famously struck two golf balls across the lunar regolith.",
  },
  {
    name: "APOLLO 15",
    craft: "FALCON · SCOTT / IRWIN",
    region: "HADLEY–APENNINE",
    lat: "26.1322° N",
    lon: "3.6339° E",
    date: "30 JUL 1971",
    img: "/images/site-hadley.jpg",
    stl: "/models/Apollo_15_Landing_Site.stl",
    note: "First rover sortie. Set down beside a 300 m-deep rille at the foot of massifs rising 4 km above the plain.",
  },
  {
    name: "APOLLO 16",
    craft: "ORION · YOUNG / DUKE",
    region: "DESCARTES HIGHLANDS",
    lat: "8.9730° S",
    lon: "15.4981° E",
    date: "21 APR 1972",
    img: "/images/site-taurus.jpg",
    stl: "/models/Apollo_16_Landing_Site.stl",
    note: "First and only landing in the central lunar highlands, studying ancient Descartes and Cayley geological formations.",
  },
  {
    name: "APOLLO 17",
    craft: "CHALLENGER · CERNAN / SCHMITT",
    region: "TAURUS–LITTROW",
    lat: "20.1908° N",
    lon: "30.7717° E",
    date: "11 DEC 1972",
    img: "/images/site-taurus.jpg",
    note: "The last crewed landing. A valley boxed by ancient landslides, explored by the only geologist ever to walk the Moon.",
  },
  {
    name: "CHANG'E 4",
    craft: "YUTU-2 ROVER · CNSA",
    region: "VON KÁRMÁN CRATER · FAR SIDE",
    lat: "45.4446° S",
    lon: "177.5991° E",
    date: "3 JAN 2019",
    img: "/images/site-vonkarman.jpg",
    note: "First far-side landing in history — every command relayed through the Queqiao satellite parked at Earth–Moon L2.",
  },
  {
    name: "CHANDRAYAAN-3",
    craft: "VIKRAM / PRAGYAN · ISRO",
    region: "STATIO SHIV SHAKTI · SOUTH POLAR",
    lat: "69.3676° S",
    lon: "32.3486° E",
    date: "23 AUG 2023",
    img: "/images/site-shackleton.jpg",
    note: "First soft touchdown in the south-polar highlands — the same brutal, shadow-cut terrain Artemis crews now target.",
  },
  {
    name: "CLPS IM-1",
    craft: "ODYSSEUS · INTUITIVE MACHINES",
    region: "MALAPERT MASSIF · SOUTH POLE",
    lat: "80.1300° S",
    lon: "1.4400° E",
    date: "22 FEB 2024",
    img: "/images/site-shackleton.jpg",
    note: "First commercial soft landing on the Moon. Touched down near the south pole, partially tipped, still transmitted science data.",
  },
  {
    name: "CLPS IM-3 (PLANNED)",
    craft: "NOVA-C · INTUITIVE MACHINES",
    region: "SHACKLETON CRATER · SOUTH POLE",
    lat: "89.5000° S",
    lon: "0.0000° E",
    date: "PLANNED 2026",
    img: "/images/site-shackleton.jpg",
    note: "Targeted for the Shackleton rim — the most studied south polar site for Artemis support operations.",
  },
  {
    name: "CSA CANADIAN ROVER",
    craft: "CANADIAN LUNAR ROVER · CSA / NASA",
    region: "SOUTH POLE · 85.0°S",
    lat: "85.0000° S",
    lon: "20.0000° W",
    date: "PLANNED 2026/2027",
    img: "/images/site-shackleton.jpg",
    link: CSA_MOON_EXPLORATION_URL,
    note: "Canada's first lunar rover, developed by the Canadian Space Agency with NASA. Equipped with Canadian and American instruments to prospect water ice in permanently shadowed polar craters and survive the lunar night.",
  },
];

export default function LandingSites() {
  const [active, setActive] = useState(0);
  const [viewMode, setViewMode] = useState<"photo" | "3d">("3d");
  const pauseUntil = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current || viewMode === "3d") return;
      setActive((a) => (a + 1) % SITES.length);
    }, 5200);
    return () => clearInterval(id);
  }, [viewMode]);

  const select = (i: number) => {
    pauseUntil.current = Date.now() + 18000;
    setActive(i);
  };

  const site = SITES[active];

  return (
    <section id="sites" className="relative mx-auto max-w-[1500px] scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-[1500px] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <SectionHeader
        index="04"
        kicker="LZ ARCHIVE"
        title={
          <>
            Where we <span className="text-accent">actually</span> put down
          </>
        }
        copy="Eight touchdowns across half a century of trying — plus one on the books. Each one a coordinate argued over, simulated, and flown against the same unforgiving geometry you practice above."
      />

      <div className="grid gap-10 lg:grid-cols-12">
        {/* list */}
        <div className="lg:col-span-5">
          <div className="border-t border-white/10">
            {SITES.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.name}
                  onMouseEnter={() => select(i)}
                  onClick={() => select(i)}
                  className={`group relative flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-5 text-left transition-all duration-300 ${
                    on ? "bg-white/[0.045]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-[3px] transition-all duration-300 ${
                      on ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                  <span className="flex items-baseline gap-4">
                    <span className={`text-[10px] tabular-nums ${on ? "text-accent" : "text-dim"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span
                        className={`block font-display text-sm font-bold tracking-wide transition-colors md:text-base ${
                          on ? "text-ink" : "text-dim group-hover:text-ink"
                        }`}
                      >
                        {s.name}
                      </span>
                      <span className="mt-1 block text-[9px] tracking-[0.24em] text-dim">
                        {s.region}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] tracking-[0.18em] text-dim">{s.date}</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-all duration-300 ${
                        on ? "translate-x-0 text-accent opacity-100" : "-translate-x-2 opacity-0"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 flex items-center gap-2 text-[10px] tracking-[0.24em] text-dim">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            HOVER OR TAP TO RECALL A SITE FILE
          </p>
        </div>

        {/* viewer */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8 }}
              className="hud-frame scanlines relative overflow-hidden"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                {/* 3D STL Mode vs Photo Archive Mode */}
                {viewMode === "3d" ? (
                  <TerrainViewer3D
                    stlUrl={site.stl}
                    siteName={site.name}
                    lat={parseCoord(site.lat)}
                    lon={parseCoord(site.lon)}
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={site.img}
                      src={site.img}
                      alt={site.name}
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AnimatePresence>
                )}

                {/* Mode toggle available for all sites */}
                <div className="absolute right-4 top-4 z-20 flex items-center gap-1 border border-white/10 bg-void/80 p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode("3d")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-bold tracking-[0.2em] transition-all ${
                      viewMode === "3d"
                        ? "border border-accent bg-accent/20 text-accent shadow-[0_0_8px_rgba(65,230,255,0.4)]"
                        : "text-dim hover:text-ink"
                    }`}
                  >
                    <Box className="h-3 w-3" />
                    3D TOPOGRAPHY
                  </button>
                  <button
                    onClick={() => setViewMode("photo")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-bold tracking-[0.2em] transition-all ${
                      viewMode === "photo"
                        ? "border border-accent bg-accent/20 text-accent shadow-[0_0_8px_rgba(65,230,255,0.4)]"
                        : "text-dim hover:text-ink"
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    PHOTO
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-void/25" />
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 border border-accent/40 bg-void/60 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
                  <span className="text-[9px] tracking-[0.3em] text-accent">
                    SITE FILE // {site.name}
                  </span>
                </div>
                <div className="pointer-events-none absolute bottom-4 right-4 text-right">
                  <div className="font-display text-2xl font-bold text-ink md:text-3xl">
                    {site.lat}
                  </div>
                  <div className="font-display text-2xl font-bold text-accent md:text-3xl">
                    {site.lon}
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-4 left-4 text-[9px] tracking-[0.3em] text-ink/80">
                  {site.craft}
                </div>
              </div>

              {/* progress */}
              <div className="relative h-[3px] w-full bg-white/10">
                <motion.div
                  key={active}
                  className="h-full bg-accent shadow-[0_0_10px_rgba(65,230,255,0.8)]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5.2, ease: "linear" }}
                />
              </div>

              {/* data */}
              <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/10">
                {[
                  { l: "TOUCHDOWN", v: site.date },
                  { l: "LATITUDE", v: site.lat },
                  { l: "LONGITUDE", v: site.lon },
                ].map((d) => (
                  <div key={d.l} className="bg-panel px-4 py-3.5">
                    <div className="text-[8px] tracking-[0.26em] text-dim">{d.l}</div>
                    <div className="mt-1 text-[11px] tracking-[0.08em] text-ink">{d.v}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 bg-panel px-5 py-4">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={site.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="text-[12.5px] leading-relaxed text-dim"
                  >
                    {site.note}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* GIS & Ephemeris External Portals */}
              <div className="border-t border-white/10 bg-panel px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[8.5px] font-bold tracking-[0.25em] text-dim uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    OFFICIAL SATELLITE CHANNELS
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={getLROCQuickMapUrl(parseCoord(site.lat), parseCoord(site.lon))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-white/15 bg-void px-2.5 py-1 text-[8.5px] font-bold tracking-[0.2em] text-ink transition-colors hover:border-ember hover:text-ember"
                      title="Open in ASU / NASA LROC QuickMap (LOLA Elevation DEM & Earth Shadow)"
                    >
                      <Layers className="h-3 w-3 text-ember" />
                      LROC QUICKMAP
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                    <a
                      href={getMoonTrekUrl(parseCoord(site.lat), parseCoord(site.lon))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-white/15 bg-void px-2.5 py-1 text-[8.5px] font-bold tracking-[0.2em] text-ink transition-colors hover:border-accent hover:text-accent"
                      title="Open in NASA Solar System Treks (Moon Trek 3D GIS)"
                    >
                      <Globe className="h-3 w-3 text-accent" />
                      NASA MOON TREK
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                    {site.link && (
                      <a
                        href={site.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 border border-[#ff8a4d]/40 bg-[#ff8a4d]/10 px-2.5 py-1 text-[8.5px] font-bold tracking-[0.2em] text-[#ffb454] transition-colors hover:border-[#ff8a4d]"
                      >
                        CSA MISSION
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
