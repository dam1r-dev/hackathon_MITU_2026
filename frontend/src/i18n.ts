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
  similarBadge: string;
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
  pinTitle: string;
  pinSubmit: string;
  pinWrong: string;
  pinLink: string;
  pinLinkCta: string;
  screenLaptop: string;
  pinNewIn: string;
  pinNeedsAdmin: string;
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
  roleHire: string;
  roleHirePlaceholder: string;
  wantedRole: string;
  wantedRolePlaceholder: string;
  stackHire: string;
  experienceHire: string;
  fromYears: (n: number) => string;
  aboutHire: string;
  aboutHireHint: string;
  hiringBadge: string;
  valueCards: { title: string; text: string }[];
  goal: string;
  required: string;
  submit: string;
  loading: string;
  example: string;
  ghLabel: string;
  ghPlaceholder: string;
  ghFill: string;
  ghFilling: string;
  ghDone: (langs: number, topics: number) => string;
  ghNotFound: string;
  ghLater: string;
  tgSend: string;
  tgSending: string;
  tgConfirm: (n: number) => string;
  tgSent: (n: number) => string;
  tgOff: string;
  tgNone: string;
  tgError: string;
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
  hubTitle: string;
  hubSub: string;
  hubCodeTitle: string;
  hubCodeSub: string;
  hubCodeBtn: string;
  hubOpenTitle: string;
  hubNone: string;
  hubJoin: string;
  hubOpenMine: string;
  tabPeople: string;
  tabVenue: string;
  tabRoom: string;
  whereNow: string;
  hideMe: string;
  hereNow: string;
  youAreHere: string;
  nobodyHere: string;
  minAgo: (n: number) => string;
  roomWho: string;
  editProfile: string;
  saveProfile: string;
  cancel: string;
  venueLocations: string;
  venueLocationsHint: string;
  saved: string;
  showOnProjector: string;
  goals: Record<Goal, string>;
  goalHints: Record<Goal, string>;
  // meet now
  meetNow: string;
  meetSheetTitle: (name: string) => string;
  meetWhere: string;
  meetWhen: string;
  meetWhenNow: string;
  meetInMin: (n: number) => string;
  meetSend: string;
  meetSentToast: (name: string) => string;
  meetInvited: string;
  meetClose: string;
  meetErrOpen: string;
  meetingsTitle: string;
  meetWants: string;
  meetWaitingReply: string;
  meetAccept: string;
  meetDecline: string;
  meetWeMet: string;
  meetStartsIn: (time: string) => string;
  meetHappening: string;
  meetDoneCount: (n: number) => string;
  meetIncomingToast: (name: string) => string;
  // projector live
  liveMatches: string;
  liveMeetings: string;
  legendMutual: string;
  legendMeeting: string;
  // organizer report
  adminTabPeople: string;
  adminTabReport: string;
  repTitle: string;
  repKpiAttendees: string;
  repKpiMatched: string;
  repKpiMatches: string;
  repKpiMeetings: string;
  repMeetingsSub: (accepted: number, proposed: number) => string;
  repJoined: string;
  repJoinedEmpty: string;
  repGoals: string;
  repInsights: string;
  repNoInsights: string;
  repLocations: string;
  repNowWord: string;
  repMeetingsWord: string;
  repConnectors: string;
  repConnectorsEmpty: string;
  repMutualN: (n: number) => string;
  repPrint: string;
  repPrinted: (date: string) => string;
  repJoinedPeak: (n: number) => string;
  insightScarce: (plenty: string, pc: number, scarce: string, sc: number, who: string) => string;
  insightTop: (name: string, meetings: number, now: number) => string;
  insightLow: (pct: number) => string;
  inviteWho: Record<Goal, string>;
};

const en: Dict = {
  navFind: "Events",
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
  similarBadge: "Similar interests",
  fewYet: "Only a few people have joined so far. Your list will grow as others arrive.",
  wantMeet: "Want to meet",
  meetWaiting: "Sent. If they press it too, you will both see contacts.",
  meetMutual: "It's mutual! Contact:",
  noContact: "no contact left, find them in the room",
  mutualTitle: "Mutual: go say hi",
  notInEvent: "You are not in this event yet.",
  screenScan: "Scan to join",
  screenCode: "Event code",
  pinTitle: "Enter event code",
  pinSubmit: "Join",
  pinWrong: "Code is wrong or expired — check the screen",
  pinLink: "Have a code from the screen?",
  pinLinkCta: "Enter code",
  screenLaptop: "From a laptop:",
  pinNewIn: "new code in",
  pinNeedsAdmin: "Sign in to the admin panel in this browser to show the laptop code",
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
  roleHire: "Your position / company",
  roleHirePlaceholder: "HR, Kaspi.kz",
  wantedRole: "Who do you need?",
  wantedRolePlaceholder: "Junior frontend developer",
  stackHire: "Required skills",
  experienceHire: "Minimum experience",
  fromYears: (n) => (n === 0 ? "any" : `from ${n} ${n === 1 ? "year" : "years"}`),
  aboutHire: "About the vacancy",
  aboutHireHint: "Remote/office, salary range, what the person will do",
  hiringBadge: "Hiring",
  valueCards: [
    { title: "From QR to handshake in 3 minutes", text: "Scan the code, spend 60 seconds on the form, and get 5 people worth approaching, each with a ready first line." },
    { title: "Mutual benefit only", text: "Job seekers see who is hiring and the other way round. A contact opens only when the interest is mutual, so there is no spam." },
    { title: "Networking in the real room", text: "See who is at the buffet or by the stage right now. Agree on a meeting in one tap, and the organizer gets a report on how many connections happened." },
  ],
  goal: "Your goal for today",
  required: "Required",
  submit: "Find my 5 people",
  loading: "Matching...",
  example: "Fill with an example",
  ghLabel: "GitHub",
  ghPlaceholder: "GitHub username",
  ghFill: "Fill in",
  ghFilling: "Loading...",
  ghDone: (l, tp) => `Filled from GitHub: ${l} languages, ${tp} topics`,
  ghNotFound: "No such GitHub user. Check the username.",
  ghLater: "GitHub is not answering right now. Try again later.",
  tgSend: "Send results to Telegram",
  tgSending: "Sending...",
  tgConfirm: (n) => `Send a personal summary to ${n} connected participants?`,
  tgSent: (n) => `Sent: ${n}`,
  tgOff: "The Telegram bot is not connected on this server.",
  tgNone: "Nobody has connected Telegram yet.",
  tgError: "Could not send. Try again.",
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
  hubTitle: "Networking at Qazaq IT events",
  hubSub: "Pick an event, tell us about yourself in 60 seconds and meet the right people.",
  hubCodeTitle: "Enter code from the screen",
  hubCodeSub: "At the event? Type the 6-digit code from the projector.",
  hubCodeBtn: "Enter code",
  hubOpenTitle: "Open events",
  hubNone: "No open events yet. Check back soon.",
  hubJoin: "Join",
  hubOpenMine: "Open my matches",
  tabPeople: "My people",
  tabVenue: "Venue",
  tabRoom: "Room",
  whereNow: "Where are you now?",
  hideMe: "Hide me",
  hereNow: "here now",
  youAreHere: "You are here",
  nobodyHere: "Nobody yet",
  minAgo: (n) => n < 1 ? 'just now' : `${n} min ago`,
  roomWho: "Who is looking for what",
  editProfile: "Edit profile",
  saveProfile: "Save",
  cancel: "Cancel",
  venueLocations: "Venue locations",
  venueLocationsHint: "One place per line, up to 12. Guests tell where they are.",
  saved: "Saved",
  showOnProjector: "Now in the venue",
  // meet now
  meetNow: "Meet now",
  meetSheetTitle: (name) => `Meet ${name}`,
  meetWhere: "Where?",
  meetWhen: "When?",
  meetWhenNow: "Now",
  meetInMin: (n) => `${n} min`,
  meetSend: "Send invite",
  meetSentToast: (name) => `Invite sent to ${name}`,
  meetInvited: "Meeting planned",
  meetClose: "Close",
  meetErrOpen: "You already have an open meeting with this person.",
  meetingsTitle: "Meetings",
  meetWants: "wants to meet you",
  meetWaitingReply: "Waiting for a reply",
  meetAccept: "Accept",
  meetDecline: "Decline",
  meetWeMet: "We met",
  meetStartsIn: (time) => `in ${time}`,
  meetHappening: "It's time!",
  meetDoneCount: (n) => `Done: ${n}`,
  meetIncomingToast: (name) => `${name} invites you to meet`,
  liveMatches: "Matches",
  liveMeetings: "Meetings",
  legendMutual: "Mutual interest",
  legendMeeting: "Meeting",
  adminTabPeople: "People",
  adminTabReport: "Report",
  repTitle: "Networking report",
  repKpiAttendees: "Attendees",
  repKpiMatched: "Found a match",
  repKpiMatches: "Matches",
  repKpiMeetings: "Meetings held",
  repMeetingsSub: (a, p) => `${a} planned · ${p} invited`,
  repJoined: "Joined over time",
  repJoinedEmpty: "No join times recorded yet.",
  repGoals: "Goals: who is looking, who offers",
  repInsights: "Insights",
  repNoInsights: "Nothing to flag yet. The room looks balanced.",
  repLocations: "Where people meet",
  repNowWord: "here now",
  repMeetingsWord: "meetings",
  repConnectors: "Top connectors",
  repConnectorsEmpty: "No mutual matches yet.",
  repMutualN: (n) => `${n} mutual`,
  repPrint: "Print / PDF",
  repPrinted: (date) => `Generated ${date}`,
  repJoinedPeak: (n) => `Peak: ${n} per 10 min`,
  insightScarce: (plenty, pc, scarce, sc, who) => `${pc} people are "${plenty}", but only ${sc} are "${scarce}". Invite ${who} to the next meetup.`,
  insightTop: (name, m, now) => `Busiest spot: ${name} (${m} meetings, ${now} here now).`,
  insightLow: (pct) => `Only ${pct}% found a match. Encourage "Meet now" and show matches on the projector.`,
  inviteWho: { find_job: "job seekers", hire: "HR and hiring managers", find_mentor: "people looking for a mentor", be_mentor: "mentors", find_cofounder: "co-founder seekers", exchange_experience: "more peers" },
};

const ru: Dict = {
  navFind: "События",
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
  similarBadge: "Похожие интересы",
  fewYet: "Пока присоединились немногие. Список пополнится, когда придут другие.",
  wantMeet: "Хочу познакомиться",
  meetWaiting: "Отправлено. Если человек тоже нажмёт, вы оба увидите контакты.",
  meetMutual: "Взаимно! Контакт:",
  noContact: "контакт не оставлен, найдите человека в зале",
  mutualTitle: "Взаимно: подойдите поздороваться",
  notInEvent: "Вы ещё не участник этого мероприятия.",
  screenScan: "Отсканируйте, чтобы присоединиться",
  screenCode: "Код мероприятия",
  pinTitle: "Введите код события",
  pinSubmit: "Войти",
  pinWrong: "Код неверный или устарел — проверьте экран",
  pinLink: "Есть код с экрана?",
  pinLinkCta: "Ввести код",
  screenLaptop: "С ноутбука:",
  pinNewIn: "новый код через",
  pinNeedsAdmin: "Войдите в админку в этом браузере, чтобы показать код для ноутбуков",
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
  roleHire: "Ваша должность / компания",
  roleHirePlaceholder: "HR, Kaspi.kz",
  wantedRole: "Кого вы ищете?",
  wantedRolePlaceholder: "Junior frontend-разработчик",
  stackHire: "Требуемые навыки",
  experienceHire: "Минимальный опыт",
  fromYears: (n) => (n === 0 ? "любой" : `от ${n} ${n % 10 === 1 && n % 100 !== 11 ? "года" : "лет"}`),
  aboutHire: "О вакансии",
  aboutHireHint: "Удалённо/офис, вилка зарплаты, чем будет заниматься человек",
  hiringBadge: "Ищем",
  valueCards: [
    { title: "От QR до рукопожатия за 3 минуты", text: "Сканируете код, 60 секунд на анкету — и вот 5 человек, ради которых стоит подойти, с готовой первой фразой." },
    { title: "Только взаимная польза", text: "Ищущий работу видит тех, кто нанимает, и наоборот. Контакт открывается, только когда интерес взаимный — без спама." },
    { title: "Нетворкинг в реальном зале", text: "Видно, кто сейчас в буфете или у сцены. Договоритесь о встрече в один тап, а организатор получит отчёт, сколько знакомств случилось." },
  ],
  goal: "Ваша цель сегодня",
  required: "Обязательное поле",
  submit: "Найти 5 человек",
  loading: "Подбираем...",
  example: "Заполнить примером",
  ghLabel: "GitHub",
  ghPlaceholder: "Ник на GitHub",
  ghFill: "Заполнить",
  ghFilling: "Загрузка...",
  ghDone: (l, tp) => `Заполнено из GitHub: языков ${l}, тем ${tp}`,
  ghNotFound: "Такого пользователя GitHub нет. Проверьте ник.",
  ghLater: "GitHub сейчас не отвечает. Попробуйте позже.",
  tgSend: "Отправить итоги в Telegram",
  tgSending: "Отправляем...",
  tgConfirm: (n) => `Отправить личные итоги ${n} подключённым участникам?`,
  tgSent: (n) => `Отправлено: ${n}`,
  tgOff: "Telegram-бот на этом сервере не подключён.",
  tgNone: "Пока никто не подключил Telegram.",
  tgError: "Не удалось отправить. Попробуйте ещё раз.",
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
  hubTitle: "Нетворкинг на событиях Qazaq IT",
  hubSub: "Выберите событие, расскажите о себе за 60 секунд и найдите нужных людей.",
  hubCodeTitle: "Введите код с экрана",
  hubCodeSub: "Вы на месте? Введите 6-значный код с проектора.",
  hubCodeBtn: "Ввести код",
  hubOpenTitle: "Открытые события",
  hubNone: "Пока нет открытых событий. Загляните позже.",
  hubJoin: "Присоединиться",
  hubOpenMine: "Открыть мои совпадения",
  tabPeople: "Мои люди",
  tabVenue: "Площадка",
  tabRoom: "Зал",
  whereNow: "Где вы сейчас?",
  hideMe: "Скрыть меня",
  hereNow: "сейчас здесь",
  youAreHere: "Вы здесь",
  nobodyHere: "Пока никого",
  minAgo: (n) => n < 1 ? 'только что' : `${n} мин назад`,
  roomWho: "Кто что ищет",
  editProfile: "Редактировать профиль",
  saveProfile: "Сохранить",
  cancel: "Отмена",
  venueLocations: "Места на площадке",
  venueLocationsHint: "По одному месту в строке, до 12. Гости отмечают, где они.",
  saved: "Сохранено",
  showOnProjector: "Сейчас на площадке",
  // meet now
  meetNow: "Встретиться сейчас",
  meetSheetTitle: (name) => `Встреча: ${name}`,
  meetWhere: "Где?",
  meetWhen: "Когда?",
  meetWhenNow: "Сейчас",
  meetInMin: (n) => `${n} мин`,
  meetSend: "Отправить приглашение",
  meetSentToast: (name) => `Приглашение отправлено: ${name}`,
  meetInvited: "Встреча в планах",
  meetClose: "Закрыть",
  meetErrOpen: "С этим человеком уже есть открытая встреча.",
  meetingsTitle: "Встречи",
  meetWants: "хочет встретиться",
  meetWaitingReply: "Ждём ответа",
  meetAccept: "Принять",
  meetDecline: "Отклонить",
  meetWeMet: "Встретились",
  meetStartsIn: (time) => `через ${time}`,
  meetHappening: "Пора!",
  meetDoneCount: (n) => `Состоялось: ${n}`,
  meetIncomingToast: (name) => `${name} зовёт вас на встречу`,
  liveMatches: "Совпадений",
  liveMeetings: "Встреч",
  legendMutual: "Взаимный интерес",
  legendMeeting: "Встреча",
  adminTabPeople: "Участники",
  adminTabReport: "Отчёт",
  repTitle: "Отчёт по нетворкингу",
  repKpiAttendees: "Участников",
  repKpiMatched: "Нашли совпадение",
  repKpiMatches: "Совпадений",
  repKpiMeetings: "Встреч состоялось",
  repMeetingsSub: (a, p) => `${a} назначено · ${p} приглашений`,
  repJoined: "Приход участников",
  repJoinedEmpty: "Время прихода пока не записано.",
  repGoals: "Цели: кто ищет, кто предлагает",
  repInsights: "Выводы",
  repNoInsights: "Пока нечего отметить. Зал выглядит сбалансированным.",
  repLocations: "Где общаются",
  repNowWord: "сейчас здесь",
  repMeetingsWord: "встреч",
  repConnectors: "Главные коннекторы",
  repConnectorsEmpty: "Взаимных совпадений пока нет.",
  repMutualN: (n) => `${n} взаимных`,
  repPrint: "Печать / PDF",
  repPrinted: (date) => `Сформировано ${date}`,
  repJoinedPeak: (n) => `Пик: ${n} за 10 мин`,
  insightScarce: (plenty, pc, scarce, sc, who) => `${pc} с целью «${plenty}», а «${scarce}» только ${sc}. Пригласите ${who} на следующий митап.`,
  insightTop: (name, m, now) => `Самое людное место: ${name} (встреч: ${m}, сейчас здесь: ${now}).`,
  insightLow: (pct) => `Совпадение нашли только ${pct}%. Предлагайте «Встретиться сейчас» и показывайте совпадения на проекторе.`,
  inviteWho: { find_job: "тех, кто ищет работу", hire: "HR и рекрутеров", find_mentor: "тех, кто ищет ментора", be_mentor: "менторов", find_cofounder: "тех, кто ищет сооснователя", exchange_experience: "больше коллег" },
};

const kk: Dict = {
  navFind: "Іс-шаралар",
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
  similarBadge: "Ұқсас қызығушылықтар",
  fewYet: "Әзірге аз адам қосылды. Басқалар келгенде тізім толығады.",
  wantMeet: "Танысқым келеді",
  meetWaiting: "Жіберілді. Ол да басса, екеуіңіз де байланысты көресіздер.",
  meetMutual: "Өзара! Байланыс:",
  noContact: "байланыс қалдырылмаған, оны залдан табыңыз",
  mutualTitle: "Өзара: барып амандасыңыз",
  notInEvent: "Сіз әлі бұл іс-шараның қатысушысы емессіз.",
  screenScan: "Қосылу үшін сканерлеңіз",
  screenCode: "Іс-шара коды",
  pinTitle: "Іс-шара кодын енгізіңіз",
  pinSubmit: "Кіру",
  pinWrong: "Код қате немесе ескірген — экранды тексеріңіз",
  pinLink: "Экрандағы код бар ма?",
  pinLinkCta: "Кодты енгізу",
  screenLaptop: "Ноутбуктен:",
  pinNewIn: "жаңа код",
  pinNeedsAdmin: "Ноутбук кодын көрсету үшін осы браузерде әкімші панеліне кіріңіз",
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
  roleHire: "Сіздің лауазымыңыз / компания",
  roleHirePlaceholder: "HR, Kaspi.kz",
  wantedRole: "Кімді іздейсіз?",
  wantedRolePlaceholder: "Junior frontend әзірлеушісі",
  stackHire: "Қажетті дағдылар",
  experienceHire: "Ең төменгі тәжірибе",
  fromYears: (n) => (n === 0 ? "маңызды емес" : `${n} жылдан`),
  aboutHire: "Вакансия туралы",
  aboutHireHint: "Қашықтан/кеңседе, жалақы аралығы, адам немен айналысады",
  hiringBadge: "Іздейді",
  valueCards: [
    { title: "QR-дан қол алысуға дейін 3 минут", text: "Кодты сканерлейсіз, сауалнамаға 60 секунд жұмсайсыз, сонда дайын алғашқы сөйлемі бар, жақындауға тұрарлық 5 адамды көресіз." },
    { title: "Тек өзара пайда", text: "Жұмыс іздеуші жалдайтындарды көреді, керісінше де солай. Байланыс тек қызығушылық өзара болғанда ашылады, спам жоқ." },
    { title: "Нақты залдағы нетворкинг", text: "Қазір кімнің буфетте немесе сахна жанында екені көрінеді. Кездесуді бір түртумен келісіңіз, ал ұйымдастырушы қанша танысу болғаны туралы есеп алады." },
  ],
  goal: "Бүгінгі мақсатыңыз",
  required: "Міндетті өріс",
  submit: "5 адамды табу",
  loading: "Іздеп жатырмыз...",
  example: "Мысалмен толтыру",
  ghLabel: "GitHub",
  ghPlaceholder: "GitHub логині",
  ghFill: "Толтыру",
  ghFilling: "Жүктелуде...",
  ghDone: (l, tp) => `GitHub-тан толтырылды: ${l} тіл, ${tp} тақырып`,
  ghNotFound: "Мұндай GitHub пайдаланушысы жоқ. Логинді тексеріңіз.",
  ghLater: "GitHub қазір жауап бермейді. Кейінірек қайталаңыз.",
  tgSend: "Нәтижені Telegram-ға жіберу",
  tgSending: "Жіберілуде...",
  tgConfirm: (n) => `Қосылған ${n} қатысушыға жеке қорытынды жіберілсін бе?`,
  tgSent: (n) => `Жіберілді: ${n}`,
  tgOff: "Бұл серверде Telegram боты қосылмаған.",
  tgNone: "Әзірге ешкім Telegram-ды қосқан жоқ.",
  tgError: "Жіберу мүмкін болмады. Қайталап көріңіз.",
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
  hubTitle: "Qazaq IT іс-шараларындағы нетворкинг",
  hubSub: "Іс-шараны таңдаңыз, 60 секундта өзіңіз туралы айтыңыз да, қажет адамдарды табыңыз.",
  hubCodeTitle: "Экрандағы кодты енгізіңіз",
  hubCodeSub: "Іс-шарадасыз ба? Проектордағы 6 таңбалы кодты теріңіз.",
  hubCodeBtn: "Кодты енгізу",
  hubOpenTitle: "Ашық іс-шаралар",
  hubNone: "Әзірге ашық іс-шара жоқ. Кейінірек қараңыз.",
  hubJoin: "Қосылу",
  hubOpenMine: "Менің сәйкестіктерімді ашу",
  tabPeople: "Менің адамдарым",
  tabVenue: "Алаң",
  tabRoom: "Зал",
  whereNow: "Қазір қайдасыз?",
  hideMe: "Мені жасыру",
  hereNow: "қазір осында",
  youAreHere: "Сіз осындасыз",
  nobodyHere: "Әзірге ешкім жоқ",
  minAgo: (n) => n < 1 ? 'жаңа ғана' : `${n} мин бұрын`,
  roomWho: "Кім нені іздейді",
  editProfile: "Профильді өңдеу",
  saveProfile: "Сақтау",
  cancel: "Бас тарту",
  venueLocations: "Алаңдағы орындар",
  venueLocationsHint: "Әр жолға бір орын, 12-ге дейін. Қонақтар қайда екенін белгілейді.",
  saved: "Сақталды",
  showOnProjector: "Қазір алаңда",
  // meet now
  meetNow: "Қазір кездесу",
  meetSheetTitle: (name) => `Кездесу: ${name}`,
  meetWhere: "Қайда?",
  meetWhen: "Қашан?",
  meetWhenNow: "Қазір",
  meetInMin: (n) => `${n} мин`,
  meetSend: "Шақыру жіберу",
  meetSentToast: (name) => `Шақыру жіберілді: ${name}`,
  meetInvited: "Кездесу жоспарда",
  meetClose: "Жабу",
  meetErrOpen: "Бұл адаммен ашық кездесу бар.",
  meetingsTitle: "Кездесулер",
  meetWants: "кездескісі келеді",
  meetWaitingReply: "Жауап күтілуде",
  meetAccept: "Қабылдау",
  meetDecline: "Бас тарту",
  meetWeMet: "Кездестік",
  meetStartsIn: (time) => `${time} кейін`,
  meetHappening: "Уақыты келді!",
  meetDoneCount: (n) => `Өтті: ${n}`,
  meetIncomingToast: (name) => `${name} сізді кездесуге шақырады`,
  liveMatches: "Сәйкестік",
  liveMeetings: "Кездесу",
  legendMutual: "Өзара қызығушылық",
  legendMeeting: "Кездесу",
  adminTabPeople: "Қатысушылар",
  adminTabReport: "Есеп",
  repTitle: "Нетворкинг есебі",
  repKpiAttendees: "Қатысушы",
  repKpiMatched: "Сәйкестік тапты",
  repKpiMatches: "Сәйкестік",
  repKpiMeetings: "Өткен кездесу",
  repMeetingsSub: (a, p) => `${a} белгіленді · ${p} шақыру`,
  repJoined: "Қатысушылардың келуі",
  repJoinedEmpty: "Келу уақыты әзірге жазылмаған.",
  repGoals: "Мақсаттар: кім іздейді, кім ұсынады",
  repInsights: "Қорытындылар",
  repNoInsights: "Әзірге атап өтетін ештеңе жоқ. Зал тепе-тең.",
  repLocations: "Қай жерде сөйлесті",
  repNowWord: "қазір осында",
  repMeetingsWord: "кездесу",
  repConnectors: "Басты байланыстырушылар",
  repConnectorsEmpty: "Өзара сәйкестік әзірге жоқ.",
  repMutualN: (n) => `${n} өзара`,
  repPrint: "Басып шығару / PDF",
  repPrinted: (date) => `Жасалған күні: ${date}`,
  repJoinedPeak: (n) => `Шың: 10 минутта ${n}`,
  insightScarce: (plenty, pc, scarce, sc, who) => `«${plenty}» мақсаты бар ${pc} адам, ал «${scarce}» тек ${sc}. Келесі митапқа ${who} шақырыңыз.`,
  insightTop: (name, m, now) => `Ең көп қауымдасатын жер: ${name} (кездесу: ${m}, қазір осында: ${now}).`,
  insightLow: (pct) => `Сәйкестікті тек ${pct}% тапты. «Қазір кездесу» батырмасын ұсынып, сәйкестіктерді проекторда көрсетіңіз.`,
  inviteWho: { find_job: "жұмыс іздейтіндерді", hire: "HR мен рекрутерлерді", find_mentor: "ментор іздейтіндерді", be_mentor: "тәлімгерлерді", find_cofounder: "тең құрылтайшы іздейтіндерді", exchange_experience: "көбірек әріптестерді" },
};

export const dict: Record<Lang, Dict> = { en, ru, kk };

export const LANGS: { value: Lang; label: string }[] = [
  { value: "kk", label: "ҚАЗ" },
  { value: "ru", label: "РУС" },
  { value: "en", label: "ENG" },
];
