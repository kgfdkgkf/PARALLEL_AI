import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { advanceLife } from '../engine/life';
import { isPlayableHypothesis } from '../engine/hypothesis';
import { createUniverse, characterStatus } from '../engine/generate';
import { applyOption, buildDecision, forkUniverse } from '../engine/events';
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
  const [route, setRoute] = useState<{ screen: Screen; history: Screen[]; tab: Tab }>({ screen: 'home', history: [], tab: 'home' });
  const { screen, tab } = route;
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [forgeStage, setForgeStage] = useState(0);
  const [forgeQuestion, setForgeQuestion] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [typingKeys, setTypingKeys] = useState<string[]>([]);
  const [decisionIds, setDecisionIds] = useState<string[]>([]);
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
  const decisionsInProgress = useRef(new Map<string, symbol>());
  const chatInProgress = useRef(new Map<string, symbol>());
  const archiveWrites = useRef(Promise.resolve());
  const settingsWrites = useRef(Promise.resolve());
  const shouldSaveArchive = useRef(false);
  const aiSettingsRef = useRef(DEFAULT_SETTINGS);
  const checkToken = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY).catch(() => null), loadAiSettings()]).then(([raw, settings]) => {
      if (cancelled) return;
      aiSettingsRef.current = settings;
      setAiSettings(settings);

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Persisted;
          const saved = Array.isArray(parsed.archive)
            ? parsed.archive.filter((item) => item && typeof item.id === 'string' && item.state && Array.isArray(item.path))
            : [];
          const savedIds = new Set(saved.map((item) => item.id));
          const loadedChats = Object.fromEntries(Object.entries(parsed.chats ?? {}).filter(
            ([key, value]) => savedIds.has(key.split(':')[0]) && Array.isArray(value),
          ));
          const current = saved.find((item) => item.id === parsed.activeId) ?? null;
          archiveRef.current = saved;
          activeRef.current = current;
          chatsRef.current = loadedChats;
          setArchive(saved);
          setActive(current);
          setChats(loadedChats);
        } catch {
          // The existing value remains untouched until the player makes a new save.
        }
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  const updateAiSettings = useCallback((patch: Partial<AiSettings>) => {
    const previous = aiSettingsRef.current;
    const next = { ...previous, ...patch };
    aiSettingsRef.current = next;
    setAiSettings(next);
    if (next.provider !== previous.provider || next.key !== previous.key || next.model !== previous.model || next.backendServer !== previous.backendServer) {
      checkToken.current += 1;
      setAiStatus('unknown');
      setAiError(null);
      setAiChecking(false);
    }
    settingsWrites.current = settingsWrites.current.then(() => saveAiSettings(next)).catch(() => undefined);
  }, []);

  const checkAi = useCallback(async () => {
    const token = ++checkToken.current;
    const settings = aiSettingsRef.current;
    setAiChecking(true);
    setAiError(null);
    try {
      const result = await testProvider(settings);
      if (checkToken.current === token) {
        setAiStatus(result.ok ? 'online' : 'offline');
        setAiError(result.ok ? null : result.message);
        return result;
      }
      return null;
    } finally {
      if (checkToken.current === token) setAiChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !shouldSaveArchive.current) return;
    const payload: Persisted = { version: 2, archive, activeId: active?.id ?? null, chats };
    const serialized = JSON.stringify(payload);
    archiveWrites.current = archiveWrites.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serialized)).catch(() => undefined);
  }, [archive, active, chats, hydrated]);

  const go = useCallback((next: Screen, options?: { replace?: boolean }) => {
    setRoute((current) => {
      if (TAB_SCREENS.includes(next)) return { screen: next, history: [], tab: next as Tab };
      if (current.screen === next) return current;
      const history = options?.replace ? current.history : [...current.history, current.screen].slice(-12);
      return { ...current, screen: next, history };
    });
  }, []);

  const back = useCallback(() => {
    if (screen === 'forge') forgeToken.current += 1;
    setRoute((current) => {
      const previous = current.history.at(-1);
      if (!previous) return { screen: 'home', history: [], tab: 'home' };
      return {
        screen: previous,
        history: current.history.slice(0, -1),
        tab: TAB_SCREENS.includes(previous) ? previous as Tab : current.tab,
      };
    });
  }, [screen]);

  const updateChats = useCallback((next: Record<string, ChatMessage[]>) => {
    shouldSaveArchive.current = true;
    chatsRef.current = next;
    setChats(next);
  }, []);

  const clearWorldChats = useCallback((id: string) => {
    const prefix = `${id}:`;
    for (const key of chatInProgress.current.keys()) {
      if (key.startsWith(prefix)) chatInProgress.current.delete(key);
    }
    setTypingKeys([...chatInProgress.current.keys()]);
    updateChats(Object.fromEntries(Object.entries(chatsRef.current).filter(([key]) => !key.startsWith(prefix))));
  }, [updateChats]);

  const stopDecision = useCallback((id: string) => {
    if (!decisionsInProgress.current.delete(id)) return;
    setDecisionIds([...decisionsInProgress.current.keys()]);
  }, []);

  const commit = useCallback((universe: Universe, activate = false) => {
    shouldSaveArchive.current = true;
    const isActive = activate || activeRef.current?.id === universe.id;
    const previous = archiveRef.current;
    const current = isActive
      ? mergeArchive(previous, universe)
      : previous.map((item) => item.id === universe.id ? universe : item);
    archiveRef.current = current;
    setArchive(current);
    for (const evicted of previous) {
      if (!current.some((item) => item.id === evicted.id)) {
        stopDecision(evicted.id);
        clearWorldChats(evicted.id);
      }
    }
    if (isActive) {
      activeRef.current = universe;
      setActive(universe);
    }
  }, [clearWorldChats, stopDecision]);

  const requestNextDecision = useCallback((universe: Universe, settings: AiSettings) => {
    const token = Symbol();
    decisionsInProgress.current.set(universe.id, token);
    setDecisionIds([...decisionsInProgress.current.keys()]);
    const stillWaiting = () => decisionsInProgress.current.get(universe.id) === token;
    const showStatus = () => activeRef.current?.id === universe.id && aiSettingsRef.current === settings;
    nextDecisionAI(universe, settings)
      .then((decision) => {
        if (!stillWaiting()) return;
        const current = archiveRef.current.find((item) => item.id === universe.id);
        if (!current || current.state.turn !== universe.state.turn) return;
        commit({ ...current, state: { ...current.state, pending: decision } });
        if (showStatus()) {
          setAiStatus('online');
          setAiError(null);
        }
      })
      .catch((error) => {
        if (stillWaiting() && showStatus()) {
          setAiStatus('offline');
          setAiError(error instanceof AiError ? error.message : 'Не удалось получить событие');
        }
      })
      .finally(() => { if (stillWaiting()) stopDecision(universe.id); });
  }, [commit, stopDecision]);

  const finishForge = useCallback((generated: Universe | null, question: string, settings: AiSettings) => {
    const base = generated ?? createUniverse(question);
    const needsDecision = generated && !generated.state.pending;
    let universe = advanceLife(base);
    if (needsDecision) universe = { ...universe, state: { ...universe.state, pending: buildDecision(universe) } };
    const first = universe.state.characters[0];
    commit(universe, true);
    if (first) {
      updateChats({
        ...chatsRef.current,
        [`${universe.id}:${first.id}`]: [{ id: 'greet', from: 'character', text: greetingFor(universe, first) }],
      });
    }
    setSelectedLocationId(universe.state.locations[0]?.id ?? null);
    setSelectedCharacterId(first?.id ?? null);
    setScene(null);
    setOutcome(null);
    setRoute({ screen: 'world', history: [], tab: 'home' });
    if (needsDecision) requestNextDecision(universe, settings);
  }, [commit, requestNextDecision, updateChats]);

  const createWorld = useCallback(async (question: string) => {
    const clean = question.trim();
    if (!isPlayableHypothesis(clean)) return;
    const token = ++forgeToken.current;
    const settings = aiSettingsRef.current;
    setForgeQuestion(clean);
    setForgeStage(0);
    go('forge');
    const request = aiReady(settings)
      ? generateUniverseAI(clean, settings).then(
          (world) => ({ world, error: null }),
          (error: unknown) => ({ world: null, error: error instanceof AiError ? error.message : 'AI-ядро недоступно' }),
        )
      : Promise.resolve({ world: null, error: null });
    for (const [index, time] of [260, 300, 350, 360].entries()) {
      await delay(time);
      if (token !== forgeToken.current) return;
      setForgeStage(index + 1);
    }
    const { world, error } = await request;
    if (token !== forgeToken.current) return;
    if (world || error) {
      setAiStatus(world ? 'online' : 'offline');
      setAiError(error);
    }
    finishForge(world, clean, settings);
  }, [finishForge, go]);

  const playLocal = useCallback(() => {
    if (screen !== 'forge' || !forgeQuestion) return;
    forgeToken.current += 1;
    finishForge(null, forgeQuestion, aiSettingsRef.current);
  }, [finishForge, forgeQuestion, screen]);

  const openWorld = useCallback((universe: Universe) => {
    const refreshed = advanceLife(archiveRef.current.find((item) => item.id === universe.id) ?? universe);
    const ready = refreshed.state.pending || refreshed.state.ending
      ? refreshed
      : { ...refreshed, state: { ...refreshed.state, pending: buildDecision(refreshed) } };
    commit(ready, true);
    setScene(null);
    setOutcome(null);
    setSelectedLocationId(ready.state.locations[0]?.id ?? null);
    setSelectedCharacterId(ready.state.characters[0]?.id ?? null);
    go('world');
  }, [commit, go]);

  const useLocalDecision = useCallback(() => {
    const universe = activeRef.current;
    if (!universe || universe.state.ending) return;
    stopDecision(universe.id);
    if (!universe.state.pending) {
      commit({ ...universe, state: { ...universe.state, pending: buildDecision(universe) } });
    }
  }, [commit, stopDecision]);

  const choose = useCallback(
    (optionId: string, allyId?: string) => {
      const universe = activeRef.current;
      if (!universe?.state.pending?.options.some((option) => option.id === optionId) || decisionsInProgress.current.has(universe.id)) return;
      const settings = aiSettingsRef.current;
      setScene(null);
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

      if (aiReady(settings) && result.universe.mode === 'ai' && !result.ending) {
        requestNextDecision(result.universe, settings);
      }
    },
    [commit, go, requestNextDecision],
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

  const fork = useCallback((nodeId: string) => {
    const universe = activeRef.current;
    if (!universe) return;
    const branch = forkUniverse(universe, nodeId);
    if (!branch) return;
    commit(advanceLife(branch), true);
    setScene(null);
    setOutcome(null);
    setSelectedLocationId(branch.state.locations[0]?.id ?? null);
    setSelectedCharacterId(branch.state.characters[0]?.id ?? null);
    setRoute({ screen: 'decision', history: ['world'], tab: 'home' });
  }, [commit]);

  const openCharacter = useCallback((characterId: string) => {
    const universe = activeRef.current;
    const character = universe?.state.characters.find((item) => item.id === characterId);
    if (!universe || !character) return;
    const key = `${universe.id}:${characterId}`;
    if (!chatsRef.current[key]) {
      updateChats({
        ...chatsRef.current,
        [key]: [{ id: 'greet', from: 'character', text: greetingFor(universe, character) }],
      });
    }
    setSelectedCharacterId(characterId);
    go('character');
  }, [go, updateChats]);

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim();
    const universe = activeRef.current;
    const character = universe?.state.characters.find((item) => item.id === selectedCharacterId);
    if (!text || !universe || !character) return;
    const key = `${universe.id}:${character.id}`;
    if (chatInProgress.current.has(key)) return;
    const token = Symbol();
    chatInProgress.current.set(key, token);
    setTypingKeys([...chatInProgress.current.keys()]);
    const existing = chatsRef.current[key] ?? [];
    const message: ChatMessage = { id: `u-${Date.now()}`, from: 'user', text };
    const withUser = [...existing, message].slice(-79);
    updateChats({ ...chatsRef.current, [key]: withUser });
    const settings = aiSettingsRef.current;

    try {
      await delay(420 + Math.min(600, text.length * 10));
      if (chatInProgress.current.get(key) !== token) return;
      let aiText: string | null = null;
      if (aiReady(settings) && universe.mode === 'ai') {
        try {
          aiText = await chatAI(universe, character.name, character.role, text, existing.slice(-8), settings);
        } catch (error) {
          if (activeRef.current?.id === universe.id && aiSettingsRef.current === settings && chatInProgress.current.get(key) === token) {
            setAiError(error instanceof AiError ? error.message : 'Модель не ответила');
          }
        }
      }
      if (chatInProgress.current.get(key) !== token) return;
      const current = archiveRef.current.find((item) => item.id === universe.id);
      const resident = current?.state.characters.find((item) => item.id === character.id);
      if (!current || !resident) return;

      const reply = aiText
        ? { text: aiText, bondDelta: 3 }
        : replyToCharacter(current, resident, text, existing.filter((item) => item.from === 'user').length);
      const response: ChatMessage = { id: `c-${Date.now()}`, from: 'character', text: reply.text };
      updateChats({ ...chatsRef.current, [key]: [...withUser, response] });

      if (!current.state.ending) {
        const bond = Math.min(100, resident.bond + reply.bondDelta);
        const characters = current.state.characters.map((item) => item.id === resident.id
          ? { ...item, bond, status: characterStatus(bond) }
          : item);
        commit({ ...current, updatedAt: new Date().toISOString(), state: { ...current.state, characters } });
      }
    } finally {
      if (chatInProgress.current.get(key) === token) {
        chatInProgress.current.delete(key);
        setTypingKeys([...chatInProgress.current.keys()]);
      }
    }
  }, [commit, selectedCharacterId, updateChats]);

  const deleteWorld = useCallback((id: string) => {
    shouldSaveArchive.current = true;
    const next = archiveRef.current.filter((item) => item.id !== id);
    archiveRef.current = next;
    setArchive(next);
    stopDecision(id);
    clearWorldChats(id);
    if (activeRef.current?.id === id) {
      activeRef.current = null;
      setActive(null);
      setOutcome(null);
      setScene(null);
    }
  }, [clearWorldChats, stopDecision]);

  const resetAll = useCallback(() => {
    forgeToken.current += 1;
    decisionsInProgress.current.clear();
    chatInProgress.current.clear();
    archiveRef.current = [];
    activeRef.current = null;
    setArchive([]);
    setActive(null);
    setDecisionIds([]);
    setTypingKeys([]);
    setOutcome(null);
    setScene(null);
    updateChats({});
  }, [updateChats]);

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
      decisionsInProgress.current.clear();
      chatInProgress.current.clear();
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
    typing: !!active && typingKeys.includes(`${active.id}:${selectedCharacterId}`),
    decisionLoading: !!active && decisionIds.includes(active.id),
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
    playLocal,
    openWorld,
    choose,
    useLocalDecision,
    fork,
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
