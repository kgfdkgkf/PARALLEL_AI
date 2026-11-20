import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DEFAULT_SETTINGS, PROVIDERS, type AiSettings, type ProviderId } from './providers';

const KEY = 'parallel.ai.settings.v1';

export async function loadAiSettings(): Promise<AiSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const provider = typeof parsed.provider === 'string' && Object.hasOwn(PROVIDERS, parsed.provider)
      ? parsed.provider as ProviderId
      : undefined;
    const key = typeof parsed.key === 'string' ? parsed.key : '';
    const model = typeof parsed.model === 'string' ? parsed.model : '';
    // Older web builds could save their implicit DEMO setting when editing another field.
    const legacyWebDemo = Platform.OS === 'web' && provider === 'demo' && DEFAULT_SETTINGS.provider === 'groq' && !key && !model;
    const providerSelected = parsed.providerSelected ?? Boolean(provider && !legacyWebDemo);
    return {
      provider: providerSelected ? provider ?? DEFAULT_SETTINGS.provider : DEFAULT_SETTINGS.provider,
      providerSelected,
      key,
      model,
      imageServer: typeof parsed.imageServer === 'string' ? parsed.imageServer : '',
      backendServer: typeof parsed.backendServer === 'string' ? parsed.backendServer : '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // сохранение настроек не критично для работы приложения
  }
}

export async function clearAiSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
