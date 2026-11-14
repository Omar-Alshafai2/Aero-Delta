import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Key, ArrowRight, Lock, Unlock, AlertTriangle } from "lucide-react";

interface AccessGateProps {
  children: React.ReactNode;
}

const VALID_PASSCODES = ["AERODELTA2026", "AERODELTA", "ARTEMIS", "NASA2026", "SPACEAPPS"];

export default function AccessGate({ children }: AccessGateProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. Check URL parameters for direct link access: ?access=... or ?key=... or ?token=...
    const urlParams = new URLSearchParams(window.location.search);
    const accessKey =
      urlParams.get("access") ||
      urlParams.get("key") ||
      urlParams.get("token") ||
      urlParams.get("pass");

    if (accessKey) {
      const cleanKey = accessKey.trim().toUpperCase();
      if (VALID_PASSCODES.includes(cleanKey) || cleanKey.length >= 4) {
        localStorage.setItem("aero_delta_auth", "true");
        setAuthorized(true);
        return;
      }
    }

    // 2. Check existing local authorization
    if (localStorage.getItem("aero_delta_auth") === "true") {
      setAuthorized(true);
      return;
    }

    setAuthorized(false);
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = passcode.trim().toUpperCase();

    if (VALID_PASSCODES.includes(clean) || clean === "AERO" || clean === "LUNAR") {
      localStorage.setItem("aero_delta_auth", "true");
      setAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2400);
    }
  };

  // If still checking initial state, keep brief blank to avoid flicker
  if (authorized === null) {
    return <div className="min-h-screen bg-void text-ink" />;
  }

  // If authorized, show the full platform
  if (authorized) {
    return <>{children}</>;
  }

  // Otherwise, display the restricted Mission Flight Terminal Access Gate
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void px-5 py-12 text-ink selection:bg-accent selection:text-void overflow-hidden">
      {/* Background Starfield Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(65,230,255,0.08)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hud-frame relative z-10 w-full max-w-md border border-white/15 bg-panel/95 p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      >
        {/* Top Header Tag */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-blink rounded-full bg-accent" />
            <span className="font-mono text-[9px] tracking-[0.3em] text-accent uppercase">
              RESTRICTED FLIGHT OPERATIONS
            </span>
          </div>
          <span className="border border-white/15 bg-void px-2 py-0.5 font-mono text-[8.5px] text-dim">
            NASA SPACE APPS '26
          </span>
        </div>

        {/* Mission Logo & Badge */}
        <div className="mt-7 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-accent/80 bg-void p-1 shadow-[0_0_24px_rgba(65,230,255,0.4)]">
            <img
              src="/images/aero-delta-logo.jpg"
              alt="Aero-Delta Insignia"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <h1 className="font-display text-xl font-bold tracking-[0.16em] text-ink uppercase">
            AERO-DELTA
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-dim">
            LUNAR SOUTH POLE MISSION PLANNER
          </p>
          <div className="mt-4 flex items-center gap-1.5 border border-white/10 bg-void/80 px-3 py-1.5 text-[9px] tracking-[0.15em] text-dim">
            <Lock className="h-3 w-3 text-ember" />
            <span>LINK-ONLY AUTHORIZED EVALUATION GATE</span>
          </div>
        </div>

        {/* Passcode Entry Form */}
        <form onSubmit={handleUnlock} className="mt-7 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[9px] tracking-[0.2em] text-dim">
              <span>MISSION ACCESS KEY</span>
              <span className="text-dim/60 font-mono">DEFAULT: AERODELTA2026</span>
            </div>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="ENTER ACCESS KEY..."
                className={`w-full border bg-void px-4 py-3 font-mono text-xs tracking-[0.2em] text-ink uppercase placeholder:text-dim/40 focus:outline-none transition-colors ${
                  error
                    ? "border-danger text-danger shadow-[0_0_12px_rgba(255,80,100,0.4)]"
                    : "border-white/15 focus:border-accent shadow-[0_0_12px_rgba(65,230,255,0.15)]"
                }`}
              />
              <Key className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-dim/50" />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] text-danger"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>INVALID PASSCODE // PLEASE VERIFY MISSION KEY</span>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden border border-accent bg-accent/20 px-4 py-3 text-xs font-bold tracking-[0.22em] text-accent transition-all hover:bg-accent hover:text-void shadow-[0_0_15px_rgba(65,230,255,0.3)] cursor-pointer"
          >
            <span>AUTHENTICATE & ENTER</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("aero_delta_auth", "true");
              setAuthorized(true);
            }}
            className="flex w-full items-center justify-center gap-2 border border-white/20 bg-void/80 px-4 py-2.5 text-[10.5px] font-mono tracking-[0.2em] text-ink hover:border-accent hover:text-accent hover:bg-accent/10 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>[ NASA EVALUATOR 1-CLICK ACCESS ]</span>
          </button>
        </form>

        {/* Quick Link Info for Judges */}
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-[10px] leading-relaxed text-dim">
            Share this link with evaluators for automatic 1-click access:
          </p>
          <div className="mt-1.5 rounded border border-white/10 bg-void/90 p-2 font-mono text-[9px] text-accent select-all break-all">
            {typeof window !== "undefined"
              ? `${window.location.origin}${window.location.pathname}?access=aerodelta2026`
              : "https://your-domain.vercel.app/?access=aerodelta2026"}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

