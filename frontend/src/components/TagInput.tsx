import { useState } from "react";
import { Chip } from "./ui";

type Props = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
};

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Chips input: Enter or comma adds a tag, Backspace on empty removes the last one. */
export function TagInput({ id, value, onChange, suggestions = [], placeholder, max = 12 }: Props) {
  const [draft, setDraft] = useState("");

  const addAll = (raws: string[]) => {
    const next = [...value];
    for (const raw of raws) {
      const tag = raw.trim().slice(0, 32);
      if (tag && next.length < max && !next.some((v) => same(v, tag))) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  };

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
  const free = suggestions.filter((s) => !value.some((v) => same(v, s)));

  return (
    <div className="tag-input">
      <div className="tag-box">
        {value.map((tag) => (
          <Chip key={tag} onRemove={() => remove(tag)} removeLabel={`× ${tag}`}>
            {tag}
          </Chip>
        ))}
        <input
          id={id}
          value={draft}
          autoComplete="off"
          enterKeyHint="done"
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => {
            const parts = e.target.value.split(",");
            if (parts.length > 1) addAll(parts.slice(0, -1));
            setDraft(parts[parts.length - 1]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addAll([draft]);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => {
            addAll([draft]);
            setDraft("");
          }}
        />
      </div>
      {free.length > 0 && (
        <div className="suggestions">
          {free.slice(0, 8).map((s) => (
            <button type="button" className="suggestion" key={s} onClick={() => addAll([s])}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
