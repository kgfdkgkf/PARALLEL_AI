const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { readFile } = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const browserPath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((candidate) => candidate && existsSync(candidate));
const dist = path.resolve(__dirname, '../dist');
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l2YAAAAASUVORK5CYII=';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
};
const illustrated = new Set();
let mockAI;

function sendJson(response, payload) {
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(payload));
}

async function handle(request, response) {
  const name = new URL(request.url, 'http://localhost').pathname;
  if (name === '/v1/illustrations' && request.method === 'POST') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const form = JSON.parse(Buffer.concat(chunks).toString());
    assert.ok(['location', 'portrait'].includes(form.kind));
    assert.match(form.description, /дождь/i);
    illustrated.add(form.kind);
    sendJson(response, { mime: 'image/png', base64: png });
    return;
  }
  if (mockAI && name === '/health') return sendJson(response, { ai_configured: true, model: 'mock' });
  if (mockAI && name === '/v1/universes/generate') return sendJson(response, mockAI.world);
  if (mockAI && /^\/v1\/universes\/[^/]+\/decisions$/.test(name)) return sendJson(response, mockAI.decision);
  const file = path.resolve(dist, '.' + (name === '/' ? '/index.html' : decodeURI(name)));
  if (!file.startsWith(dist + path.sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' }).end(content);
  } catch {
    response.writeHead(404).end();
  }
}

async function button(page, label) {
  const target = await page.waitForFunction((text) => {
    return [...document.querySelectorAll('button, [role=button]')].find((item) => {
      const candidate = item.getAttribute('aria-label') || item.innerText;
      const visible = item.getBoundingClientRect().height > 0;
      return candidate?.trim().toLowerCase() === text.toLowerCase() && visible && item.getAttribute('aria-disabled') !== 'true';
    });
  }, {}, label);
  const element = target.asElement();
  await element.evaluate((item) => item.scrollIntoView({ block: 'center' }));
  await element.click();
  await target.dispose();
}

async function see(page, text) {
  try {
    await page.waitForFunction((needle) => document.body.innerText.toLowerCase().includes(needle.toLowerCase()), {}, text);
  } catch (cause) {
    const visible = await page.evaluate(() => document.body.innerText.slice(0, 1200));
    throw new Error(`Expected "${text}". Visible text:\n${visible}`, { cause });
  }
}

async function main() {
  assert.ok(browserPath, 'Set CHROME_PATH to your Chromium executable');
  assert.ok(existsSync(path.join(dist, 'index.html')), 'Run npm run build:web first');
  if (process.env.PARALLEL_AI_MOCK === '1') {
    mockAI = JSON.parse(execFileSync(process.env.PYTHON || 'python', [
      '-c',
      'import json; from tools.mock_api import universe_for, decision_for; print(json.dumps({"world": universe_for("Сон перестал быть обязательным"), "decision": decision_for(2)}))',
    ], { cwd: path.dirname(dist), encoding: 'utf8' }));
  }
  const server = http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      process.exitCode = 1;
      console.error(error);
      response.writeHead(500).end();
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluateOnNewDocument(() => {
      window.spokenLines = [];
      speechSynthesis.speak = (utterance) => {
        window.spokenLines.push(utterance.text);
        setTimeout(() => utterance.onend?.(), 100);
      };
    });
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await button(page, 'Пропустить');
    await button(page, 'Профиль');
    await button(page, 'Локальный движок');
    await page.locator('input[aria-label="Адрес сервера иллюстраций"]').fill(origin);
    await button(page, 'Создать');
    await page.locator('textarea').fill('Что, если бы дождь шёл по расписанию?');
    await button(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
    await see(page, 'дождь шёл по расписанию');

    await button(page, 'Карта');
    await button(page, 'Создать иллюстрацию');
    await page.waitForSelector('img[alt="Водосборный квартал"], [aria-label="Водосборный квартал"] img');
    await button(page, 'Осмотреть место');
    await see(page, 'Найдено: Ручной погодный журнал');
    await button(page, 'Озвучить сцену');
    await page.waitForFunction(() => window.spokenLines.length === 1);

    await button(page, 'Дневник');
    await button(page, 'Наблюдать следующий день');
    await see(page, 'день 1');
    await see(page, 'коллекция артефактов');
    await button(page, 'Бог');
    await button(page, 'Откровение');
    const place = await page.evaluate(() => JSON.parse(localStorage.getItem('parallel.archive.v2')).archive[0].state.locations[1].name);
    await button(page, place);
    await button(page, 'Применить силу');
    await see(page, 'Предмет внесли в коллекцию');

    await button(page, 'Жители');
    const names = await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('parallel.archive.v2'));
      return save.archive[0].state.characters.map((character) => character.name);
    });
    const person = await page.waitForFunction((name) => {
      return [...document.querySelectorAll('[role=button]')].find((item) => item.innerText.startsWith(name));
    }, {}, names[0]);
    await person.asElement().scrollIntoView();
    await person.asElement().click();
    await button(page, 'Создать портрет');
    await page.waitForSelector(`img[alt="${names[0]}"], [aria-label="${names[0]}"] img`);
    await button(page, 'back');
    await button(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
    await see(page, 'Спор двух прогнозов');
    const opinion = await page.waitForFunction(() => {
      return [...document.querySelectorAll('[role=button]')].find((item) => item.innerText.includes('Поручить решение городской службе'));
    });
    await opinion.asElement().scrollIntoView();
    await opinion.asElement().click();
    await button(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
    await button(page, 'Начать новую ветвь отсюда');
    await see(page, 'Спор двух прогнозов');

    await page.waitForFunction(() => JSON.parse(localStorage.getItem('parallel.archive.v2')).archive.length === 2);
    await page.reload({ waitUntil: 'networkidle0' });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('parallel.archive.v2')));
    assert.deepEqual(saved.archive.map((world) => world.state.turn), [0, 1]);
    assert.equal(saved.archive[0].fork.sourceId, saved.archive[1].id);
    assert.equal(saved.archive[1].state.life.artifacts.length, 2);
    assert.deepEqual([...illustrated].sort(), ['location', 'portrait']);
    if (mockAI) {
      await button(page, 'Профиль');
      await button(page, 'Свой сервер');
      await page.locator('input[aria-label="Адрес AI-сервера"]').fill(origin);
      await button(page, 'Проверить связь');
      await see(page, 'Сервер на связи');
      await button(page, 'Создать');
      await page.locator('textarea').fill('Что, если бы сон перестал быть обязательным?');
      await button(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
      await see(page, 'ГОРОД БЕЗ СНА');
      await button(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
      await see(page, 'Первая капсула');
      const firstOption = await page.waitForFunction(() => {
        return [...document.querySelectorAll('[role=button]')].find((item) => item.innerText.includes('По стажу смены'));
      });
      await firstOption.asElement().evaluate((item) => item.scrollIntoView({ block: 'center' }));
      await firstOption.asElement().click();
      await button(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
      await button(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
      await button(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
      await see(page, 'Смена 2: трещина в графике');
    }

    await page.setViewport({ width: 1440, height: 900 });
    await button(page, 'Профиль');
    await button(page, 'Локальный движок');
    await button(page, 'Создать');
    await see(page, 'Ctrl + Enter');
    const layout = await page.evaluate(() => {
      const nav = document.querySelector('[role=navigation], nav').getBoundingClientRect();
      const input = document.querySelector('textarea').getBoundingClientRect();
      const sample = [...document.querySelectorAll('[role=button]')].find((el) => el.innerText.includes('время можно было покупать'));
      return { navRight: nav.right, inputLeft: input.left, inputRight: input.right, sampleLeft: sample.getBoundingClientRect().left };
    });
    assert.ok(layout.navRight < layout.inputLeft && layout.inputRight < layout.sampleLeft, 'Desktop navigation and suggestions should flank the composer');
    await page.locator('textarea').fill('Что, если бы рассвет зависел от температуры?');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await see(page, 'рассвет зависел от температуры');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('parallel.archive.v2')).archive[0].question.includes('рассвет'));
    assert.deepEqual(pageErrors, []);
    console.log('Web smoke passed on mobile and desktop, including the desktop creation shortcut.');
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
