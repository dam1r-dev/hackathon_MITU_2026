import { useState } from "react";
import { MatchCard } from "../components/MatchCard";
import { TagInput } from "../components/TagInput";
import { Avatar, Button, Chip, GoalBadge, ScoreRing, Segmented, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { GOALS, type Match } from "../types";

// Developer reference page (#/design). Labels here are token names, so they stay in English.

const COLORS = ["bg", "surface", "surface-2", "surface-3", "border", "text", "text-dim", "text-faint", "accent", "accent-soft", "success", "danger"];
const TYPE = [
  ["fs-2xl", "Who should you meet?"],
  ["fs-xl", "Your top 5"],
  ["fs-lg", "Aidos Nurlanov"],
  ["fs-md", "Body text: the explanation of why you two should meet."],
  ["fs-sm", "Secondary text, labels, metadata"],
  ["fs-xs", "EYEBROW · CAPTION"],
];
const SPACE = ["sp-1", "sp-2", "sp-3", "sp-4", "sp-5", "sp-6", "sp-7"];

const SAMPLE: Match = {
  profile: {
    id: "demo",
    name: "Dana Sadykova",
    role: "Engineering manager",
    stack: ["Python", "Go"],
    experience_years: 9,
    interests: ["fintech"],
    about: "",
    goal: "hire",
    lang: "ru",
  },
  score: 0.82,
  shared_tags: ["python", "fintech"],
  you_give: "Fresh backend skills for the payments team.",
  they_give: "A junior backend role and a fast hiring process.",
  explanation: "Dana is hiring backend engineers for fintech, and your Python stack fits the team.",
  icebreaker: "Hi Dana! I heard your payments team is hiring. What does the stack look like?",
};

export function DesignPage({ t }: { t: Dict }) {
  const [seg, setSeg] = useState("ru");
  const [tags, setTags] = useState(["React", "TypeScript"]);

  return (
    <div className="page page-wide ds">
      <header className="hero">
        <h1>Design system</h1>
        <p className="sub">Tokens live in src/styles/tokens.css, components in src/components/ui.tsx.</p>
      </header>

      <section className="ds-section">
        <h2>Color</h2>
        <div className="swatches">
          {COLORS.map((c) => (
            <div key={c} className="swatch">
              <span style={{ background: `var(--${c})` }} />
              <code>--{c}</code>
            </div>
          ))}
        </div>
        <h3>Goals</h3>
        <div className="swatches">
          {GOALS.map((g) => (
            <div key={g} className="swatch">
              <span style={{ background: `var(--g-${g})` }} />
              <code>--g-{g}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <h2>Type</h2>
        {TYPE.map(([k, s]) => (
          <div key={k} className="ds-type">
            <code>--{k}</code>
            <span style={{ fontSize: `var(--${k})`, fontWeight: k === "fs-2xl" || k === "fs-xl" ? 700 : undefined }}>{s}</span>
          </div>
        ))}
      </section>

      <section className="ds-section">
        <h2>Space</h2>
        {SPACE.map((k) => (
          <div key={k} className="ds-space">
            <code>--{k}</code>
            <span style={{ width: `var(--${k})` }} />
          </div>
        ))}
      </section>

      <section className="ds-section">
        <h2>Components</h2>
        <div className="ds-row">
          <Button>Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="ghost" size="sm">
            Small
          </Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Spinner /> Loading
          </Button>
        </div>
        <div className="ds-row">
          {GOALS.map((g) => (
            <GoalBadge key={g} goal={g}>
              {t.goals[g]}
            </GoalBadge>
          ))}
        </div>
        <div className="ds-row">
          {GOALS.map((g, i) => (
            <Avatar key={g} goal={g} name={["Aidos N", "Dana S", "Timur A", "Aruzhan B", "Nurlan O", "Madina K"][i]} />
          ))}
          <ScoreRing value={0.32} label="match" />
          <ScoreRing value={0.87} label="match" />
        </div>
        <div className="ds-row">
          <Chip onRemove={() => {}} removeLabel="remove">
            Python
          </Chip>
          <span className="tag">shared tag</span>
          <Segmented
            label="Language"
            value={seg}
            onChange={setSeg}
            options={[
              { value: "kk", label: "ҚАЗ" },
              { value: "ru", label: "РУС" },
              { value: "en", label: "ENG" },
            ]}
          />
        </div>
        <div className="ds-narrow">
          <TagInput id="ds-tags" value={tags} onChange={setTags} suggestions={["Go", "SQL"]} placeholder={t.tagHint} />
          <p className="alert">Alert: {t.error}</p>
          <MatchCard t={t} m={SAMPLE} rank={0} busy={false} onFeedback={() => {}} />
        </div>
      </section>
    </div>
  );
}
