/** Small design-system components. Styles live in styles/app.css and use only tokens. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Goal } from "../types";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "link";
  size?: "md" | "sm";
};

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonProps) {
  return <button {...rest} className={`btn btn-${variant} btn-${size} ${className}`.trim()} />;
}

export function GoalBadge({ goal, children }: { goal: Goal; children: ReactNode }) {
  return <span className={`badge goal-${goal}`}>{children}</span>;
}

export function Avatar({ name, goal, size = 48 }: { name: string; goal: Goal; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div className={`avatar goal-${goal}`} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials || "?"}
    </div>
  );
}

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="score" style={{ ["--pct" as string]: pct }} role="img" aria-label={`${pct}% ${label}`}>
      <span>{pct}</span>
    </div>
  );
}

export function Chip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return (
    <span className="chip">
      {children}
      {onRemove && (
        <button type="button" aria-label={removeLabel} onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden />;
}

type ThemeValue = "system" | "light" | "dark";
const NEXT: Record<ThemeValue, ThemeValue> = { system: "light", light: "dark", dark: "system" };

function ThemeIcon({ theme }: { theme: ThemeValue }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (theme === "light")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (theme === "dark")
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}

/** Compact appearance switch for the top bar: cycles System → Light → Dark. */
export function ThemeToggle({ value, onChange, labels, label }: { value: ThemeValue; onChange: (t: ThemeValue) => void; labels: Record<ThemeValue, string>; label: string }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => onChange(NEXT[value])}
      aria-label={`${label}: ${labels[value]}`}
      title={`${label}: ${labels[value]}`}
    >
      <ThemeIcon theme={value} />
    </button>
  );
}
