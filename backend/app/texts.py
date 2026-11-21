"""Localized text for explanations, kk / ru / en.

Template text keeps the request fast (no LLM on the request path). Richer text for known
pairs can be supplied in data/explanations.json (see matching.py). The Kazakh lines are
short on purpose and should get a native speaker's review before the final demo.
"""

GOAL = {
    "en": {
        "find_job": "find a job",
        "hire": "hire people",
        "find_mentor": "find a mentor",
        "be_mentor": "mentor others",
        "find_cofounder": "find a co-founder",
        "exchange_experience": "exchange experience",
    },
    "ru": {
        "find_job": "найти работу",
        "hire": "нанимать",
        "find_mentor": "найти ментора",
        "be_mentor": "стать ментором",
        "find_cofounder": "найти кофаундера",
        "exchange_experience": "обменяться опытом",
    },
    "kk": {
        "find_job": "жұмыс табу",
        "hire": "қызметкер жалдау",
        "find_mentor": "тәлімгер табу",
        "be_mentor": "тәлімгер болу",
        "find_cofounder": "серіктес-құрылтайшы табу",
        "exchange_experience": "тәжірибе алмасу",
    },
}

# What a person with this goal brings to the conversation. {stack} and {years} are filled in.
OFFER = {
    "en": {
        "find_job": "Skills in {stack}",
        "hire": "An open position",
        "find_mentor": "Motivation and fresh questions",
        "be_mentor": "{years} of experience",
        "find_cofounder": "Skills in {stack}",
        "exchange_experience": "Experience in {stack}",
    },
    "ru": {
        "find_job": "Навыки: {stack}",
        "hire": "Открытая позиция",
        "find_mentor": "Мотивация и свежие вопросы",
        "be_mentor": "Опыт: {years}",
        "find_cofounder": "Навыки: {stack}",
        "exchange_experience": "Опыт в {stack}",
    },
    "kk": {
        "find_job": "Дағдылар: {stack}",
        "hire": "Бос қызмет орны",
        "find_mentor": "Құлшыныс және жаңа сұрақтар",
        "be_mentor": "Тәжірибе: {years}",
        "find_cofounder": "Дағдылар: {stack}",
        "exchange_experience": "Тәжірибе: {stack}",
    },
}

FRAME = {
    "en": "You want to {my}; {name} wants to {their}.",
    "ru": "Вы хотите {my}, а {name} хочет {their}.",
    "kk": "Сіздің мақсатыңыз: {my}; {name} мақсаты: {their}.",
}
# Fallback match: goals are not reciprocal, the profiles are simply close.
SIMILAR = {
    "en": "Different goals (you: {my}; {name}: {their}), but you have a lot in common.",
    "ru": "Цели разные (вы: {my}; {name}: {their}), но у вас много общего.",
    "kk": "Мақсаттарыңыз әртүрлі (сіз: {my}; {name}: {their}), бірақ ортақ тұстарыңыз көп.",
}
SHARED = {
    "en": " Shared topics: {tags}.",
    "ru": " Общее: {tags}.",
    "kk": " Ортақ тақырыптар: {tags}.",
}
ICEBREAKER = {
    "en": "Hi {first}! I noticed you work with {topic}. Can I ask you a couple of questions?",
    "ru": "Привет, {first}! Вижу, вы работаете с {topic}. Можно задать пару вопросов?",
    "kk": "Сәлем, {first}! Сіз {topic} бағытында жұмыс істейтініңізді көрдім. Бірнеше сұрақ қоюға бола ма?",
}
# Used when the two people share no tag: talk about their role instead.
ICEBREAKER_ROLE = {
    "en": "Hi {first}! I'd love to hear about your work ({role}). Do you have a few minutes?",
    "ru": "Привет, {first}! Интересно, как устроена ваша работа ({role}). Найдётся пара минут?",
    "kk": "Сәлем, {first}! Сіздің жұмысыңыз ({role}) туралы білгім келеді. Бірнеше минутыңыз бар ма?",
}


def years(lang: str, n: int) -> str:
    if lang == "ru":
        word = "лет"
        if n % 10 == 1 and n % 100 != 11:
            word = "год"
        elif 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
            word = "года"
        return f"{n} {word}"
    if lang == "kk":
        return f"{n} жыл"
    return f"{n} year" + ("" if n == 1 else "s")
