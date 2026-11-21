import { useState } from "react";
import { api, ApiError } from "../api";
import type { Dict } from "../i18n";
import { Button } from "./ui";

type Props = { t: Dict; verified: string | null | undefined; onChange: (login: string | null) => void };

/** Proves a GitHub account is the member's own: put a one-time code in the GitHub bio, then press Check. */
export function GithubVerify({ t, verified, onChange }: Props) {
  const [login, setLogin] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    const name = login.trim().replace(/^@/, "");
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.githubStart(name);
      setCode(r.code);
      setLogin(r.login);
    } catch {
      setError(t.ghFailed);
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.githubVerify();
      setCode(null);
      onChange(r.github);
    } catch (e) {
      const d = e instanceof ApiError ? e.detail : "";
      if (d === "code_not_found") setError(t.ghCodeMissing);
      else if (d === "github_not_found") setError(t.ghNotFound);
      else if (d === "no_pending_check") {
        setCode(null);
        setError(t.ghNoPending);
      } else setError(t.ghFailed);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.githubRemove();
      onChange(null);
    } catch {
      setError(t.ghFailed);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the code is selectable */
    }
  }

  if (verified)
    return (
      <div className="gh-verify">
        <div className="row">
          <span className="ok-note" style={{ margin: 0 }}>
            {t.ghConfirmed(verified)}
          </span>
          <Button type="button" variant="link" size="sm" disabled={busy} onClick={remove}>
            {t.ghRemove}
          </Button>
        </div>
      </div>
    );

  return (
    <div className="gh-verify">
      <span className="field-label">{t.ghTitle}</span>
      <span className="field-hint">{t.ghIntro}</span>
      {!code ? (
        <div className="row">
          <input
            aria-label={t.ghLoginLabel}
            placeholder={t.ghLoginLabel}
            maxLength={39}
            autoComplete="off"
            autoCapitalize="off"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
          <Button type="button" variant="ghost" size="sm" disabled={busy || !login.trim()} onClick={start}>
            {t.ghGetCode}
          </Button>
        </div>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            {t.ghStep1}
          </p>
          <div className="row">
            <code className="gh-code mono">{code}</code>
            <Button type="button" variant="ghost" size="sm" onClick={copy} aria-live="polite">
              {copied ? `✓ ${t.copied}` : t.copy}
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={check}>
              {busy ? t.ghChecking : t.ghCheck}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
