const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { registerHooks } = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react-native') return { url: 'parallel:test-platform', shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'parallel:test-platform') {
      return { format: 'commonjs', source: 'exports.Platform = { select: (styles) => styles.default };', shortCircuit: true };
    }
    return next(url, context);
  },
});
require.extensions['.jpg'] = require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};
require.extensions['.ts'] = (module, filename) => {
  const source = readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { createUniverse } = require('../src/engine/generate');
const { applyOption, computeEnding, forkUniverse, TOTAL_DECISIONS } = require('../src/engine/events');
const { isPlayableHypothesis } = require('../src/engine/hypothesis');
const { advanceLife, WORLD_DAY_MS, MAX_MISSED_DAYS } = require('../src/engine/life');
const { exploreLocation } = require('../src/engine/explore');
const { bless, curse, faithOf, POWERS, useDivinePower } = require('../src/engine/divine');
const { decisionFromWire, generateUniverseAI, universeFromWire } = require('../src/engine/ai');
const { DEFAULT_SETTINGS } = require('../src/engine/providers');

const gravity = 'Что, если бы гравитация зависела от памяти?';
const rain = 'Что, если бы дождь шёл по расписанию?';

test('a bundled Groq key selects Groq and stays scoped to its official endpoint', () => {
  const path = require.resolve('../src/engine/providers');
  const original = require.cache[path];
  const names = ['EXPO_PUBLIC_GROQ_KEY', 'EXPO_PUBLIC_AI_PROVIDER', 'EXPO_PUBLIC_AI_BASE_URL'];
  const previous = names.map((name) => process.env[name]);
  try {
    process.env.EXPO_PUBLIC_GROQ_KEY = 'test-bundled-key';
    delete process.env.EXPO_PUBLIC_AI_PROVIDER;
    delete process.env.EXPO_PUBLIC_AI_BASE_URL;
    delete require.cache[path];
    const { DEFAULT_SETTINGS, chatKey, isAiReady } = require(path);
    assert.equal(DEFAULT_SETTINGS.provider, 'groq');
    assert.equal(chatKey(DEFAULT_SETTINGS), 'test-bundled-key');
    assert.equal(isAiReady(DEFAULT_SETTINGS, ''), true);
    assert.equal(chatKey({ ...DEFAULT_SETTINGS, key: 'manual-test-key' }), 'manual-test-key');
    assert.equal(chatKey({ ...DEFAULT_SETTINGS, provider: 'openrouter' }), '');
    process.env.EXPO_PUBLIC_AI_BASE_URL = 'https://example.test/chat/completions';
    assert.equal(chatKey(DEFAULT_SETTINGS), '');
  } finally {
    require.cache[path] = original;
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

test('a keyword cannot replace a custom hypothesis with an unrelated world', () => {
  const world = createUniverse(gravity);
  assert.equal(world.theme, 'genesis');
  assert.match(world.rule, /гравитация зависела от памяти/i);
  assert.match(world.premise, /страховочные линии/);
  assert.match(world.state.pending.context, /гравитация зависела от памяти/i);
  assert.match(createUniverse(rain).state.pending.title, /прогноз/);
  assert.equal(createUniverse('Что, если бы время можно было покупать?').theme, 'time');
  assert.equal(isPlayableHypothesis('А что, если бы…'), false);
});

test('six outcomes use the settled metrics, and a fork preserves both histories', () => {
  let world = createUniverse(rain);
  for (let index = 0; index < TOTAL_DECISIONS; index += 1) {
    const decision = world.state.pending;
    assert.equal(decision.index, index + 1);
    world = applyOption(world, decision.options[1].id).universe;
    assert.ok(world.state.chronicle.find((entry) => entry.id === `diary-${index + 1}-0`));
  }
  assert.equal(world.state.pending, null);
  assert.equal(world.state.ending.id, computeEnding(world.state, world).id);
  const node = world.path[2];
  const branch = forkUniverse(world, node.id, 1000);
  assert.ok(branch);
  assert.notEqual(branch.id, world.id);
  assert.equal(branch.state.turn, 2);
  assert.equal(branch.fork.sourceId, world.id);
  assert.equal(branch.path.length, 2);
  assert.equal(world.path.length, 6);
  assert.ok(world.state.ending);
  assert.equal(forkUniverse(world, 'missing'), null);
});

test('diary catches up in bounded steps and artifacts are recovered once per line', () => {
  const world = advanceLife(createUniverse(rain), 1000);
  const later = advanceLife(world, 1000 + WORLD_DAY_MS * 300);
  assert.equal(later.state.life.day, MAX_MISSED_DAYS);
  assert.ok(later.state.life.threads.every((thread) => thread.progress > 0));
  assert.equal(advanceLife(later, later.state.life.lastAt), later);
  const locked = later.state.locations.find((location) => !location.unlocked);
  assert.equal(exploreLocation(later, locked.id), null);
  const place = later.state.locations[0];
  const visit = exploreLocation(later, place.id);
  assert.equal(visit.scene.artifact.title, later.signature.title);
  assert.equal(exploreLocation(visit.universe, place.id), null);
  const next = applyOption(visit.universe, visit.universe.state.pending.options[0].id).universe;
  assert.equal(next.state.life.artifacts.length, 1);
  assert.equal(exploreLocation(next, place.id).scene.artifact, undefined);
});

test('divine powers target specific entities and spend faith once per turn', () => {
  const world = advanceLife(createUniverse(gravity), 1000);
  const resident = world.state.characters[1];
  const inspired = useDivinePower(world, 'inspire', resident.id);
  assert.equal(inspired.state.characters[1].bond, resident.bond + 14);
  assert.equal(faithOf(inspired.state), faithOf(world.state) - POWERS.inspire.cost);
  assert.equal(useDivinePower(inspired, 'reveal', world.state.locations[0].id), null);
  assert.equal(faithOf(curse(inspired).state), faithOf(inspired.state) - 8);
  assert.equal(bless(curse(inspired)), null);
  const revealed = useDivinePower(world, 'reveal', world.state.locations[0].id);
  assert.equal(revealed.state.life.artifacts.length, 1);
  assert.equal(exploreLocation(revealed, world.state.locations[0].id).scene.artifact, undefined);
});

test('AI payload validation rejects unrelated worlds and duplicate options', () => {
  const world = createUniverse(gravity);
  const wire = {
    title: world.title,
    rule: world.rule,
    premise: world.premise,
    laws: world.state.laws.map((item) => item.text),
    locations: world.state.locations,
    characters: world.state.characters.map((item, index) => ({
      ...item, stance: ['control', 'liberty', 'transcend'][index],
    })),
    firstDecision: world.state.pending,
  };
  assert.ok(universeFromWire(wire, gravity));
  assert.equal(universeFromWire(wire, rain), null);
  assert.equal(universeFromWire({ ...wire, locations: wire.locations.slice(1) }, gravity), null);
  const decision = world.state.pending;
  assert.equal(decisionFromWire({ ...decision, options: Array(3).fill(decision.options[0]) }, world.id, 1), null);
  assert.equal(decisionFromWire({ ...decision, options: [null, ...decision.options.slice(1)] }, world.id, 1), null);
});

test('world generation retries incomplete JSON and accepts the premise across both fields', async (context) => {
  const question = 'Что если бы наш мир в 2026 году столкнулся с миром из игры Cyberpunk 2077?';
  const local = createUniverse(question);
  const wire = {
    title: 'Два города',
    rule: 'Технологии и люди проходят между двумя реальностями.',
    premise: 'В 2026 году наша реальность столкнулась с миром Cyberpunk 2077.',
    laws: local.state.laws.map((item) => item.text),
    locations: local.state.locations,
    characters: local.state.characters,
  };
  const requests = [];
  context.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(JSON.parse(options.body));
    const content = requests.length === 1 ? '{"title":' : JSON.stringify({ universe: wire });
    return Response.json({ choices: [{ message: { content } }] });
  });

  const world = await generateUniverseAI(question, { ...DEFAULT_SETTINGS, provider: 'local' });
  assert.equal(world.mode, 'ai');
  assert.equal(world.rule, wire.rule);
  assert.equal(requests.length, 2);
  assert.match(requests[1].messages[1].content, /некорректный JSON/);
});
