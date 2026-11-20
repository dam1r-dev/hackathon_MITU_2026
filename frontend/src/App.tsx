import { useEffect, useState } from "react";
import { Segmented } from "./components/ui";
import { dict, LANGS } from "./i18n";
import { DesignPage } from "./pages/DesignPage";
import { FindPage } from "./pages/FindPage";
import { MapPage } from "./pages/MapPage";
import { QrPage } from "./pages/QrPage";
import { initialLang, storageSet, useMatcher, useRoute, type Route } from "./state";
import type { Lang } from "./types";

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [route, go] = useRoute();
  const matcher = useMatcher(lang);
  const t = dict[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    storageSet("lang", lang);
  }, [lang]);

  useEffect(() => {
    const titles: Record<Route, string> = { find: t.title, join: t.joinTitle, map: t.mapTitle, qr: t.qrTitle, design: "Design system" };
    document.title = `${titles[route]} · Meetup Matchmaker`;
  }, [route, t]);

  const tabs: { route: Route; label: string }[] = [
    { route: "find", label: t.navFind },
    { route: "map", label: t.navMap },
    { route: "qr", label: t.navQr },
  ];
  const activeTab = route === "join" ? "find" : route;

  return (
    <>
      <nav className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/">
            <span className="brand-mark" aria-hidden>
              ◎
            </span>
            <span className="brand-name">Meetup Matchmaker</span>
          </a>
          <div className="tabs">
            {tabs.map((x) => (
              <a key={x.route} href={x.route === "find" ? "#/" : `#/${x.route}`} aria-current={activeTab === x.route ? "page" : undefined}>
                {x.label}
              </a>
            ))}
          </div>
          <Segmented label="Language" options={LANGS} value={lang} onChange={setLang} />
        </div>
      </nav>

      <main>
        {(route === "find" || route === "join") && <FindPage t={t} matcher={matcher} join={route === "join"} onShowMap={() => go("map")} />}
        {route === "map" && <MapPage t={t} matcher={matcher} onFind={() => go("find")} />}
        {route === "qr" && <QrPage t={t} />}
        {route === "design" && <DesignPage t={t} />}
      </main>

      <footer className="footer">
        AI in Engineering Hackathon 2026 · <a href="#/design">Design system</a>
      </footer>
    </>
  );
}
