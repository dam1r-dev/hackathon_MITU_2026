import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { api } from "../api";
import type { Dict } from "../i18n";
import { storageGet, storageSet } from "../state";

declare const __LAN_URL__: string;

const isLocal = (u: string) => /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u);

/** Best guess for an address phones in the room can open. */
function defaultBase(): string {
  const saved = storageGet("qrBase");
  if (saved) return saved;
  if (!isLocal(window.location.origin)) return window.location.origin;
  return import.meta.env.VITE_PUBLIC_URL || __LAN_URL__ || window.location.origin;
}

/** Big QR for the screen at the venue: judges scan it and land on #/join. */
export function QrPage({ t }: { t: Dict }) {
  const [base, setBase] = useState(defaultBase);
  const [svg, setSvg] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const url = `${base.replace(/\/+$/, "")}/#/join`;

  useEffect(() => {
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0d1015", light: "#ffffff" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [url]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .graph()
        .then((g) => alive && setCount(g.nodes.length))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="page qr-page">
      <header className="hero center">
        <h1>{t.qrTitle}</h1>
        <p className="sub">{t.qrSubtitle}</p>
      </header>

      <div className="qr-frame" dangerouslySetInnerHTML={{ __html: svg }} aria-label={url} role="img" />

      <p className="qr-url mono">{url}</p>
      {count !== null && (
        <p className="live center-self">
          <span className="live-dot" /> {t.qrJoined(count)}
        </p>
      )}

      <details className="qr-settings">
        <summary>{t.qrUrl}</summary>
        <input
          value={base}
          onChange={(e) => {
            setBase(e.target.value);
            storageSet("qrBase", e.target.value);
          }}
          spellCheck={false}
          inputMode="url"
        />
        {isLocal(base) && <p className="field-error">{t.qrLocal}</p>}
        <a className="btn btn-link" href="#/join">
          {t.qrOpen} →
        </a>
      </details>
    </div>
  );
}
