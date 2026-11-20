import { useState } from "react";

type Props = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
};

/** Chips input: Enter or comma adds a tag, Backspace on empty removes the last one. */
export function TagInput({ id, value, onChange, suggestions = [], placeholder }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const commit = () => {
    draft.split(",").forEach(add);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
  const free = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div className="tag-input">
      <div className="tag-box">
        {value.map((tag) => (
          <span className="chip" key={tag}>
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => remove(tag)}>
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              v.split(",").slice(0, -1).forEach(add);
              setDraft(v.split(",").pop() ?? "");
            } else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={commit}
        />
      </div>
      {free.length > 0 && (
        <div className="suggestions">
          {free.slice(0, 8).map((s) => (
            <button type="button" className="suggestion" key={s} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
