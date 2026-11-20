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
