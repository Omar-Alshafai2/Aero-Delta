import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number; // depth 0..1
  r: number;
  phase: number;
  speed: number;
  hue: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let nextMeteor = 2.5;
    let last = performance.now();

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      stars.length = 0;
      const count = Math.min(420, Math.floor((w * h) / 3200));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: 0.15 + Math.random() * 0.85,
          r: 0.3 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.4,
          hue: Math.random(),
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / w;
      mouse.ty = e.clientY / h;
    };

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const px = (mouse.x - 0.5) * 26;
      const py = (mouse.y - 0.5) * 18;

      ctx.clearRect(0, 0, w, h);

      // deep space tint
      const g = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, h * 0.9);
      g.addColorStop(0, "rgba(16,26,54,0.5)");
      g.addColorStop(0.55, "rgba(7,11,25,0.35)");
      g.addColorStop(1, "rgba(4,6,14,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.x -= 0.006 * s.z;
        if (s.x < -4) s.x = w + 4;
        const tw = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        const alpha = Math.max(0.05, tw * (0.25 + s.z * 0.75));
        const off = px * s.z;
        const offY = py * s.z;
        ctx.beginPath();
        if (s.hue > 0.92) ctx.fillStyle = `rgba(255,196,120,${alpha})`;
        else if (s.hue > 0.78) ctx.fillStyle = `rgba(140,220,255,${alpha})`;
        else ctx.fillStyle = `rgba(230,240,255,${alpha})`;
        ctx.arc(s.x + off, s.y + offY, s.r * (0.7 + 0.3 * tw), 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.85 && s.r > 1.2 && tw > 0.93) {
          ctx.strokeStyle = `rgba(220,240,255,${alpha * 0.5})`;
          ctx.lineWidth = 0.5;
          const len = s.r * 3.2;
          ctx.beginPath();
          ctx.moveTo(s.x + off - len, s.y + offY);
          ctx.lineTo(s.x + off + len, s.y + offY);
          ctx.stroke();
        }
      }

      // meteors
      nextMeteor -= dt;
      if (nextMeteor <= 0) {
        nextMeteor = 3 + Math.random() * 5;
        const sx = Math.random() * w * 0.8 + w * 0.1;
        const sy = Math.random() * h * 0.35;
        meteors.push({ x: sx, y: sy, vx: -(6 + Math.random() * 5), vy: 3 + Math.random() * 2.4, life: 1, max: 1 });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt * 60;
        m.y += m.vy * dt * 60;
        m.life -= dt * 1.1;
        if (m.life <= 0) {
          meteors.splice(i, 1);
          continue;
        }
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
        grad.addColorStop(0, `rgba(210,240,255,${0.8 * m.life})`);
        grad.addColorStop(1, "rgba(210,240,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9);
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    seed();
    window.addEventListener("resize", () => {
      resize();
      seed();
    });
    window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
