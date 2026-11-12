/**
 * Провайдеры AI CORE.
 *
 * Все варианты, кроме DEMO и «своего сервера», — обычные OpenAI-совместимые
 * Chat Completions endpoints. Ключ вводится в приложении и хранится только
 * на устройстве (AsyncStorage) — это демонстрационный режим, не продакшн.
 */

export type ProviderId = 'demo' | 'gemini' | 'groq' | 'openrouter' | 'deepseek' | 'local' | 'backend';

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  short: string;
  /** Полный URL chat completions или пустая строка для backend (берётся из env). */
  baseUrl: string;
  model: string;
  needsKey: boolean;
  supportsJsonMode: boolean;
  /** Что написать пользователю, где взять бесплатный ключ. */
  hint: string;
  docsUrl: string;
};

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  demo: {
    id: 'demo',
    label: 'Локальный движок',
    short: 'DEMO',
    baseUrl: '',
    model: '',
    needsKey: false,
    supportsJsonMode: false,
    hint: 'Без сети и ключей. Миры собираются детерминированно — одинаковый вопрос даёт одинаковый мир.',
    docsUrl: '',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    short: 'GEMINI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    needsKey: true,
    supportsJsonMode: false,
    hint: 'Бесплатный ключ: aistudio.google.com/apikey → Create API key. Щедрый бесплатный лимит.',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    short: 'GROQ',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'openai/gpt-oss-120b',
    needsKey: true,
    supportsJsonMode: true,
    hint: 'Бесплатный ключ: console.groq.com/keys. Модель openai/gpt-oss-120b отвечает за 5–8 секунд и стабильно отдаёт JSON.',
    docsUrl: 'https://console.groq.com/keys',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    short: 'OPENROUTER',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-chat-v3-0324:free',
    needsKey: true,
    supportsJsonMode: true,
    hint: 'Бесплатный ключ: openrouter.ai/keys. Модели с суффиксом :free стоят 0.',
    docsUrl: 'https://openrouter.ai/keys',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    short: 'DEEPSEEK',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    needsKey: true,
    supportsJsonMode: true,
    hint: 'Прямой API DeepSeek: ключ на platform.deepseek.com. Бесплатного тарифа нет, но цены очень низкие. Полностью бесплатный вариант — OpenRouter, модель deepseek/deepseek-chat-v3-0324:free.',
    docsUrl: 'https://platform.deepseek.com/api_keys',
  },
  local: {
    id: 'local',
    label: 'Ollama (локально)',
    short: 'LOCAL',
    baseUrl: 'http://127.0.0.1:11434/v1/chat/completions',
    model: 'llama3.1:8b',
    needsKey: false,
    supportsJsonMode: false,
    hint: 'Совсем без ключа: установите Ollama, выполните «ollama pull llama3.1:8b» и «ollama serve». С телефона нужен адрес компьютера: задайте EXPO_PUBLIC_AI_BASE_URL=http://IP-компьютера:11434/v1/chat/completions перед запуском.',
    docsUrl: 'https://ollama.com/download',
  },
  backend: {
    id: 'backend',
    label: 'Свой сервер',
    short: 'AI CORE',
    baseUrl: '',
    model: '',
    needsKey: false,
    supportsJsonMode: true,
    hint: 'FastAPI из папки backend/. Адрес задаётся в EXPO_PUBLIC_API_URL, ключ модели живёт на сервере.',
    docsUrl: '',
  },
};

export type AiSettings = {
  provider: ProviderId;
  key: string;
  model: string;
};

const ENV_PROVIDER = (process.env.EXPO_PUBLIC_AI_PROVIDER ?? '').trim() as ProviderId;
const ENV_KEY = (process.env.EXPO_PUBLIC_AI_KEY ?? '').trim();
const ENV_MODEL = (process.env.EXPO_PUBLIC_AI_MODEL ?? '').trim();

/**
 * Значения по умолчанию можно «вшить» в сборку через EXPO_PUBLIC_AI_*.
 * Это удобно для демо-APK, но ключ в таком случае лежит внутри пакета:
 * для публикации такой сборки ключ нужно перевыпустить и убрать из env.
 */
export const embeddedKey = ENV_KEY;
export const DEFAULT_SETTINGS: AiSettings = {
  provider: ENV_PROVIDER && PROVIDERS[ENV_PROVIDER] ? ENV_PROVIDER : 'demo',
  key: ENV_KEY,
  model: ENV_MODEL,
};

export function providerOf(settings: AiSettings): ProviderConfig {
  return PROVIDERS[settings.provider] ?? PROVIDERS.demo;
}

export function modelOf(settings: AiSettings): string {
  const provider = providerOf(settings);
  return (settings.model || provider.model).trim();
}

export function isAiReady(settings: AiSettings, backendUrl: string): boolean {
  const provider = providerOf(settings);
  if (provider.id === 'demo') return false;
  if (provider.id === 'backend') return backendUrl.length > 0;
  if (provider.id === 'local') return true;
  return settings.key.trim().length > 8;
}
