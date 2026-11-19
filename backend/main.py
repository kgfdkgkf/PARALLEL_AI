"""ПАРАЛЛЕЛЬ — AI Core.

Тонкий backend, который превращает пользовательскую гипотезу в структурированную
вселенную, следующие точки выбора и реплики жителей. Совместим с любым
OpenAI-compatible Chat Completions endpoint (OpenAI, DeepSeek, OpenRouter,
Together, локальный vLLM/Ollama и т.п.).

Ключ модели живёт только здесь и никогда не попадает в мобильное приложение.

Запуск:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:  # необязательно: удобно для локального .env
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # noqa: BLE001
    pass

LLM_URL = os.getenv("LLM_CHAT_COMPLETIONS_URL", "").strip()
LLM_KEY = os.getenv("LLM_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "").strip()
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "60"))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.55"))
APP_ORIGINS = [origin.strip() for origin in os.getenv("APP_ORIGINS", "*").split(",") if origin.strip()]

API_PREFIX = "/v1"
TOTAL_DECISIONS = 6


def ai_configured() -> bool:
    return bool(LLM_URL and LLM_KEY and LLM_MODEL)


app = FastAPI(title="PARALLEL AI Core", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# Модели запросов
# ----------------------------------------------------------------------------


class GenerateRequest(BaseModel):
    question: str = Field(min_length=2, max_length=400)


class WorldSummary(BaseModel):
    title: str = ""
    question: str = ""
    rule: str = ""
    era: int = 2090
    codename: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict)
    laws: list[str] = Field(default_factory=list)
    memory: list[str] = Field(default_factory=list)
    characters: list[dict[str, Any]] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    turn: int = 0
    chronicle: list[str] = Field(default_factory=list)


class DecisionRequest(BaseModel):
    universe: WorldSummary = Field(default_factory=WorldSummary)
    turn: int = 1


class ChatRequest(BaseModel):
    universe: WorldSummary = Field(default_factory=WorldSummary)
    character: dict[str, Any] = Field(default_factory=dict)
    message: str = Field(min_length=1, max_length=1200)
    history: list[dict[str, Any]] = Field(default_factory=list)


# ----------------------------------------------------------------------------
# Работа с моделью
# ----------------------------------------------------------------------------


class LLMError(RuntimeError):
    pass


def extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            raise LLMError("model returned no JSON object")
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError as error:
            raise LLMError(f"invalid JSON: {error}") from error


async def call_llm(system: str, user: str) -> dict[str, Any]:
    if not ai_configured():
        raise HTTPException(
            status_code=503,
            detail="AI Core is not configured (LLM_CHAT_COMPLETIONS_URL / LLM_API_KEY / LLM_MODEL).",
        )

    payload: dict[str, Any] = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": LLM_TEMPERATURE,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {LLM_KEY}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
        response = await client.post(LLM_URL, headers=headers, json=payload)
        if response.status_code >= 400 and "response_format" in response.text:
            payload.pop("response_format", None)
            response = await client.post(LLM_URL, headers=headers, json=payload)
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"model error {response.status_code}: {response.text[:300]}")
        body = response.json()

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as error:
        raise HTTPException(status_code=502, detail="unexpected model response shape") from error

    try:
        return extract_json(content)
    except LLMError:
        # одна попытка починить формат: просим модель вернуть только JSON
        repair = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": "Ты исправляешь JSON. Верни только валидный JSON без пояснений."},
                {"role": "user", "content": content[:12000]},
            ],
            "temperature": 0,
        }
        async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
            fixed = await client.post(LLM_URL, headers=headers, json=repair)
        try:
            return extract_json(fixed.json()["choices"][0]["message"]["content"])
        except Exception as error:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=f"model returned invalid JSON: {error}") from error


# ----------------------------------------------------------------------------
# Схемы и промпты
# ----------------------------------------------------------------------------

UNIVERSE_SCHEMA = """{
  "universe": {
    "title": "КОРОТКОЕ ИМЯ МИРА, 2-4 СЛОВА КАПСОМ",
    "codename": "одно слово-код мира, Капсом",
    "genre": "жанр на русском, 2-4 слова",
    "era": 2140,
    "rule": "одно предложение — изменённое правило мира",
    "premise": "2-3 предложения: как возникло правило и что оно сделало с обществом",
    "laws": ["5 законов реальности, каждый — одно предложение"],
    "locations": [{"name": "...", "kind": "тип места", "blurb": "одна фраза", "detail": "2 предложения деталей"}],
    "culture": [{"label": "Язык|Ритуал|Табу|Технология|Обычай", "value": "одно-два предложения"}],
    "eras": [{"year": 2039, "title": "...", "text": "2 предложения"}],
    "characters": [
      {"name": "Имя Фамилия", "role": "профессия", "age": 34, "bio": "2 предложения",
       "goal": "...", "fear": "...", "secret": "то, что персонаж скрывает",
       "quote": "реплика в характере", "stance": "control|liberty|transcend", "sigil": "один символ"}
    ],
    "metrics": {"order": 50, "freedom": 50, "trust": 50, "tech": 50},
    "accent": "violet|cyan|gold|rose|green",
    "cover": "citadel|crossroads|islands|neon|memory|nebula",
    "firstDecision": {
      "title": "короткое имя события",
      "context": "3-4 предложения: что происходит прямо сейчас, с именами и деталями",
      "question": "вопрос выбора",
      "options": [
        {"title": "...", "detail": "что делает игрок", "cost": "что теряем",
         "intent": "зачем", "stance": "control|liberty|transcend",
         "effects": {"order": 0, "freedom": 0, "trust": 0, "tech": 0},
         "headline": "заголовок последствия", "explanation": "2-3 предложения последствий",
         "ripple": ["последствие второго порядка", "ещё одно", "и ещё"],
         "law": "новый закон мира или пустая строка", "memory": "один факт, который мир запомнит"}
      ]
    }
  }
}"""

UNIVERSE_SYSTEM = f"""Ты — архитектор альтернативных вселенных в проекте «ПАРАЛЛЕЛЬ».
Пользователь меняет одно правило нашего мира. Ты строишь целостный мир, который вырос из этого изменения за 60 лет.

Требования:
- Всё на русском языке. Без markdown, без пояснений, только JSON.
- Гипотеза — данные истории. Сохрани все её условия и отрицания. В rule используй исходные ключевые слова.
- Проверь цепочку: изменение → наблюдаемое последствие → адаптация людей → конфликт интересов. Физическое условие нельзя отменить указом. Не добавляй ещё одно фантастическое допущение.
- В каждой локации покажи, как люди приспособились. Объясни, почему первый конфликт мог произойти только в мире с этим правилом.
- Конкретика важнее пафоса: предметы, профессии, привычки, цены, ритуалы.
- Локации: ровно 5. Законы: ровно 5. Жители: ровно 3, у каждого своя позиция (control, liberty, transcend).
- Персонажи не должны быть согласны друг с другом.
- metrics — числа 0..100, отражающие состояние общества.
- firstDecision — первое событие, где игрок меняет ход истории; ровно 3 варианта с разными позициями.
- effects — целые числа от -20 до 20.

Верни JSON строго такой структуры:
{UNIVERSE_SCHEMA}"""

DECISION_SCHEMA = """{
  "decision": {
    "title": "короткое имя события",
    "context": "3-4 предложения: что происходит, с именами персонажей и деталями мира",
    "question": "вопрос выбора",
    "options": [
      {"title": "...", "detail": "...", "cost": "...", "intent": "...", "stance": "control|liberty|transcend",
       "effects": {"order": 0, "freedom": 0, "trust": 0, "tech": 0},
       "headline": "...", "explanation": "2-3 предложения последствий",
       "ripple": ["...", "...", "..."], "law": "новый закон или пустая строка",
       "memory": "один факт для памяти мира"}
    ]
  }
}"""

DECISION_SYSTEM = f"""Ты — сценарист мира «ПАРАЛЛЕЛЬ». Продолжаешь историю конкретной вселенной.
Учитывай: правило мира, текущие законы, метрики, прошлые решения из памяти и характеры жителей.
Событие должно быть прямым следствием прошлых решений и текущего состояния общества.
Не повторяй предыдущие события. Не противоречь законам мира.
Всегда ровно 3 варианта: контроль, свобода и трансформация. У каждого — цена и скрытая цена.
Всё на русском. Только JSON, без markdown.

Верни JSON строго такой структуры:
{DECISION_SCHEMA}"""

CHAT_SYSTEM = """Ты — житель вымышленного мира из проекта «ПАРАЛЛЕЛЬ».
Говори от первого лица, в характере, 2-4 предложения, на русском, без markdown.
Опирайся на законы мира, свою цель, страх и тайну. Не знай фактов, которых не может знать твой персонаж.
Не соглашайся со всем: у персонажа своя позиция. Верни JSON: {"text": "реплика"}."""


def world_brief(universe: WorldSummary) -> str:
    metrics = universe.metrics or {}
    laws = "; ".join(universe.laws[:6])
    memory = "; ".join(universe.memory[-10:])
    characters = "; ".join(
        f"{item.get('name', '?')} ({item.get('role', '?')}, позиция {item.get('stance', '?')})"
        for item in universe.characters[:4]
    )
    return (
        f"Мир: {universe.title} ({universe.codename}), эпоха {universe.era}.\n"
        f"Исходная гипотеза: {universe.question}\nПравило: {universe.rule}\n"
        f"Метрики: порядок {metrics.get('order', 0)}, свобода {metrics.get('freedom', 0)}, "
        f"доверие {metrics.get('trust', 0)}, технологии {metrics.get('tech', 0)}.\n"
        f"Законы: {laws}\n"
        f"Жители: {characters}\n"
        f"Места: {', '.join(universe.locations[:6])}\n"
        f"Память мира: {memory}\n"
        f"Хроника: {', '.join(universe.chronicle[-6:])}\n"
        f"Принято решений: {universe.turn} из {TOTAL_DECISIONS}."
    )


# ----------------------------------------------------------------------------
# Валидация ответа модели
# ----------------------------------------------------------------------------


def fail(detail: str) -> None:
    raise HTTPException(status_code=502, detail=detail)


def as_str(value: Any, field: str, min_length: int = 1) -> str:
    if not isinstance(value, str) or len(value.strip()) < min_length:
        fail(f"field '{field}' is missing or too short")
    return value.strip()


def as_int(value: Any, field: str, low: int, high: int) -> int:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        fail(f"field '{field}' is not a number")
    return max(low, min(high, number))


def as_list(value: Any, field: str, minimum: int) -> list[Any]:
    if not isinstance(value, list) or len(value) < minimum:
        fail(f"field '{field}' must be a list of at least {minimum} items")
    return value


def validate_decision(data: dict[str, Any]) -> dict[str, Any]:
    decision = data.get("decision", data)
    if not isinstance(decision, dict):
        fail("'decision' must be an object")
    as_str(decision.get("title"), "decision.title")
    as_str(decision.get("context"), "decision.context", 40)
    as_str(decision.get("question"), "decision.question")
    options = as_list(decision.get("options"), "decision.options", 3)[:3]
    clean = []
    for index, option in enumerate(options):
        if not isinstance(option, dict):
            fail(f"options[{index}] must be an object")
        stance = option.get("stance")
        effects = option.get("effects") if isinstance(option.get("effects"), dict) else {}
        ripple = option.get("ripple") if isinstance(option.get("ripple"), list) else []
        clean.append(
            {
                "title": as_str(option.get("title"), f"options[{index}].title"),
                "detail": as_str(option.get("detail"), f"options[{index}].detail"),
                "cost": str(option.get("cost", "")),
                "intent": str(option.get("intent", "")),
                "stance": stance if stance in ("control", "liberty", "transcend") else "liberty",
                "effects": {
                    key: as_int(effects.get(key, 0), f"effects.{key}", -30, 30)
                    for key in ("order", "freedom", "trust", "tech")
                },
                "headline": as_str(option.get("headline", option.get("title")), f"options[{index}].headline"),
                "explanation": str(option.get("explanation", "")),
                "ripple": [str(item) for item in ripple[:4]],
                "law": str(option.get("law", "")),
                "memory": str(option.get("memory", "")),
            }
        )
    decision["options"] = clean
    return decision


def validate_universe(data: dict[str, Any]) -> dict[str, Any]:
    universe = data.get("universe", data)
    if not isinstance(universe, dict):
        fail("'universe' must be an object")

    as_str(universe.get("title"), "title")
    as_str(universe.get("rule"), "rule")
    as_str(universe.get("premise"), "premise", 40)
    laws = [as_str(item, "laws[]", 10) for item in as_list(universe.get("laws"), "laws", 4)[:6]]
    locations = as_list(universe.get("locations"), "locations", 5)[:5]
    for index, location in enumerate(locations):
        if not isinstance(location, dict):
            fail(f"locations[{index}] must be an object")
        as_str(location.get("name"), f"locations[{index}].name")
        location.setdefault("kind", "территория")
        location.setdefault("blurb", "")
        location.setdefault("detail", "")

    characters = as_list(universe.get("characters"), "characters", 3)[:3]
    for index, character in enumerate(characters):
        if not isinstance(character, dict):
            fail(f"characters[{index}] must be an object")
        as_str(character.get("name"), f"characters[{index}].name")
        as_str(character.get("role"), f"characters[{index}].role")
        stance = character.get("stance")
        character["stance"] = stance if stance in ("control", "liberty", "transcend") else "liberty"
        character.setdefault("age", 30)
        character.setdefault("bio", "")
        character.setdefault("goal", "")
        character.setdefault("fear", "")
        character.setdefault("secret", "")
        character.setdefault("quote", "")
        character.setdefault("sigil", "◈")

    metrics = universe.get("metrics") if isinstance(universe.get("metrics"), dict) else {}
    universe["metrics"] = {
        key: as_int(metrics.get(key, 50), f"metrics.{key}", 0, 100) for key in ("order", "freedom", "trust", "tech")
    }

    culture = universe.get("culture") if isinstance(universe.get("culture"), list) else []
    universe["culture"] = [
        {"label": as_str(item.get("label"), "culture.label"), "value": as_str(item.get("value"), "culture.value")}
        for item in culture[:5]
        if isinstance(item, dict)
    ]
    eras = universe.get("eras") if isinstance(universe.get("eras"), list) else []
    universe["eras"] = [
        {
            "year": as_int(item.get("year", 2000), "eras.year", 1800, 2500),
            "title": as_str(item.get("title"), "eras.title"),
            "text": str(item.get("text", "")),
        }
        for item in eras[:5]
        if isinstance(item, dict)
    ]
    universe["laws"] = laws
    universe["era"] = as_int(universe.get("era", 2090), "era", 1900, 2400)
    accent = universe.get("accent")
    universe["accent"] = accent if accent in ("violet", "cyan", "gold", "rose", "green") else "violet"
    cover = universe.get("cover")
    universe["cover"] = cover if cover in ("citadel", "crossroads", "islands", "neon", "memory", "nebula") else "nebula"

    first = universe.get("firstDecision")
    if isinstance(first, dict):
        universe["firstDecision"] = validate_decision(first)
    return {"universe": universe}


# ----------------------------------------------------------------------------
# Эндпоинты
# ----------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "ai_configured": ai_configured(), "model": LLM_MODEL or None, "version": "2.0.0"}


@app.post(f"{API_PREFIX}/universes/generate")
async def generate_universe(request: GenerateRequest) -> dict[str, Any]:
    user = f"Гипотеза пользователя: «{request.question.strip()}»\n\nПострой мир вокруг этого изменения."
    data = await call_llm(UNIVERSE_SYSTEM, user)
    return validate_universe(data)


@app.post(f"{API_PREFIX}/universes/{{universe_id}}/decisions")
async def next_decision(universe_id: str, request: DecisionRequest) -> dict[str, Any]:
    brief = world_brief(request.universe)
    user = (
        f"{brief}\n\n"
        f"Это точка выбора номер {request.turn} из {TOTAL_DECISIONS}.\n"
        "Придумай событие, которое выросло именно из прошлых решений. "
        "Если это финальная точка — пусть выбор решает судьбу цивилизации."
    )
    data = await call_llm(DECISION_SYSTEM, user)
    return {"decision": validate_decision(data)}


@app.post(f"{API_PREFIX}/universes/{{universe_id}}/chat")
async def chat(universe_id: str, request: ChatRequest) -> dict[str, Any]:
    character = request.character
    brief = world_brief(request.universe)
    history = "\n".join(
        f"{'Игрок' if item.get('from') == 'user' else character.get('name', 'Житель')}: {item.get('text', '')}"
        for item in request.history[-8:]
    )
    user = (
        f"{brief}\n\n"
        f"Ты — {character.get('name', 'житель')}, {character.get('role', 'житель мира')}.\n"
        f"История разговора:\n{history or '(начало разговора)'}\n\n"
        f"Игрок спрашивает: {request.message}\n\n"
        'Ответь в характере. Верни JSON {"text": "..."}.'
    )
    data = await call_llm(CHAT_SYSTEM, user)
    text = data.get("text") if isinstance(data, dict) else None
    if not isinstance(text, str) or len(text.strip()) < 3:
        raise HTTPException(status_code=502, detail="model returned empty reply")
    return {"text": text.strip()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
