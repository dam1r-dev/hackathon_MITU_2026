import { useEffect, useRef, useState, type ReactNode } from "react";

/** Number that counts up (or down) to `value` and flashes when it changes. */
export function useTicker(value: number, ms = 800) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (value - start) * eased);
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

type Props = {
  label: string;
  value: number | null;
  tone?: "plain" | "mutual" | "meeting";
  icon?: ReactNode;
};

/** Big projector counter: tabular digits, a pop and a glow on every change. */
export function LiveCounter({ label, value, tone = "plain", icon }: Props) {
  const shown = useTicker(value ?? 0);
  const prev = useRef(value);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (prev.current !== null && value !== null && value > prev.current) setBump((b) => b + 1);
    prev.current = value;
  }, [value]);
  return (
    <div className="live-counter" data-tone={tone} aria-live="polite">
      <span className="live-counter-label">
        {icon} {label}
      </span>
      <strong key={bump} className="live-counter-n mono" data-bump={bump > 0 || undefined}>
        {value === null ? "–" : shown}
      </strong>
    </div>
  );
}
