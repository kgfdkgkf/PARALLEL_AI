# tools

Служебные скрипты проекта. В приложение не входят.

| Файл | Назначение |
|---|---|
| `prepare_assets.py` | статические инстансы шрифтов (Unbounded, Manrope) с кириллицей, обложки в JPEG, зерно, иконка |
| `make_nebula.py` | процедурная обложка-туманность для универсальной вселенной |
| `ensure-env.js` | восстанавливает `expo-env.d.ts`, если Expo его удалил (вызывается перед typecheck) |
| `mock_api.py` | мок собственного AI Core (эндпоинты `backend/main.py`) на `127.0.0.1:8010` |
| `mock_openai.py` | мок OpenAI-совместимого провайдера на `127.0.0.1:8020` |
| `provider-flow.js` | проверка AI-режима через настройки в приложении против `mock_openai.py` |
| `real-provider.js` | проверка с настоящим ключом Groq: ключ берётся из `GROQ_KEY` и не печатается |
| `genesis-check.js` | проверка, что два разных вопроса дают разные миры в DEMO-режиме |
| `flow.js` | визуальный прогон всех экранов в headless Chrome, скриншоты в `.shots/` |

## Проверка AI-режима без ключа

```powershell
python tools/mock_openai.py
$env:EXPO_PUBLIC_AI_BASE_URL="http://127.0.0.1:8020/v1/chat/completions"
npx expo export --platform web --output-dir dist-ai
python -m http.server 8100 --directory dist-ai
node tools/provider-flow.js
```

## Проверка с настоящим ключом Groq

```powershell
npx expo export --platform web --output-dir dist
python -m http.server 8099 --directory dist
$env:GROQ_KEY="gsk_..."
node tools/real-provider.js
Remove-Item Env:GROQ_KEY
```

Скрипт сам открывает Профиль, выбирает Groq, вставляет ключ, проверяет связь,
создаёт мир и открывает первое событие.

## Проверка DEMO-режима

```powershell
npx expo export --platform web --output-dir dist
python -m http.server 8099 --directory dist
node tools/genesis-check.js
node tools/flow.js
```

## Ассеты

```powershell
python tools/prepare_assets.py
python tools/make_nebula.py
```

Скриптам нужны `fonttools`, `Pillow` и `numpy`.
