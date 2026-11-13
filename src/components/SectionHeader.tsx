import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  index: string;
  kicker: string;
  title: ReactNode;
  copy?: string;
}

export default function SectionHeader({ index, kicker, title, copy }: Props) {
  return (
    <div className="mb-14 md:mb-20">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] text-dim"
      >
        <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
        <span className="text-accent">[ {index} ]</span>
        <span className="h-px w-10 bg-white/20" />
        <span>{kicker}</span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-[clamp(1.9rem,5.2vw,4.2rem)] font-bold uppercase leading-[1.04] tracking-tight"
      >
        {title}
      </motion.h2>
      {copy && (
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 max-w-2xl text-sm leading-relaxed text-dim md:text-[15px]"
        >
          {copy}
        </motion.p>
      )}
    </div>
  );
}
