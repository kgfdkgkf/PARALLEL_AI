const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.SHOT_URL || 'http://127.0.0.1:8099/';
const OUT = path.join(__dirname, '..', '.shots');
const PREFIX = process.env.SHOT_PREFIX || '';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Настоящий клик мышью по центру элемента с точным текстом. */
async function tap(page, label, options = {}) {
  const exact = options.exact !== false;
  const measure = () =>
    page.evaluate(
      (text, isExact) => {
        const nodes = Array.from(document.querySelectorAll('div, span, a, button, textarea'));
        const matches = nodes.filter((node) => {
          const content = (node.textContent || '').trim();
          return isExact ? content === text : content.includes(text);
        });
        const target = matches.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, top: rect.y, height: rect.height, width: rect.width };
      },
      label,
      exact,
    );

  let box = await measure();
  if (!box) {
    console.log('MISS', label);
    return false;
  }
  if (box.y < 60 || box.y > 780) {
    await page.evaluate((text, isExact) => {
      const nodes = Array.from(document.querySelectorAll('div, span, a, button, textarea'));
      const target = nodes
        .filter((node) => {
          const content = (node.textContent || '').trim();
          return isExact ? content === text : content.includes(text);
        })
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      if (target) target.scrollIntoView({ block: 'center' });
    }, label, exact);
    await wait(220);
    box = await measure();
    if (!box) {
      console.log('MISS AFTER SCROLL', label);
      return false;
    }
  }
  await page.mouse.click(box.x, box.y);
  return true;
}

async function tapLabel(page, label) {
  const box = await page.evaluate((name) => {
    const nodes = Array.from(document.querySelectorAll('[aria-label]'));
    const target = nodes.find((node) => node.getAttribute('aria-label') === name);
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, label);
  if (!box) {
    console.log('MISS LABEL', label);
    return false;
  }
  await page.mouse.click(box.x, box.y);
  return true;
}

async function tapSelector(page, selector) {
  const box = await page.evaluate((sel) => {
    const target = document.querySelector(sel);
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, selector);
  if (!box) {
    console.log('MISS SELECTOR', selector);
    return false;
  }
  await page.mouse.click(box.x, box.y);
  return true;
}

async function scrollBy(page, deltaY) {
  await page.mouse.move(195, 420);
  await page.mouse.wheel({ deltaY });
  await wait(350);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${PREFIX}${name}.png`) });
  console.log('SHOT', PREFIX + name);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('CONSOLE ERROR', message.text().slice(0, 240));
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(3200);
  await shot(page, '01-home');

  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(900);
  await shot(page, '02-create');

  await tap(page, 'Что, если бы ИИ появился двести лет назад?');
  await wait(300);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
  await wait(1500);
  await shot(page, '03-forge');
  await wait(3600);
  await shot(page, '04-world');

  await tap(page, 'Карта');
  await wait(900);
  await shot(page, '05-map');

  await tap(page, 'Жители');
  await wait(800);
  await shot(page, '06-people');

  await tap(page, 'Голос-17', { exact: false });
  await wait(900);
  await shot(page, '07-character');
  await tapSelector(page, 'textarea');
  await page.keyboard.type('Почему машины не правят миром?');
  await page.keyboard.press('Enter');
  await wait(2800);
  await shot(page, '08-character-reply');

  await tapLabel(page, 'back');
  await wait(900);
  await tap(page, 'Хроника');
  await wait(800);
  await shot(page, '09-chronicle');

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(1000);
  await shot(page, '10-decision');
  await tap(page, 'Контроль');
  await wait(400);
  await shot(page, '11-decision-selected');
  await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
  await wait(1300);
  await shot(page, '12-outcome');
  await scrollBy(page, 640);
  await shot(page, '13-outcome-scroll');

  await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
  await wait(1000);
  await scrollBy(page, 900);
  await shot(page, '14-world-after');

  const stances = ['Свобода', 'Трансформация', 'Контроль', 'Свобода', 'Трансформация'];
  for (const stance of stances) {
    await page.mouse.wheel({ deltaY: -4000 });
    await wait(400);
    await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
    await wait(900);
    await tap(page, stance);
    await wait(350);
    await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
    await wait(1200);
    const opened = await tap(page, 'ОТКРЫТЬ ФИНАЛ', { exact: false });
    if (!opened) await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
    await wait(1000);
  }

  await wait(600);
  console.log('AFTER LOOP:', (await page.evaluate(() => document.body.innerText)).slice(0, 320).replace(/\n/g, ' | '));
  await shot(page, '15-ending');
  await scrollBy(page, 700);
  await shot(page, '16-ending-scroll');

  await tap(page, 'Сравнить ветви', { exact: false });
  await wait(1000);
  await shot(page, '17-branches');

  await browser.close();
}

main().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
