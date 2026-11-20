import type { Goal, Lang } from "./types";

// All UI texts live here so kk/ru/en can be switched.
export type Dict = {
  // nav
  navFind: string;
  navMap: string;
  navMe: string;
  navScreen: string;
  // events
  eventLoading: string;
  eventNotFound: string;
  eventClosed: string;
  eventJoinSub: string;
  joinCta: string;
  joining: string;
  contact: string;
  contactHint: string;
  continueAs: (name: string) => string;
  notYou: string;
  eventResults: string;
  liveUpdates: string;
  newBadge: string;
  fewYet: string;
  wantMeet: string;
  meetWaiting: string;
  meetMutual: string;
  noContact: string;
  mutualTitle: string;
  notInEvent: string;
  // projector
  screenScan: string;
  screenCode: string;
  screenEmpty: string;
  inRoom: string;
  // profile
  meTitle: string;
  meEmpty: string;
  myEvents: string;
  openEvent: string;
  forget: string;
  language: string;
  appearance: string;
  themes: Record<"system" | "light" | "dark", string>;
  roles: Record<"admin" | "organizer" | "member", string>;
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
  // admin
  navAdmin: string;
  adminTitle: string;
  adminCode: string;
  adminCodeHint: string;
  signIn: string;
  signOut: string;
  wrongCode: string;
  signedInAs: (role: string) => string;
  orgNoEvents: string;
  forbidden: string;
  eventsTitle: string;
  noEvents: string;
  createEvent: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCodeOpt: string;
  eventCodeHint: string;
  codeTaken: string;
  codeInvalid: string;
  statusOpen: string;
  statusClosed: string;
  closeReg: string;
  openReg: string;
  del: string;
  confirmDeleteEvent: (title: string) => string;
  copyLink: string;
  manage: string;
  projector: string;
  allEvents: string;
  attendeesTitle: string;
  search: string;
  noAttendees: string;
  noResults: string;
  addAttendee: string;
  existingMember: string;
  newProfile: string;
  pickMember: string;
  add: string;
  remove: string;
  confirmRemove: (name: string) => string;
  access: string;
  balance: string;
  hintScarce: (scarce: string, sc: number, plenty: string, pc: number) => string;
  balanced: string;
  goals: Record<Goal, string>;
  goalHints: Record<Goal, string>;
};

const en: Dict = {
  navFind: "Find people",
  navMap: "Room map",
  navMe: "Profile",
  navScreen: "Projector screen",
  eventLoading: "Loading the event...",
  eventNotFound: "Event not found. Check the code or scan the QR again.",
  eventClosed: "Registration for this event is closed.",
  eventJoinSub: "60 seconds: tell us who you are and get the 5 people at this event worth meeting.",
  joinCta: "Join and get my 5 people",
  joining: "Joining...",
  contact: "Contact (optional)",
  contactHint: "Telegram or phone. Shown only to people who also want to meet you.",
  continueAs: (name) => `Continue as ${name}`,
  notYou: "Not you? Fill in a new profile",
  eventResults: "Your 5 people here",
  liveUpdates: "Updates as people arrive",
  newBadge: "New",
  fewYet: "Only a few people have joined so far. Your list will grow as others arrive.",
  wantMeet: "Want to meet",
  meetWaiting: "Sent. If they press it too, you will both see contacts.",
  meetMutual: "It's mutual! Contact:",
  noContact: "no contact left, find them in the room",
  mutualTitle: "Mutual: go say hi",
  notInEvent: "You are not in this event yet.",
  screenScan: "Scan to join",
  screenCode: "Event code",
  screenEmpty: "Nobody yet. Be the first to scan!",
  inRoom: "in the room",
  meTitle: "My profile",
  meEmpty: "You have not joined an event yet. Scan the QR code at the venue.",
  myEvents: "My events",
  openEvent: "Open my 5",
  forget: "Forget me on this device",
  language: "Interface language",
  appearance: "Appearance",
  themes: { system: "System", light: "Light", dark: "Dark" },
  roles: { admin: "Admin", organizer: "Organizer", member: "Member" },
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
  navAdmin: "Admin",
  adminTitle: "Admin panel",
  adminCode: "Admin code",
  adminCodeHint: "Organizers: join your event with your profile, then come back here.",
  signIn: "Sign in",
  signOut: "Sign out",
  wrongCode: "Wrong code.",
  signedInAs: (role) => `Signed in as ${role}`,
  orgNoEvents: "No events are assigned to you yet. Ask an admin to add you as an organizer.",
  forbidden: "You do not have access to this.",
  eventsTitle: "Events",
  noEvents: "No events yet. Create the first one.",
  createEvent: "Create event",
  eventTitle: "Title",
  eventDate: "Date",
  eventVenue: "Venue",
  eventCodeOpt: "Join code (optional)",
  eventCodeHint: "4-12 Latin letters and digits. Generated if empty.",
  codeTaken: "This code is already used by another event.",
  codeInvalid: "Use 4-12 Latin letters and digits.",
  statusOpen: "Open",
  statusClosed: "Closed",
  closeReg: "Close registration",
  openReg: "Reopen registration",
  del: "Delete",
  confirmDeleteEvent: (title) => `Delete the event "${title}"? People stay in the system.`,
  copyLink: "Copy join link",
  manage: "Manage",
  projector: "Projector",
  allEvents: "All events",
  attendeesTitle: "Attendees",
  search: "Search by name, role or stack",
  noAttendees: "No attendees yet. Show the QR code on the projector.",
  noResults: "Nobody matches the search.",
  addAttendee: "Add attendee",
  existingMember: "Existing member",
  newProfile: "New profile",
  pickMember: "Choose a member",
  add: "Add",
  remove: "Remove",
  confirmRemove: (name) => `Remove ${name} from this event?`,
  access: "Access",
  balance: "Goal balance",
  hintScarce: (scarce, sc, plenty, pc) => `Only ${sc} "${scarce}" for ${pc} "${plenty}". Invite more people with the goal "${scarce}".`,
  balanced: "Goals are balanced. Everyone has someone to meet.",
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
  navMe: "Профиль",
  navScreen: "Экран для проектора",
  eventLoading: "Загружаем мероприятие...",
  eventNotFound: "Мероприятие не найдено. Проверьте код или отсканируйте QR ещё раз.",
  eventClosed: "Регистрация на это мероприятие закрыта.",
  eventJoinSub: "60 секунд: расскажите о себе и получите 5 человек на этом мероприятии, с которыми стоит познакомиться.",
  joinCta: "Присоединиться и найти 5 человек",
  joining: "Присоединяем...",
  contact: "Контакт (необязательно)",
  contactHint: "Telegram или телефон. Увидят только те, кто тоже захочет познакомиться с вами.",
  continueAs: (name) => `Продолжить как ${name}`,
  notYou: "Не вы? Заполните новую анкету",
  eventResults: "Ваши 5 человек здесь",
  liveUpdates: "Обновляется, когда приходят люди",
  newBadge: "Новый",
  fewYet: "Пока присоединились немногие. Список пополнится, когда придут другие.",
  wantMeet: "Хочу познакомиться",
  meetWaiting: "Отправлено. Если человек тоже нажмёт, вы оба увидите контакты.",
  meetMutual: "Взаимно! Контакт:",
  noContact: "контакт не оставлен, найдите человека в зале",
  mutualTitle: "Взаимно: подойдите поздороваться",
  notInEvent: "Вы ещё не участник этого мероприятия.",
  screenScan: "Отсканируйте, чтобы присоединиться",
  screenCode: "Код мероприятия",
  screenEmpty: "Пока никого. Отсканируйте первым!",
  inRoom: "в зале",
  meTitle: "Мой профиль",
  meEmpty: "Вы ещё не присоединились к мероприятию. Отсканируйте QR-код на месте.",
  myEvents: "Мои мероприятия",
  openEvent: "Открыть мои 5",
  forget: "Забыть меня на этом устройстве",
  language: "Язык интерфейса",
  appearance: "Оформление",
  themes: { system: "Как в системе", light: "Светлая", dark: "Тёмная" },
  roles: { admin: "Админ", organizer: "Организатор", member: "Участник" },
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
  navAdmin: "Админ",
  adminTitle: "Панель администратора",
  adminCode: "Код администратора",
  adminCodeHint: "Организаторы: присоединитесь к мероприятию со своей анкетой и вернитесь сюда.",
  signIn: "Войти",
  signOut: "Выйти",
  wrongCode: "Неверный код.",
  signedInAs: (role) => `Вы вошли как: ${role}`,
  orgNoEvents: "За вами пока не закреплено мероприятий. Попросите админа назначить вас организатором.",
  forbidden: "У вас нет доступа к этому.",
  eventsTitle: "Мероприятия",
  noEvents: "Мероприятий пока нет. Создайте первое.",
  createEvent: "Создать мероприятие",
  eventTitle: "Название",
  eventDate: "Дата",
  eventVenue: "Место",
  eventCodeOpt: "Код для входа (необязательно)",
  eventCodeHint: "4-12 латинских букв и цифр. Если пусто, создадим сами.",
  codeTaken: "Этот код уже занят другим мероприятием.",
  codeInvalid: "Используйте 4-12 латинских букв и цифр.",
  statusOpen: "Открыто",
  statusClosed: "Закрыто",
  closeReg: "Закрыть регистрацию",
  openReg: "Открыть регистрацию",
  del: "Удалить",
  confirmDeleteEvent: (title) => `Удалить мероприятие «${title}»? Участники останутся в системе.`,
  copyLink: "Скопировать ссылку",
  manage: "Управлять",
  projector: "Проектор",
  allEvents: "Все мероприятия",
  attendeesTitle: "Участники",
  search: "Поиск по имени, роли или стеку",
  noAttendees: "Участников пока нет. Покажите QR-код на проекторе.",
  noResults: "Никто не подходит под поиск.",
  addAttendee: "Добавить участника",
  existingMember: "Существующий",
  newProfile: "Новая анкета",
  pickMember: "Выберите участника",
  add: "Добавить",
  remove: "Убрать",
  confirmRemove: (name) => `Убрать ${name} из этого мероприятия?`,
  access: "Доступ",
  balance: "Баланс целей",
  hintScarce: (scarce, sc, plenty, pc) => `Всего ${sc} «${scarce}» на ${pc} «${plenty}». Пригласите больше людей с целью «${scarce}».`,
  balanced: "Цели сбалансированы: каждому есть с кем познакомиться.",
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
  navMe: "Профиль",
  navScreen: "Проектор экраны",
  eventLoading: "Іс-шара жүктелуде...",
  eventNotFound: "Іс-шара табылмады. Кодты тексеріңіз немесе QR-ды қайта сканерлеңіз.",
  eventClosed: "Бұл іс-шараға тіркелу жабық.",
  eventJoinSub: "60 секунд: өзіңіз туралы айтып, осы іс-шарада танысуға тұрарлық 5 адамды табыңыз.",
  joinCta: "Қосылып, 5 адамды табу",
  joining: "Қосылып жатырмыз...",
  contact: "Байланыс (міндетті емес)",
  contactHint: "Telegram немесе телефон. Сізбен де танысқысы келетіндер ғана көреді.",
  continueAs: (name) => `${name} ретінде жалғастыру`,
  notYou: "Сіз емессіз бе? Жаңа сауалнама толтырыңыз",
  eventResults: "Осындағы сіздің 5 адамыңыз",
  liveUpdates: "Адамдар келген сайын жаңарады",
  newBadge: "Жаңа",
  fewYet: "Әзірге аз адам қосылды. Басқалар келгенде тізім толығады.",
  wantMeet: "Танысқым келеді",
  meetWaiting: "Жіберілді. Ол да басса, екеуіңіз де байланысты көресіздер.",
  meetMutual: "Өзара! Байланыс:",
  noContact: "байланыс қалдырылмаған, оны залдан табыңыз",
  mutualTitle: "Өзара: барып амандасыңыз",
  notInEvent: "Сіз әлі бұл іс-шараның қатысушысы емессіз.",
  screenScan: "Қосылу үшін сканерлеңіз",
  screenCode: "Іс-шара коды",
  screenEmpty: "Әзірге ешкім жоқ. Бірінші болып сканерлеңіз!",
  inRoom: "залда",
  meTitle: "Менің профилім",
  meEmpty: "Сіз әлі іс-шараға қосылмадыңыз. Орындағы QR-кодты сканерлеңіз.",
  myEvents: "Менің іс-шараларым",
  openEvent: "Менің 5 адамымды ашу",
  forget: "Осы құрылғыда мені ұмыту",
  language: "Интерфейс тілі",
  appearance: "Безендіру",
  themes: { system: "Жүйедегідей", light: "Жарық", dark: "Қараңғы" },
  roles: { admin: "Әкімші", organizer: "Ұйымдастырушы", member: "Қатысушы" },
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
  navAdmin: "Әкімші",
  adminTitle: "Әкімші панелі",
  adminCode: "Әкімші коды",
  adminCodeHint: "Ұйымдастырушылар: іс-шараға өз сауалнамаңызбен қосылып, осында оралыңыз.",
  signIn: "Кіру",
  signOut: "Шығу",
  wrongCode: "Код қате.",
  signedInAs: (role) => `Сіз кірдіңіз: ${role}`,
  orgNoEvents: "Сізге әлі іс-шара бекітілмеген. Әкімшіден сізді ұйымдастырушы етуді сұраңыз.",
  forbidden: "Сізде бұған рұқсат жоқ.",
  eventsTitle: "Іс-шаралар",
  noEvents: "Әзірге іс-шара жоқ. Біріншісін құрыңыз.",
  createEvent: "Іс-шара құру",
  eventTitle: "Атауы",
  eventDate: "Күні",
  eventVenue: "Өтетін орны",
  eventCodeOpt: "Кіру коды (міндетті емес)",
  eventCodeHint: "4-12 латын әрпі мен сан. Бос болса, өзіміз жасаймыз.",
  codeTaken: "Бұл код басқа іс-шарада қолданылған.",
  codeInvalid: "4-12 латын әрпі мен санды қолданыңыз.",
  statusOpen: "Ашық",
  statusClosed: "Жабық",
  closeReg: "Тіркеуді жабу",
  openReg: "Тіркеуді ашу",
  del: "Жою",
  confirmDeleteEvent: (title) => `«${title}» іс-шарасын жою керек пе? Қатысушылар жүйеде қалады.`,
  copyLink: "Сілтемені көшіру",
  manage: "Басқару",
  projector: "Проектор",
  allEvents: "Барлық іс-шаралар",
  attendeesTitle: "Қатысушылар",
  search: "Аты, рөлі немесе стегі бойынша іздеу",
  noAttendees: "Әзірге қатысушы жоқ. QR-кодты проекторда көрсетіңіз.",
  noResults: "Іздеуге ешкім сәйкес келмеді.",
  addAttendee: "Қатысушы қосу",
  existingMember: "Бар қатысушы",
  newProfile: "Жаңа сауалнама",
  pickMember: "Қатысушыны таңдаңыз",
  add: "Қосу",
  remove: "Шығару",
  confirmRemove: (name) => `${name} осы іс-шарадан шығарылсын ба?`,
  access: "Рұқсат",
  balance: "Мақсаттар теңгерімі",
  hintScarce: (scarce, sc, plenty, pc) => `${pc} «${plenty}» үшін тек ${sc} «${scarce}». «${scarce}» мақсаты бар адамдарды көбірек шақырыңыз.`,
  balanced: "Мақсаттар теңгерімде: әркімнің танысатын адамы бар.",
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
