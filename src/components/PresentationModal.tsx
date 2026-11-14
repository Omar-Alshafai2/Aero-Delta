import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationModal({ isOpen, onClose }: PresentationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#02050e]/95 backdrop-blur-xl animate-fadeIn">
      {/* Top Command Bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-accent/25 bg-[#060c1c]/90 px-5 md:px-8">
        <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-accent">
          <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_10px_#38ef7d] animate-pulse" />
          <span>AERO-DELTA // FLIGHT PRESENTATION DECK</span>
          <span className="hidden sm:inline border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] text-dim">
            7 SLIDES
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/AERO_DELTA_PRESENTATION_DECK.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-dim hover:border-accent hover:text-accent transition-colors"
            title="Open standalone presentation in new tab"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">OPEN IN NEW TAB</span>
          </a>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center border border-white/15 text-dim hover:border-danger hover:text-danger hover:bg-danger/10 transition-colors"
            title="Close Presentation (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Viewport */}
      <div className="relative flex-1 w-full h-[calc(100%-48px)] overflow-hidden bg-void">
        <iframe
          src="/AERO_DELTA_PRESENTATION_DECK.html"
          title="AERO-DELTA Flight Presentation Deck"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
