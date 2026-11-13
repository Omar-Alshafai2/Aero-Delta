import { Asterisk } from "lucide-react";

interface Props {
  items: string[];
  slow?: boolean;
}

export default function Marquee({ items, slow = false }: Props) {
  const row = (key: string) => (
    <div key={key} className="flex w-max shrink-0 items-center">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-6 pr-6 text-[11px] tracking-[0.35em] text-dim md:text-xs"
        >
          <span className="whitespace-nowrap">{item}</span>
          <Asterisk className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div className={`flex w-max animate-marquee ${slow ? "marquee-slow" : ""}`}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
