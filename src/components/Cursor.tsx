import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 420, damping: 34, mass: 0.6 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest("a,button,[data-cursor]"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[200]"
        style={{ x: sx, y: sy }}
      >
        <motion.div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
          animate={{
            width: hover ? 52 : 30,
            height: hover ? 52 : 30,
            borderColor: hover ? "rgba(65,230,255,0.9)" : "rgba(234,240,251,0.55)",
            scale: down ? 0.8 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          style={{ borderWidth: 1 }}
        >
          <div
            className={`rounded-full ${hover ? "bg-accent" : "bg-ink"}`}
            style={{ width: 3, height: 3 }}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
