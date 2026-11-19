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
    model: 'gemini-3.5-flash-lite',
    needsKey: true,
    supportsJsonMode: false,
    hint: 'Ключ Gemini можно создать в Google AI Studio. Доступность зависит от региона и тарифа.',
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
    hint: 'Ключ Groq можно создать в Groq Console. Модели GPT-OSS поддерживают структурированные ответы.',
    docsUrl: 'https://console.groq.com/keys',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    short: 'OPENROUTER',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openrouter/free',
    needsKey: true,
    supportsJsonMode: true,
    hint: 'Ключ OpenRouter можно создать в настройках аккаунта. Роутер openrouter/free выбирает доступную бесплатную модель.',
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
    hint: 'Прямое подключение к DeepSeek. Ключ создаётся на платформе DeepSeek.',
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
    hint: 'FastAPI из папки backend/. Введи адрес сервера. Ключ модели хранится на сервере.',
    docsUrl: '',
  },
};

export type AiSettings = {
  provider: ProviderId;
  key: string;
  model: string;
  imageServer: string;
  backendServer: string;
};

const ENV_PROVIDER = (process.env.EXPO_PUBLIC_AI_PROVIDER ?? '').trim() as ProviderId;
const ENV_MODEL = (process.env.EXPO_PUBLIC_AI_MODEL ?? '').trim();

export const DEFAULT_SETTINGS: AiSettings = {
  provider: Object.hasOwn(PROVIDERS, ENV_PROVIDER) ? ENV_PROVIDER : 'demo',
  key: '',
  model: ENV_MODEL,
  imageServer: '',
  backendServer: '',
};

/** Готовые модели на выбор: одна кнопка вместо ввода имени. */
export const MODEL_PRESETS: Partial<Record<ProviderId, { label: string; model: string }[]>> = {
  groq: [
    { label: 'gpt-oss-120b', model: 'openai/gpt-oss-120b' },
    { label: 'gpt-oss-20b', model: 'openai/gpt-oss-20b' },
  ],
  openrouter: [{ label: 'Free Router', model: 'openrouter/free' }],
};

export function providerOf(settings: AiSettings): ProviderConfig {
  return Object.hasOwn(PROVIDERS, settings.provider) ? PROVIDERS[settings.provider] : PROVIDERS.demo;
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
