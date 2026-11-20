import type { Goal, Lang } from "./types";

// All UI texts live here so kk/ru/en can be switched.
export type Dict = {
  // nav
  navFind: string;
  navMap: string;
  navQr: string;
  // find page
  title: string;
  subtitle: string;
  joinTitle: string;
  joinSubtitle: string;
  name: string;
  role: string;
  rolePlaceholder: string;
  stack: string;
  tagHint: string;
  experience: string;
  years: (n: number) => string;
  interests: string;
  about: string;
  aboutHint: string;
  goal: string;
  required: string;
  submit: string;
  loading: string;
  example: string;
  results: string;
  resultsJoined: string;
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
  fewer: (n: number) => string;
  error: string;
  empty: string;
  showOnMap: string;
  // map page
  mapTitle: string;
  mapSubtitle: string;
  attendees: (n: number) => string;
  you: string;
  byGoal: string;
  topTags: string;
  mapHint: string;
  live: string;
  allGoals: string;
  // qr page
  qrTitle: string;
  qrSubtitle: string;
  qrUrl: string;
  qrLocal: string;
  qrOpen: string;
  qrJoined: (n: number) => string;
  goals: Record<Goal, string>;
  goalHints: Record<Goal, string>;
};

const en: Dict = {
  navFind: "Find people",
  navMap: "Room map",
  navQr: "QR",
  title: "Who should you meet?",
  subtitle: "Fill in a short profile and get 5 people worth meeting at this event.",
  joinTitle: "Join the room",
  joinSubtitle: "Add your profile: you will appear on the room map and get your 5 people.",
  name: "Name",
  role: "Role",
  rolePlaceholder: "e.g. Backend developer",
  stack: "Stack",
  tagHint: "Type and press Enter",
  experience: "Experience",
  years: (n) => `${n} ${n === 1 ? "year" : "years"}`,
  interests: "Interests",
  about: "About you",
  aboutHint: "1-3 sentences: what you work on and what you are looking for.",
  goal: "Your goal for today",
  required: "Required",
  submit: "Find my 5 people",
  loading: "Matching...",
  example: "Fill with an example",
  results: "Your top 5",
  resultsJoined: "You are on the map. Your top 5",
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
  fewer: (n) => `Only ${n} people with a matching goal are here right now.`,
  error: "Something went wrong. Is the backend running?",
  empty: "Nobody with a matching goal is here yet. Try another goal.",
  showOnMap: "Show on the room map",
  mapTitle: "Room map",
  mapSubtitle: "Everyone at the event. Your top 5 are highlighted.",
  attendees: (n) => `${n} attendees`,
  you: "You",
  byGoal: "By goal",
  topTags: "Top interests and stack",
  mapHint: "Fill in your profile to see your matches here.",
  live: "Live",
  allGoals: "All",
  qrTitle: "Scan to join",
  qrSubtitle: "Point your phone camera at the code, add your profile and get your 5 people.",
  qrUrl: "Link in the code",
  qrLocal: "Phones cannot open localhost. Use this computer's network address, e.g. http://192.168.1.10:3000",
  qrOpen: "Open the join page",
  qrJoined: (n) => `${n} in the room`,
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
  navFind: "Подбор",
  navMap: "Карта зала",
  navQr: "QR",
  title: "С кем познакомиться?",
  subtitle: "Заполните короткую анкету и получите 5 человек, с которыми стоит познакомиться на этом мероприятии.",
  joinTitle: "Присоединиться",
  joinSubtitle: "Добавьте анкету: вы появитесь на карте зала и получите своих 5 человек.",
  name: "Имя",
  role: "Роль",
  rolePlaceholder: "например, Backend-разработчик",
  stack: "Стек",
  tagHint: "Введите и нажмите Enter",
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
  required: "Обязательное поле",
  submit: "Найти 5 человек",
  loading: "Подбираем...",
  example: "Заполнить примером",
  results: "Ваши топ-5",
  resultsJoined: "Вы на карте. Ваши топ-5",
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
  fewer: (n) => `Сейчас в зале только ${n} чел. с подходящей целью.`,
  error: "Что-то пошло не так. Бэкенд запущен?",
  empty: "Пока нет никого с подходящей целью. Попробуйте другую цель.",
  showOnMap: "Показать на карте зала",
  mapTitle: "Карта зала",
  mapSubtitle: "Все участники мероприятия. Ваши топ-5 подсвечены.",
  attendees: (n) => `Участников: ${n}`,
  you: "Вы",
  byGoal: "По целям",
  topTags: "Популярные интересы и стек",
  mapHint: "Заполните анкету, чтобы увидеть здесь свои совпадения.",
  live: "Онлайн",
  allGoals: "Все",
  qrTitle: "Отсканируйте, чтобы присоединиться",
  qrSubtitle: "Наведите камеру телефона на код, заполните анкету и получите своих 5 человек.",
  qrUrl: "Ссылка в коде",
  qrLocal: "Телефон не откроет localhost. Укажите сетевой адрес этого компьютера, например http://192.168.1.10:3000",
  qrOpen: "Открыть страницу анкеты",
  qrJoined: (n) => `В зале: ${n}`,
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
  navFind: "Іздеу",
  navMap: "Зал картасы",
  navQr: "QR",
  title: "Кіммен танысу керек?",
  subtitle: "Қысқа сауалнаманы толтырып, осы іс-шарада танысуға тұрарлық 5 адамды табыңыз.",
  joinTitle: "Қосылу",
  joinSubtitle: "Сауалнамаңызды қосыңыз: сіз зал картасында пайда боласыз және өз 5 адамыңызды аласыз.",
  name: "Аты-жөні",
  role: "Рөлі",
  rolePlaceholder: "мысалы, Backend әзірлеуші",
  stack: "Стек",
  tagHint: "Жазып, Enter басыңыз",
  experience: "Тәжірибе",
  years: (n) => `${n} жыл`,
  interests: "Қызығушылықтар",
  about: "Өзіңіз туралы",
  aboutHint: "1-3 сөйлем: немен айналысасыз және кімді іздейсіз.",
  goal: "Бүгінгі мақсатыңыз",
  required: "Міндетті өріс",
  submit: "5 адамды табу",
  loading: "Іздеп жатырмыз...",
  example: "Мысалмен толтыру",
  results: "Сіздің топ-5",
  resultsJoined: "Сіз картадасыз. Сіздің топ-5",
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
  fewer: (n) => `Қазір залда мақсаты сәйкес келетін тек ${n} адам бар.`,
  error: "Қате шықты. Бэкенд іске қосылған ба?",
  empty: "Әзірге мақсаты сәйкес келетін ешкім жоқ. Басқа мақсатты таңдаңыз.",
  showOnMap: "Зал картасында көрсету",
  mapTitle: "Зал картасы",
  mapSubtitle: "Іс-шараның барлық қатысушылары. Сіздің топ-5 бөлектелген.",
  attendees: (n) => `Қатысушылар: ${n}`,
  you: "Сіз",
  byGoal: "Мақсаттар бойынша",
  topTags: "Танымал қызығушылықтар мен стек",
  mapHint: "Сәйкестіктерді осында көру үшін сауалнаманы толтырыңыз.",
  live: "Тікелей",
  allGoals: "Барлығы",
  qrTitle: "Қосылу үшін сканерлеңіз",
  qrSubtitle: "Телефон камерасын кодқа бағыттап, сауалнаманы толтырыңыз және өз 5 адамыңызды алыңыз.",
  qrUrl: "Кодтағы сілтеме",
  qrLocal: "Телефон localhost ашпайды. Осы компьютердің желілік мекенжайын көрсетіңіз, мысалы http://192.168.1.10:3000",
  qrOpen: "Сауалнама бетін ашу",
  qrJoined: (n) => `Залда: ${n}`,
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

export const LANGS: { value: Lang; label: string }[] = [
  { value: "kk", label: "ҚАЗ" },
  { value: "ru", label: "РУС" },
  { value: "en", label: "ENG" },
];
