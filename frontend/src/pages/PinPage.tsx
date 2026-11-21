import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { Button } from "../components/ui";
import type { Dict } from "../i18n";
import type { Route } from "../state";

type Props = { t: Dict; go: (r: Route) => void };

/** "123456" -> "123 456" */
const format = (digits: string) => (digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits);

/** Join without a QR code: type the rotating 6-digit PIN shown on the projector. */
export function PinPage({ t, go }: Props) {
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"wrong" | "other" | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (digits.length < 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { code } = await api.resolvePin(digits);
      go({ name: "event-join", code });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "wrong" : "other");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <form className="pin-form" onSubmit={submit}>
        <h1>{t.pinTitle}</h1>
        <input
          className="pin-input mono"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          placeholder="000 000"
          aria-label={t.pinTitle}
          aria-invalid={error === "wrong" || undefined}
          value={format(digits)}
          onChange={(e) => {
            setDigits(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
        />
        {error && (
          <p className="alert" role="alert">
            {error === "wrong" ? t.pinWrong : t.error}
          </p>
        )}
        <Button type="submit" disabled={digits.length < 6 || busy}>
          {t.pinSubmit}
        </Button>
      </form>
    </div>
  );
}
