const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const KEY = process.env.GROQ_KEY || '';
const OUT = path.join(__dirname, '..', '.shots');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tap(page, label, options = {}) {
  const exact = options.exact !== false;
  const box = await page.evaluate(
    (text, isExact) => {
      const nodes = Array.from(document.querySelectorAll('div, span, a, button'));
      const target = nodes
        .filter((node) => {
          const content = (node.textContent || '').trim();
          return isExact ? content === text : content.includes(text);
        })
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const rect = target.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    },
    label,
    exact,
  );
  if (!box) {
    console.log('MISS', label);
    return false;
  }
  await page.mouse.click(box.x, box.y);
  return true;
}

async function tapSelector(page, selector) {
  const box = await page.evaluate((sel) => {
    const target = document.querySelector(sel);
    if (!target) return null;
    target.scrollIntoView({ block: 'center' });
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, selector);
  if (!box) {
    console.log('MISS SELECTOR', selector);
    return false;
  }
  await wait(150);
  const again = await page.evaluate((sel) => {
    const target = document.querySelector(sel);
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, selector);
  await page.mouse.click(again.x, again.y);
  return true;
}

async function text(page) {
  return page.evaluate(() => document.body.innerText);
}

async function waitFor(page, predicate, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const body = await text(page);
    if (predicate(body)) return body;
    await wait(700);
  }
  console.log('TIMEOUT', label);
  return null;
}

(async () => {
  if (!KEY.startsWith('gsk_')) {
    console.log('Нет GROQ_KEY');
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message));

  await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle0' });
  await wait(3200);

  await tap(page, 'Профиль');
  await wait(1000);
  await tap(page, 'Groq');
  await wait(500);
  await tapSelector(page, 'input[type="password"]');
  await page.keyboard.type(KEY);
  await wait(300);
  await tap(page, 'Проверить связь', { exact: false });

  const checked = await waitFor(page, (body) => body.includes('Модель ответила') || body.includes('на связи'), 40000, 'check');
  console.log('CHECK:', checked ? 'ok' : 'fail');
  await page.screenshot({ path: path.join(OUT, 'r1-check.png') });

  await tap(page, 'Главная');
  await wait(800);
  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(800);
  await page.evaluate((question) => {
    const area = document.querySelector('textarea');
    if (!area) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(area, question);
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }, 'Что, если бы люди могли продавать свои воспоминания?');
  await wait(500);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');

  const world = await waitFor(page, (body) => body.includes('AI CORE') && (body.includes('ПРАВИЛО МИРА') || body.includes('Правило мира')), 120000, 'world');
  if (!world) {
    console.log('WORLD FAIL. BODY:', (await text(page)).slice(0, 400).replace(/\n/g, ' | '));
    await page.screenshot({ path: path.join(OUT, 'r2-fail.png') });
    await browser.close();
    return;
  }
  const head = world.split('\n').slice(0, 10).join(' | ');
  console.log('WORLD HEAD:', head);
  await page.screenshot({ path: path.join(OUT, 'r2-world.png') });

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  const decision = await waitFor(page, (body) => body.includes('ТОЧКА ВЫБОРА 01') && body.includes('ВОПРОС'), 90000, 'decision');
  console.log('DECISION:', decision ? decision.split('\n').slice(0, 8).join(' | ') : 'fail');
  await page.screenshot({ path: path.join(OUT, 'r3-decision.png') });

  await browser.close();
})().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
