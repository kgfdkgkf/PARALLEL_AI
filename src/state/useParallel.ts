import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { advanceLife } from '../engine/life';
import { createUniverse } from '../engine/generate';
import { applyOption, buildDecision, rewindUniverse } from '../engine/events';
import { exploreLocation, type Scene } from '../engine/explore';
import { bless, curse, useDivinePower } from '../engine/divine';
import { greetingFor, replyToCharacter, suggestedQuestions } from '../engine/chat';
import {
  AiError,
  aiReady,
  chatAI,
  generateUniverseAI,
  nextDecisionAI,
  providerLabel,
  testProvider,
} from '../engine/ai';
import { loadAiSettings, saveAiSettings } from '../engine/aiSettings';
import { DEFAULT_SETTINGS, type AiSettings } from '../engine/providers';
import type { AiStatus, ChatMessage, DivinePower, EngineMode, Outcome, Universe } from '../engine/types';

export type Screen =
  | 'home'
  | 'create'
  | 'forge'
  | 'world'
  | 'character'
  | 'decision'
  | 'outcome'
  | 'branches'
  | 'ending'
  | 'archive'
  | 'profile';

export type Tab = 'home' | 'create' | 'archive' | 'profile';

type Persisted = {
  version: 2;
  archive: Universe[];
  activeId: string | null;
  chats: Record<string, ChatMessage[]>;
};

const STORAGE_KEY = 'parallel.archive.v2';
const TAB_SCREENS: Screen[] = ['home', 'create', 'archive', 'profile'];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function mergeArchive(archive: Universe[], universe: Universe): Universe[] {
  const next = [universe, ...archive.filter((item) => item.id !== universe.id)];
  return next.slice(0, 24);
}

export function useParallel() {
  const [hydrated, setHydrated] = useState(false);
  const [archive, setArchive] = useState<Universe[]>([]);
  const [active, setActive] = useState<Universe | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<Screen[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [forgeStage, setForgeStage] = useState(0);
  const [forgeQuestion, setForgeQuestion] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [typing, setTyping] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_SETTINGS);
  const [aiStatus, setAiStatus] = useState<AiStatus>('unknown');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState('');
  const [scene, setScene] = useState<Scene | null>(null);

  const activeRef = useRef<Universe | null>(null);
  const archiveRef = useRef<Universe[]>([]);
  const chatsRef = useRef<Record<string, ChatMessage[]>>({});
  const forgeToken = useRef(0);
  const decisionToken = useRef('');

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    archiveRef.current = archive;
  }, [archive]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Persisted;
        if (Array.isArray(parsed.archive)) {
          setArchive(parsed.archive);
          archiveRef.current = parsed.archive;
        }
        if (parsed.chats) setChats(parsed.chats);
        if (parsed.activeId) {
          const found = parsed.archive?.find((item) => item.id === parsed.activeId);
          if (found) {
            setActive(found);
            activeRef.current = found;
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAiSettings().then((loaded) => {
      if (!cancelled) setAiSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateAiSettings = useCallback((patch: Partial<AiSettings>) => {
    setAiSettings((current) => {
      const next = { ...current, ...patch };
      saveAiSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const checkAi = useCallback(async () => {
    setAiChecking(true);
    setAiError(null);
    try {
      const result = await testProvider(aiSettings);
      setAiStatus(result.ok ? 'online' : 'offline');
      if (!result.ok) setAiError(result.message);
      return result;
    } finally {
      setAiChecking(false);
    }
  }, [aiSettings]);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = {
      version: 2,
      archive,
      activeId: active?.id ?? null,
      chats,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [archive, active, chats, hydrated]);

  const navigate = useCallback((next: Screen) => {
    setScreen((current) => {
      setHistory((stack) => [...stack, current].slice(-12));
      return next;
    });
  }, []);

  const go = useCallback(
    (next: Screen, options?: { replace?: boolean }) => {
      if (TAB_SCREENS.includes(next)) {
        setTab(next as Tab);
        setHistory([]);
        setScreen(next);
        return;
      }
      if (options?.replace) {
        setScreen(next);
        return;
      }
      navigate(next);
    },
    [navigate],
  );

  const landInWorld = useCallback(() => {
    setHistory([]);
    setTab('home');
    setScreen('world');
  }, []);

  const back = useCallback(() => {
    setHistory((stack) => {
      if (stack.length === 0) {
        setScreen('home');
        setTab('home');
        return stack;
      }
      const next = stack[stack.length - 1];
      setScreen(next);
      if (TAB_SCREENS.includes(next)) setTab(next as Tab);
      return stack.slice(0, -1);
    });
  }, []);

  const commit = useCallback((universe: Universe) => {
    activeRef.current = universe;
    setActive(universe);
    setArchive((current) => mergeArchive(current, universe));
  }, []);

  const requestNextDecision = useCallback(
    (universe: Universe) => {
      const token = `${universe.id}:${universe.state.turn}`;
      decisionToken.current = token;
      setDecisionLoading(true);
      nextDecisionAI(universe, aiSettings)
        .then((decision) => {
          if (decisionToken.current !== token) return;
          const current = activeRef.current;
          if (!current || current.id !== universe.id) return;
          commit({ ...current, state: { ...current.state, pending: decision } });
          setAiStatus('online');
          setAiError(null);
        })
        .catch((error) => {
          setAiError(error instanceof AiError ? error.message : 'Не удалось получить событие');
          setAiStatus('offline');
          const current = activeRef.current;
          if (current && current.id === universe.id) {
            commit({ ...current, state: { ...current.state, pending: buildDecision(universe) } });
          }
        })
        .finally(() => {
          if (decisionToken.current === token) setDecisionLoading(false);
        });
    },
    [aiSettings, commit],
  );

  const createWorld = useCallback(
    async (question: string) => {
      const clean = question.trim();
      if (!clean) return;
      forgeToken.current += 1;
      const token = forgeToken.current;
      setForgeQuestion(clean);
      setForgeStage(0);
      go('forge');
      const ready = aiReady(aiSettings);
      const aiRequest = ready
        ? generateUniverseAI(clean, aiSettings).catch((error) => {
            setAiError(error instanceof AiError ? error.message : 'AI-ядро недоступно');
            setAiStatus('offline');
            return null;
          })
        : Promise.resolve(null);
      const stages = [700, 1000, 1100, 900];
      for (let index = 0; index < stages.length; index += 1) {
        await delay(stages[index]);
        if (token !== forgeToken.current) return;
        setForgeStage(index + 1);
      }
      const generated = await aiRequest;
      if (token !== forgeToken.current) return;
      const universe = advanceLife(generated ?? createUniverse(clean));
      if (generated) setAiStatus('online');
      const first = universe.state.characters[0];
      commit(universe);
      setChats((current) => ({
        ...current,
        [`${universe.id}:${first.id}`]: [{ id: 'greet', from: 'character', text: greetingFor(universe, first) }],
      }));
      setSelectedLocationId(universe.state.locations[0]?.id ?? null);
      setSelectedCharacterId(first.id);
      landInWorld();

      if (generated && !generated.state.pending) {
        requestNextDecision(generated);
      }
    },
    [aiSettings, commit, go, landInWorld, requestNextDecision],
  );

  const openWorld = useCallback(
    (universe: Universe) => {
      const refreshed = advanceLife(universe);
      commit(refreshed);
      setScene(null);
      setSelectedLocationId(universe.state.locations[0]?.id ?? null);
      setSelectedCharacterId(universe.state.characters[0]?.id ?? null);
      setOutcome(null);
      go('world');
    },
    [commit, go],
  );

  const choose = useCallback(
    (optionId: string, allyId?: string) => {
      const universe = activeRef.current;
      if (!universe?.state.pending?.options.some((option) => option.id === optionId)) return;
      const result = applyOption(universe, optionId, allyId);
      commit(result.universe);
      setOutcome({
        option: result.option,
        before: result.before,
        after: result.universe.state.metrics,
        node: result.node,
        ending: result.ending,
        law: result.option.law,
        memory: result.option.memory,
        allyName: result.allyName,
      });
      go('outcome', { replace: true });

      if (aiReady(aiSettings) && result.universe.mode === 'ai' && !result.ending) {
        requestNextDecision(result.universe);
      }
    },
    [aiSettings, commit, go, requestNextDecision],
  );

  const explore = useCallback(
    (locationId: string) => {
      const universe = activeRef.current;
      if (!universe) return;
      const result = exploreLocation(universe, locationId);
      if (!result) return;
      commit(result.universe);
      setScene(result.scene);
    },
    [commit],
  );

  const refreshLife = useCallback((observe = false) => {
    const universe = activeRef.current;
    if (!universe) return;
    const next = advanceLife(universe, Date.now(), observe);
    if (next !== universe) commit(next);
  }, [commit]);

  useEffect(() => {
    if (!hydrated) return;
    refreshLife();
    const timer = setInterval(() => {
      if (AppState.currentState !== 'background') refreshLife();
    }, 15000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshLife();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [hydrated, refreshLife]);

  const observeDay = useCallback(() => refreshLife(true), [refreshLife]);
  const clearScene = useCallback(() => setScene(null), []);

  const blessDivine = useCallback(() => {
    const universe = activeRef.current;
    if (!universe) return;
    const next = bless(universe);
    if (next) commit(next);
  }, [commit]);

  const curseDivine = useCallback(() => {
    const universe = activeRef.current;
    if (!universe) return;
    const next = curse(universe);
    if (next) commit(next);
  }, [commit]);

  const performPower = useCallback((power: DivinePower, targetId: string) => {
    const universe = activeRef.current;
    if (!universe) return;
    const next = useDivinePower(universe, power, targetId);
    if (next) commit(next);
  }, [commit]);

  const rewind = useCallback(
    (nodeId: string) => {
      const universe = activeRef.current;
      if (!universe) return;
      const restored = rewindUniverse(universe, nodeId);
      commit(restored);
      go('decision');
    },
    [commit, go],
  );

  const openCharacter = useCallback(
    (characterId: string) => {
      const universe = activeRef.current;
      if (!universe) return;
      setSelectedCharacterId(characterId);
      const key = `${universe.id}:${characterId}`;
      if (!chatsRef.current[key]) {
        const character = universe.state.characters.find((item) => item.id === characterId);
        if (character) {
          setChats((current) => ({
            ...current,
            [key]: [{ id: 'greet', from: 'character', text: greetingFor(universe, character) }],
          }));
        }
      }
      go('character');
    },
    [go],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      const universe = activeRef.current;
      const characterId = selectedCharacterId;
      if (!text || !universe || !characterId) return;
      const key = `${universe.id}:${characterId}`;
      const character = universe.state.characters.find((item) => item.id === characterId);
      if (!character) return;
      const existing = chatsRef.current[key] ?? [];
      const userMessage: ChatMessage = { id: `u-${Date.now()}`, from: 'user', text };
      const withUser = [...existing, userMessage];
      chatsRef.current = { ...chatsRef.current, [key]: withUser };
      setChats((current) => ({ ...current, [key]: withUser }));
      setTyping(true);
      await delay(760 + Math.min(1200, text.length * 22));
      let aiText: string | null = null;
      if (aiReady(aiSettings) && universe.mode === 'ai') {
        try {
          aiText = await chatAI(
            universe,
            character.name,
            character.role,
            text,
            existing.slice(-8).map((item) => ({ from: item.from, text: item.text })),
            aiSettings,
          );
        } catch (error) {
          setAiError(error instanceof AiError ? error.message : 'Модель не ответила');
        }
      }
      if (aiText) setAiError(null);
      const reply = aiText
        ? { text: aiText, bondDelta: 3, revealedSecret: false }
        : replyToCharacter(universe, character, text, existing.filter((item) => item.from === 'user').length);
      const updatedUniverse: Universe = {
        ...universe,
        updatedAt: new Date().toISOString(),
        state: {
          ...universe.state,
          characters: universe.state.characters.map((item) =>
            item.id === characterId
              ? {
                  ...item,
                  bond: Math.min(100, item.bond + reply.bondDelta),
                  status: item.bond + reply.bondDelta >= 78 ? 'На вашей стороне' : item.bond + reply.bondDelta >= 58 ? 'Доверяет' : item.bond + reply.bondDelta >= 38 ? 'Открыт к разговору' : 'Насторожен',
                }
              : item,
          ),
        },
      };
      const withReply = [...withUser, { id: `c-${Date.now()}`, from: 'character' as const, text: reply.text }];
      chatsRef.current = { ...chatsRef.current, [key]: withReply };
      setChats((current) => ({ ...current, [key]: withReply }));
      commit(updatedUniverse);
      setTyping(false);
    },
    [aiSettings, commit, selectedCharacterId],
  );

  const deleteWorld = useCallback((id: string) => {
    setArchive((current) => current.filter((item) => item.id !== id));
    if (activeRef.current?.id === id) {
      activeRef.current = null;
      setActive(null);
    }
  }, []);

  const resetAll = useCallback(() => {
    setArchive([]);
    setActive(null);
    setChats({});
    chatsRef.current = {};
    archiveRef.current = [];
    activeRef.current = null;
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const activeCharacter = useMemo(() => {
    if (!active || !selectedCharacterId) return null;
    return active.state.characters.find((item) => item.id === selectedCharacterId) ?? active.state.characters[0];
  }, [active, selectedCharacterId]);

  const messages = useMemo(() => {
    if (!active || !selectedCharacterId) return [];
    return chats[`${active.id}:${selectedCharacterId}`] ?? [];
  }, [active, chats, selectedCharacterId]);

  const prompts = useMemo(() => {
    if (!active || !activeCharacter) return [];
    return suggestedQuestions(active, activeCharacter);
  }, [active, activeCharacter]);

  const stats = useMemo(() => {
    const decisions = archive.reduce((total, item) => total + item.path.length, 0);
    const endings = archive.filter((item) => item.state.ending).length;
    return {
      worlds: archive.length,
      decisions,
      endings,
      chars: archive.reduce((total, item) => total + item.state.characters.filter((c) => c.bond >= 55).length, 0),
    };
  }, [archive]);

  const selectedLocation = useMemo(() => {
    if (!active) return null;
    return active.state.locations.find((item) => item.id === selectedLocationId) ?? active.state.locations[0] ?? null;
  }, [active, selectedLocationId]);

  useEffect(() => {
    return () => {
      forgeToken.current += 1;
    };
  }, []);

  return {
    hydrated,
    archive,
    active,
    activeCharacter,
    screen,
    tab,
    outcome,
    forgeStage,
    forgeQuestion,
    typing,
    decisionLoading,
    aiStatus,
    aiError,
    aiChecking,
    aiSettings,
    aiProvider: providerLabel(aiSettings),
    updateAiSettings,
    checkAi,
    engineMode: (aiReady(aiSettings) ? 'ai' : 'demo') as EngineMode,
    messages,
    prompts,
    stats,
    draftQuestion,
    setDraftQuestion,
    selectedLocation,
    selectedCharacterId,
    selectedLocationId,
    setSelectedLocationId,
    go,
    back,
    createWorld,
    openWorld,
    choose,
    rewind,
    scene,
    explore,
    observeDay,
    clearScene,
    blessDivine,
    curseDivine,
    performPower,
    openCharacter,
    sendMessage,
    deleteWorld,
    resetAll,
  };
}

export type ParallelStore = ReturnType<typeof useParallel>;
