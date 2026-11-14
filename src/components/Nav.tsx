import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, Orbit, Rocket, X, Play } from "lucide-react";

const LINKS = [
  { n: "01", label: "MISSION BRIEF", href: "#briefing" },
  { n: "02", label: "MISSION PLANNER", href: "#planner" },
  { n: "03", label: "DESCENT SIMULATOR", href: "#simulator" },
  { n: "04", label: "FLIGHT DYNAMICS", href: "#dynamics" },
  { n: "05", label: "LZ ARCHIVE", href: "#sites" },
];

interface NavProps {
  onOpenPresentation?: () => void;
}

export default function Nav({ onOpenPresentation }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.div
        className="fixed left-0 top-0 z-[120] h-[2px] w-full origin-left bg-accent"
        style={{ scaleX: progress }}
      />
      <header
        className={`fixed left-0 top-0 z-[110] w-full transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-void/70 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 md:px-10">
          <a href="#top" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/60 bg-void p-0.5 shadow-[0_0_14px_rgba(65,230,255,0.45)] transition-transform duration-500 group-hover:scale-105">
              <img
                src="/images/aero-delta-logo.jpg"
                alt="Aero-Delta Official Mission Logo"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold tracking-[0.2em] text-ink group-hover:text-accent transition-colors">
                  AERO-DELTA
                </span>
                <span className="hidden border border-white/15 px-2 py-0.5 text-[8.5px] tracking-[0.25em] text-dim sm:inline-block">
                  SPACE APPS '26
                </span>
              </div>
              <span className="hidden text-[8.5px] tracking-[0.2em] text-dim/70 md:block">
                LUNAR MISSION PLANNING
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group flex items-baseline gap-1.5 text-[11px] tracking-[0.22em] text-dim transition-colors hover:text-ink"
              >
                <span className="text-[9px] text-accent/70">{l.n}</span>
                <span className="relative">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {onOpenPresentation && (
              <button
                onClick={onOpenPresentation}
                className="flex items-center gap-1.5 border border-ember/60 bg-ember/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-ember transition-all duration-300 hover:bg-ember hover:text-void shadow-[0_0_12px_rgba(255,180,84,0.3)]"
                title="Open Interactive Presentation Deck"
              >
                <Play className="h-3 w-3 fill-current" />
                PRESENTATION
              </button>
            )}

            <a
              href="#simulator"
              className="hidden items-center gap-2 border border-accent/60 bg-accent/10 px-4 py-2 text-[11px] tracking-[0.2em] text-accent transition-all duration-300 hover:bg-accent hover:text-void sm:flex"
            >
              <Rocket className="h-3.5 w-3.5" />
              INITIATE DESCENT
            </a>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center border border-white/15 text-ink lg:hidden"
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-16 z-[105] border-b border-white/10 bg-void/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col px-6 py-6">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-white/5 py-4 text-sm tracking-[0.25em] text-ink"
                >
                  <span className="text-[10px] text-accent">{l.n}</span>
                  {l.label}
                </a>
              ))}
              <a
                href="#simulator"
                onClick={() => setOpen(false)}
                className="mt-5 flex items-center justify-center gap-2 border border-accent/60 bg-accent/10 px-4 py-3 text-xs tracking-[0.2em] text-accent"
              >
                <Rocket className="h-4 w-4" />
                INITIATE DESCENT
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
