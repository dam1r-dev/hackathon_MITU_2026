import { useEffect, useState } from "react";
import { Segmented, ThemeToggle } from "./components/ui";
import { dict, LANGS } from "./i18n";
import { AdminPage } from "./pages/AdminPage";
import { DesignPage } from "./pages/DesignPage";
import { EventJoinPage } from "./pages/EventJoinPage";
import { EventPage } from "./pages/EventPage";
import { EventsHubPage } from "./pages/EventsHubPage";
import { FindPage } from "./pages/FindPage";
import { PinPage } from "./pages/PinPage";
import { MapPage } from "./pages/MapPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ScreenPage } from "./pages/ScreenPage";
import { href, initialLang, storageSet, useMatcher, useRoute, useTheme, type RouteName } from "./state";
import type { Lang } from "./types";

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [route, go] = useRoute();
  const [theme, setTheme] = useTheme();
  const matcher = useMatcher(lang);
  const t = dict[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    storageSet("lang", lang);
  }, [lang]);

  useEffect(() => {
    const titles: Record<RouteName, string> = {
      find: t.navFind,
      try: t.title,
      join: t.joinTitle,
      "event-join": t.joinTitle,
      event: t.eventResults,
      screen: t.screenScan,
      me: t.meTitle,
      map: t.mapTitle,
      design: "Design system",
      admin: t.adminTitle,
      pin: t.pinTitle,
    };
    document.title = `${titles[route.name]} · Meetup Matchmaker`;
  }, [route, t]);

  const tabs: { name: RouteName; label: string }[] = [
    { name: "find", label: t.navFind },
    { name: "map", label: t.navMap },
    { name: "me", label: t.navMe },
  ];
  const active: RouteName =
    route.name === "join" || route.name === "pin" || route.name === "try" ? "find" : route.name === "event" || route.name === "event-join" ? "me" : route.name;
  const projector = route.name === "screen";

  return (
    <>
      {!projector && (
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
                <a key={x.name} href={href({ name: x.name })} aria-current={active === x.name ? "page" : undefined}>
                  {x.label}
                </a>
              ))}
            </div>
            <Segmented label={t.language} options={LANGS} value={lang} onChange={setLang} />
            <ThemeToggle value={theme} onChange={setTheme} labels={t.themes} label={t.appearance} />
          </div>
        </nav>
      )}

      <main>
        {route.name === "find" && <EventsHubPage t={t} go={go} />}
        {(route.name === "try" || route.name === "join") && (
          <FindPage t={t} matcher={matcher} join={route.name === "join"} onShowMap={() => go({ name: "map" })} />
        )}
        {route.name === "pin" && <PinPage t={t} go={go} />}
        {route.name === "event-join" && <EventJoinPage key={route.code} t={t} lang={lang} code={route.code!} go={go} />}
        {route.name === "event" && <EventPage key={route.code} t={t} lang={lang} code={route.code!} go={go} />}
        {route.name === "screen" && <ScreenPage t={t} code={route.code!} go={go} />}
        {route.name === "me" && <ProfilePage t={t} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} go={go} />}
        {route.name === "map" && <MapPage t={t} matcher={matcher} onFind={() => go({ name: "try" })} />}
        {route.name === "design" && <DesignPage t={t} />}
        {route.name === "admin" && <AdminPage key={route.code ?? "list"} t={t} eventId={route.code} go={go} />}
      </main>

      {!projector && (
        <footer className="footer">
          AI in Engineering Hackathon 2026 · <a href={href({ name: "screen" })}>{t.navScreen}</a> · <a href={href({ name: "admin" })}>{t.navAdmin}</a> ·{" "}
          <a href="#/design">Design system</a>
        </footer>
      )}
    </>
  );
}
