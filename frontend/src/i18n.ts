import type { Goal, Lang } from "./types";

// All UI texts live here so kk/ru/en can be switched.
export type Dict = {
  title: string;
  subtitle: string;
  name: string;
  role: string;
  stack: string;
  tagHint: string;
  experience: string;
  years: (n: number) => string;
  interests: string;
  about: string;
  aboutHint: string;
  goal: string;
  submit: string;
  loading: string;
  example: string;
  results: string;
  edit: string;
  youGive: string;
  theyGive: string;
  icebreaker: string;
  copy: string;
  copied: string;
  met: string;
  notFit: string;
  match: string;
  tookMs: (n: number) => string;
  error: string;
  empty: string;
  goals: Record<Goal, string>;
  goalHints: Record<Goal, string>;
};

const en: Dict = {
  title: "Who should you meet?",
  subtitle: "Fill in a short profile and get 5 people worth meeting at this event.",
  name: "Name",
  role: "Role",
  stack: "Stack",
  tagHint: "Press Enter or comma to add",
  experience: "Experience",
  years: (n) => `${n} ${n === 1 ? "year" : "years"}`,
  interests: "Interests",
  about: "About you",
  aboutHint: "1-3 sentences: what you work on and what you are looking for.",
  goal: "Your goal for today",
  submit: "Find my 5 people",
  loading: "Matching...",
  example: "Fill with an example",
  results: "Your top 5",
  edit: "Edit profile",
  youGive: "You give",
  theyGive: "They give",
  icebreaker: "Opening line",
  copy: "Copy",
  copied: "Copied",
  met: "We met",
  notFit: "Not a fit",
  match: "match",
  tookMs: (n) => `found in ${n} ms`,
  error: "Something went wrong. Is the backend running?",
  empty: "No matches yet for this goal. Try another goal.",
  goals: {
    find_job: "Find a job",
    hire: "Hire",
    find_mentor: "Find a mentor",
    be_mentor: "Become a mentor",
    find_cofounder: "Find a co-founder",
    exchange_experience: "Exchange experience",
  },
  goalHints: {
    find_job: "Meet people who are hiring",
    hire: "Meet candidates",
    find_mentor: "Meet experienced mentors",
    be_mentor: "Meet people who want to grow",
    find_cofounder: "Meet future co-founders",
    exchange_experience: "Meet peers to share with",
  },
};

const ru: Dict = {
  title: "С кем познакомиться?",
  subtitle: "Заполните короткую анкету и получите 5 человек, с которыми стоит познакомиться на этом мероприятии.",
  name: "Имя",
  role: "Роль",
  stack: "Стек",
  tagHint: "Enter или запятая, чтобы добавить",
  experience: "Опыт",
  years: (n) => {
    const m10 = n % 10;
    const m100 = n % 100;
    const w = m10 === 1 && m100 !== 11 ? "год" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "года" : "лет";
    return `${n} ${w}`;
  },
  interests: "Интересы",
  about: "О себе",
  aboutHint: "1-3 предложения: чем занимаетесь и кого ищете.",
  goal: "Ваша цель сегодня",
  submit: "Найти 5 человек",
  loading: "Подбираем...",
  example: "Заполнить примером",
  results: "Ваши топ-5",
  edit: "Изменить анкету",
  youGive: "Вы даёте",
  theyGive: "Вам дают",
  icebreaker: "Первая фраза",
  copy: "Копировать",
  copied: "Скопировано",
  met: "Познакомились",
  notFit: "Не подошло",
  match: "совпадение",
  tookMs: (n) => `найдено за ${n} мс`,
  error: "Что-то пошло не так. Бэкенд запущен?",
  empty: "Для этой цели пока нет совпадений. Попробуйте другую цель.",
  goals: {
    find_job: "Найти работу",
    hire: "Нанять",
    find_mentor: "Найти ментора",
    be_mentor: "Стать ментором",
    find_cofounder: "Найти кофаундера",
    exchange_experience: "Обмен опытом",
  },
  goalHints: {
    find_job: "Покажем тех, кто нанимает",
    hire: "Покажем кандидатов",
    find_mentor: "Покажем опытных менторов",
    be_mentor: "Покажем тех, кто хочет расти",
    find_cofounder: "Покажем будущих кофаундеров",
    exchange_experience: "Покажем коллег для обмена опытом",
  },
};

const kk: Dict = {
  title: "Кіммен танысу керек?",
  subtitle: "Қысқа сауалнаманы толтырып, осы іс-шарада танысуға тұрарлық 5 адамды табыңыз.",
  name: "Аты-жөні",
  role: "Рөлі",
  stack: "Стек",
  tagHint: "Қосу үшін Enter немесе үтір",
  experience: "Тәжірибе",
  years: (n) => `${n} жыл`,
  interests: "Қызығушылықтар",
  about: "Өзіңіз туралы",
  aboutHint: "1-3 сөйлем: немен айналысасыз және кімді іздейсіз.",
  goal: "Бүгінгі мақсатыңыз",
  submit: "5 адамды табу",
  loading: "Іздеп жатырмыз...",
  example: "Мысалмен толтыру",
  results: "Сіздің топ-5",
  edit: "Сауалнаманы өзгерту",
  youGive: "Сіз бересіз",
  theyGive: "Олар береді",
  icebreaker: "Алғашқы сөз",
  copy: "Көшіру",
  copied: "Көшірілді",
  met: "Таныстық",
  notFit: "Сәйкес емес",
  match: "сәйкестік",
  tookMs: (n) => `${n} мс ішінде табылды`,
  error: "Қате шықты. Бэкенд іске қосылған ба?",
  empty: "Бұл мақсат үшін әзірге сәйкестік жоқ. Басқа мақсатты таңдаңыз.",
  goals: {
    find_job: "Жұмыс табу",
    hire: "Жұмысқа алу",
    find_mentor: "Ментор табу",
    be_mentor: "Ментор болу",
    find_cofounder: "Кофаундер табу",
    exchange_experience: "Тәжірибе алмасу",
  },
  goalHints: {
    find_job: "Жұмысқа алатындарды көрсетеміз",
    hire: "Үміткерлерді көрсетеміз",
    find_mentor: "Тәжірибелі менторларды көрсетеміз",
    be_mentor: "Өсуге ниетті адамдарды көрсетеміз",
    find_cofounder: "Болашақ кофаундерлерді көрсетеміз",
    exchange_experience: "Тәжірибе алмасатын әріптестерді көрсетеміз",
  },
};

export const dict: Record<Lang, Dict> = { en, ru, kk };

export const LANGS: { code: Lang; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
];
