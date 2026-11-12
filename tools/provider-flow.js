const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

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
      const rect = target.getBoundingClientRect();
      if (rect.y < 0 || rect.y > 820 || rect.height === 0) {
        target.scrollIntoView({ block: 'center' });
      }
      const box = target.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) console.log('CONSOLE', message.text().slice(0, 200));
  });

  await page.goto('http://127.0.0.1:8100/', { waitUntil: 'networkidle0' });
  await wait(3500);

  await tap(page, 'Профиль');
  await wait(1200);
  await tap(page, 'Google Gemini');
  await wait(600);
  await page.screenshot({ path: path.join(OUT, 'p1-settings.png') });
  console.log('SETTINGS SHOWN:', (await page.evaluate(() => document.body.innerText)).includes('КЛЮЧ'));

  await tapSelector(page, 'input[type="password"]');
  await page.keyboard.type('test-key-1234567890');
  await wait(300);
  await tap(page, 'Проверить связь', { exact: false });
  await wait(2500);
  const afterCheck = await page.evaluate(() => document.body.innerText);
  console.log('CHECK ONLINE:', afterCheck.includes('на связи'));
  await page.screenshot({ path: path.join(OUT, 'p2-checked.png') });

  await tap(page, 'Главная');
  await wait(900);
  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(900);
  await tap(page, 'случайная');
  await wait(600);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
  await wait(2200);
  await page.screenshot({ path: path.join(OUT, 'p3-forge.png') });
  await wait(9000);

  const world = await page.evaluate(() => document.body.innerText);
  console.log('AI WORLD TITLE:', world.includes('ТИХАЯ ВАЛЮТА'));
  console.log('AI BADGE:', world.includes('AI CORE'));
  await page.screenshot({ path: path.join(OUT, 'p4-world.png') });

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(3500);
  const decision = await page.evaluate(() => document.body.innerText);
  console.log('AI FIRST DECISION:', decision.includes('Бесплатный час'));
  await page.screenshot({ path: path.join(OUT, 'p5-decision.png') });

  await tap(page, 'Свобода');
  await wait(500);
  await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
  await wait(2500);
  await page.screenshot({ path: path.join(OUT, 'p6-outcome.png') });

  await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
  await wait(4000);
  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(4000);
  const second = await page.evaluate(() => document.body.innerText);
  console.log('AI SECOND DECISION:', second.includes('Счётчик для детей'));
  await page.screenshot({ path: path.join(OUT, 'p7-decision2.png') });

  await browser.close();
})().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
