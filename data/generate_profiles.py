"""Generate synthetic meetup profiles into data/profiles.json.

All names are fictional combinations of common first and last names. No real people,
no scraping. Deterministic (fixed seed), so re-running gives the same file.

    python data/generate_profiles.py            # 130 profiles
    python data/generate_profiles.py --n 200    # more

The first 10 hand-written profiles (p_001..p_010) are kept as they are, because the
demo and tests refer to them. Everything after them is generated.
"""
from __future__ import annotations

import argparse
import json
import random
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent / "profiles.json"
SEED = 2026
KEEP_FIRST = 10

FIRST_M = ["Aidar", "Arman", "Asset", "Bauyrzhan", "Dauren", "Yerbol", "Ilyas", "Kairat", "Marat",
           "Nurbek", "Olzhas", "Ruslan", "Sanzhar", "Temirlan", "Zhanibek", "Alikhan", "Azamat",
           "Beibit", "Daniyal", "Rustem", "Adil", "Miras", "Alan", "Erasyl", "Dmitry", "Artem"]
FIRST_F = ["Aigerim", "Akbota", "Assel", "Dinara", "Zhanna", "Kamila", "Laura", "Meruyert",
           "Nazerke", "Saule", "Togzhan", "Ulzhan", "Zarina", "Aliya", "Gulnaz", "Dilnaz",
           "Moldir", "Anel", "Tomiris", "Karina", "Elena", "Yana"]
LAST = ["Abenov", "Baimukhanov", "Dzhaksybekov", "Yesenov", "Zhakupov", "Ibraev", "Kenzhebayev",
        "Mukanov", "Nurgaliev", "Ospanov", "Rakhimov", "Seitkali", "Tokhtarov", "Utepov",
        "Khamitov", "Shaikenov", "Amanov", "Beisenov", "Zhunusov", "Karimov", "Smagulov",
        "Tasmagambetov", "Orazov", "Myrzakhmetov", "Sarsenov", "Kuanyshev", "Volkov", "Kim"]


def _female(last: str) -> str:
    return last + "a" if last.endswith(("ov", "ev", "in")) else last


# Tracks: roles by seniority, a stack pool and interests that fit them.
TRACKS = {
    "backend": {
        "junior": "Junior backend developer", "mid": "Backend developer", "senior": "Senior backend engineer",
        "lead": "Backend team lead",
        "stack": ["Python", "FastAPI", "Django", "PostgreSQL", "Go", "Java", "Spring", "Redis", "Kafka",
                  "Node.js", "Docker", "gRPC"],
        "interests": ["fintech", "high load", "API design", "e-commerce", "open source", "LLM agents"],
    },
    "frontend": {
        "junior": "Junior frontend developer", "mid": "Frontend developer", "senior": "Senior frontend engineer",
        "lead": "Frontend lead",
        "stack": ["React", "TypeScript", "Next.js", "Vue", "Tailwind", "Redux", "Vite", "Figma"],
        "interests": ["design systems", "web performance", "edtech", "accessibility", "e-commerce"],
    },
    "mobile": {
        "junior": "Junior mobile developer", "mid": "Mobile developer", "senior": "Senior iOS engineer",
        "lead": "Mobile team lead",
        "stack": ["Kotlin", "Swift", "Flutter", "Dart", "React Native", "Firebase"],
        "interests": ["super apps", "fintech", "UX", "edtech", "gamedev"],
    },
    "data": {
        "junior": "Junior data analyst", "mid": "Data scientist", "senior": "Senior ML engineer",
        "lead": "Head of data",
        "stack": ["Python", "pandas", "SQL", "PyTorch", "scikit-learn", "Airflow", "Spark", "MLOps",
                  "LangChain", "ClickHouse"],
        "interests": ["LLM agents", "computer vision", "NLP for Kazakh", "healthcare", "agritech",
                      "recommender systems"],
    },
    "devops": {
        "junior": "Junior DevOps engineer", "mid": "DevOps engineer", "senior": "Senior SRE",
        "lead": "Platform team lead",
        "stack": ["Kubernetes", "Terraform", "Docker", "AWS", "GCP", "Ansible", "Prometheus", "Go",
                  "Linux", "CI/CD"],
        "interests": ["cloud", "platform engineering", "observability", "security", "open source"],
    },
    "qa": {
        "junior": "Junior QA engineer", "mid": "QA automation engineer", "senior": "Senior QA engineer",
        "lead": "QA lead",
        "stack": ["Selenium", "Playwright", "Python", "Java", "Postman", "Cypress", "JMeter"],
        "interests": ["test automation", "fintech", "quality culture", "e-commerce"],
    },
    "product": {
        "junior": "Junior product manager", "mid": "Product manager", "senior": "Senior product designer",
        "lead": "Head of product",
        "stack": ["Figma", "Jira", "SQL", "Amplitude", "Miro", "Notion"],
        "interests": ["edtech", "fintech", "UX research", "growth", "startups", "govtech"],
    },
    "security": {
        "junior": "Junior security analyst", "mid": "Security engineer", "senior": "Senior pentester",
        "lead": "Head of information security",
        "stack": ["Linux", "Python", "Burp Suite", "SIEM", "Wireshark", "Kubernetes"],
        "interests": ["security", "CTF", "fintech", "govtech", "cloud"],
    },
}

# Goal -> (share of generated profiles, experience range, seniority levels)
GOALS = {
    "find_job": (0.22, (0, 6), ["junior", "mid"]),
    "hire": (0.15, (5, 15), ["lead", "senior"]),
    "find_mentor": (0.16, (0, 3), ["junior", "mid"]),
    "be_mentor": (0.14, (5, 16), ["senior", "lead"]),
    "find_cofounder": (0.15, (2, 12), ["mid", "senior", "lead"]),
    "exchange_experience": (0.18, (2, 10), ["mid", "senior"]),
}

# Bios: {role} {stack} {interest} are filled in. 3 variants per goal and language.
BIOS = {
    "ru": {
        "find_job": ["Ищу работу {role_l} в продуктовой команде. Пишу на {stack}, интересуюсь темой {interest}.",
                     "Открыт к новым предложениям. Есть опыт с {stack}, хочу расти в {interest}.",
                     "Ищу первую или следующую позицию, где можно работать с {stack}."],
        "hire": ["Нанимаем в команду: нужен человек со знанием {stack}. Делаем продукт в {interest}.",
                 "Расширяем команду, ищем разработчиков с опытом {stack}. Удалёнка или Алматы.",
                 "Открыта вакансия, стек {stack}. Помогаю кандидатам с онбордингом сам."],
        "find_mentor": ["Хочу найти ментора, чтобы быстрее расти в {stack}. Интересно направление {interest}.",
                        "Ищу наставника: готовлюсь к первому серьёзному проекту на {stack}.",
                        "Нужен совет опытного человека по карьере и по {stack}."],
        "be_mentor": ["Готов менторить начинающих в {stack}. Раз в неделю могу созваниваться.",
                      "Помогаю джунам с код-ревью и карьерой. Основной стек: {stack}.",
                      "Делюсь опытом в {interest} и {stack}, люблю объяснять сложное просто."],
        "find_cofounder": ["Ищу кофаундера для стартапа в {interest}. Со своей стороны даю {stack}.",
                           "Есть идея в {interest} и прототип. Нужен партнёр с другим набором навыков.",
                           "Хочу собрать команду для своего продукта, с меня {stack}."],
        "exchange_experience": ["Хочу обменяться опытом по {stack} и {interest}.",
                                "Интересно поговорить с коллегами, кто тоже работает с {stack}.",
                                "Ищу людей, с кем можно обсудить подходы в {interest}."],
    },
    "en": {
        "find_job": ["Looking for a {role_l} role in a product team. I work with {stack} and care about {interest}.",
                     "Open to new opportunities. Hands-on with {stack}, want to grow in {interest}.",
                     "Searching for my next position where I can use {stack} every day."],
        "hire": ["We are hiring: looking for people who know {stack}. Building a product in {interest}.",
                 "Growing the team, need engineers with {stack}. Remote or Almaty office.",
                 "Open position, stack is {stack}. I onboard new people myself."],
        "find_mentor": ["Looking for a mentor to grow faster in {stack}. Interested in {interest}.",
                        "Want a mentor while I prepare for my first serious {stack} project.",
                        "Need advice from someone experienced about career and {stack}."],
        "be_mentor": ["Happy to mentor beginners in {stack}. Can do a weekly call.",
                      "I help juniors with code review and career questions. Main stack: {stack}.",
                      "Sharing what I know about {interest} and {stack}, I like explaining hard things simply."],
        "find_cofounder": ["Looking for a co-founder for a startup in {interest}. I bring {stack}.",
                           "I have an idea in {interest} and a prototype. Need a partner with different skills.",
                           "Building my own product and looking for a partner. I cover {stack}."],
        "exchange_experience": ["Want to swap experience on {stack} and {interest}.",
                                "Keen to talk with people who also work with {stack}.",
                                "Looking for peers to discuss approaches in {interest}."],
    },
    "kk": {
        "find_job": ["Өнім командасынан жұмыс іздеп жүрмін. {stack} қолданамын, {interest} саласы қызық.",
                     "Жаңа ұсыныстарға ашықпын. {stack} бойынша тәжірибем бар.",
                     "{stack} күнде қолданатын келесі жұмыс орнын іздеймін."],
        "hire": ["Командаға адам іздейміз: {stack} білетін маман керек. {interest} саласында өнім жасаймыз.",
                 "Команданы кеңейтіп жатырмыз, {stack} тәжірибесі бар әзірлеушілер керек.",
                 "Бос орын бар, стек: {stack}. Жаңа адамдарды өзім үйретемін."],
        "find_mentor": ["{stack} бойынша тезірек өсу үшін тәлімгер іздеймін. {interest} қызықтырады.",
                        "Алғашқы үлкен {stack} жобасына дайындалып жүрмін, тәлімгер керек.",
                        "Мансап және {stack} бойынша тәжірибелі адамның кеңесі керек."],
        "be_mentor": ["{stack} бойынша жаңадан бастағандарға тәлімгер бола аламын.",
                      "Джуниорларға код-ревью мен мансап бойынша көмектесемін. Негізгі стек: {stack}.",
                      "{interest} және {stack} бойынша тәжірибеммен бөлісемін."],
        "find_cofounder": ["{interest} саласындағы стартапқа серіктес іздеймін. Менен: {stack}.",
                           "{interest} бойынша идеям мен прототипім бар. Басқа дағдылары бар серіктес керек.",
                           "Өз өнімімді жасап жатырмын, серіктес іздеймін. Мен {stack} жағын жабамын."],
        "exchange_experience": ["{stack} және {interest} бойынша тәжірибе алмасқым келеді.",
                                "{stack} қолданатын әріптестермен сөйлескім келеді.",
                                "{interest} саласындағы тәсілдерді талқылайтын адамдар іздеймін."],
    },
}
LANG_WEIGHTS = [("ru", 0.45), ("en", 0.3), ("kk", 0.25)]


def _pick_lang(rng: random.Random) -> str:
    r, acc = rng.random(), 0.0
    for lang, w in LANG_WEIGHTS:
        acc += w
        if r < acc:
            return lang
    return "ru"


def _goal_plan(n: int, rng: random.Random) -> list[str]:
    plan: list[str] = []
    for goal, (share, _, _) in GOALS.items():
        plan += [goal] * max(8, round(share * n))
    while len(plan) < n:
        plan.append(rng.choice(list(GOALS)))
    rng.shuffle(plan)
    return plan[:n] if len(plan) > n else plan


def make_profile(i: int, goal: str, rng: random.Random, used_names: set[str]) -> dict:
    track_name = rng.choice(list(TRACKS))
    track = TRACKS[track_name]
    _, (lo, hi), levels = GOALS[goal]
    exp = rng.randint(lo, hi)
    # Seniority follows experience, limited to the levels that make sense for the goal.
    order = ["junior", "mid", "senior", "lead"]
    natural = 0 if exp <= 2 else 1 if exp <= 5 else 2 if exp <= 9 else 3
    level = min(levels, key=lambda lv: abs(order.index(lv) - natural))
    if goal == "hire" and track_name not in ("product",) and rng.random() < 0.25:
        role = rng.choice(["CTO", "Engineering manager", "Tech recruiter"])
    else:
        role = track[level]
    stack = rng.sample(track["stack"], k=min(len(track["stack"]), rng.randint(2, 4)))
    interests = rng.sample(track["interests"], k=rng.randint(1, 3))
    if rng.random() < 0.2:  # some cross-track interest keeps the map less clustered
        other = TRACKS[rng.choice(list(TRACKS))]["interests"]
        extra = rng.choice(other)
        if extra not in interests:
            interests.append(extra)

    while True:
        female = rng.random() < 0.45
        first = rng.choice(FIRST_F if female else FIRST_M)
        last = rng.choice(LAST)
        name = f"{first} {_female(last) if female else last}"
        if name not in used_names:
            used_names.add(name)
            break

    lang = _pick_lang(rng)
    about = rng.choice(BIOS[lang][goal]).format(
        role_l=role.lower(), stack=", ".join(stack[:2]), interest=interests[0]
    )
    return {
        "id": f"p_{i:03d}",
        "name": name,
        "role": role,
        "stack": stack,
        "experience_years": exp,
        "interests": interests,
        "about": about,
        "goal": goal,
        "lang": lang,
    }


def generate(n: int, keep: list[dict]) -> list[dict]:
    rng = random.Random(SEED)
    used = {p["name"] for p in keep}
    out = list(keep)
    for k, goal in enumerate(_goal_plan(n - len(keep), rng)):
        out.append(make_profile(len(keep) + k + 1, goal, rng, used))
    return out


def validate(profiles: list[dict]) -> None:
    goals = Counter(p["goal"] for p in profiles)
    langs = Counter(p["lang"] for p in profiles)
    assert len(profiles) >= 100, "need 100+ profiles"
    assert set(goals) == set(GOALS), f"missing goals: {set(GOALS) - set(goals)}"
    assert set(langs) == {"kk", "ru", "en"}, "need kk/ru/en bios"
    assert len({p["id"] for p in profiles}) == len(profiles), "ids must be unique"
    assert len({p["name"] for p in profiles}) == len(profiles), "names must be unique"
    for p in profiles:
        assert p["stack"] and p["about"] and p["role"], p["id"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=130)
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()

    keep: list[dict] = []
    if args.out.exists():
        keep = json.loads(args.out.read_text(encoding="utf-8"))[:KEEP_FIRST]
    profiles = generate(args.n, keep)
    validate(profiles)
    lines = ",\n".join("  " + json.dumps(p, ensure_ascii=False) for p in profiles)
    args.out.write_text("[\n" + lines + "\n]\n", encoding="utf-8")
    print(f"wrote {len(profiles)} profiles to {args.out}")
    print("goals:", dict(Counter(p["goal"] for p in profiles)))
    print("langs:", dict(Counter(p["lang"] for p in profiles)))
    print("roles:", len({p["role"] for p in profiles}), "distinct")


if __name__ == "__main__":
    main()
