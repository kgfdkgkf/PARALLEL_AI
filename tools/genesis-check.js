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

async function back(page) {
  const box = await page.evaluate(() => {
    const node = document.querySelector('[aria-label="back"]');
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (box) await page.mouse.click(box.x, box.y);
  await wait(900);
}

async function makeWorld(page, prompt) {
  await tap(page, 'Главная');
  await wait(700);
  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(800);
  await page.evaluate((text) => {
    const area = document.querySelector('textarea');
    if (!area) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(area, text);
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }, prompt);
  await wait(500);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
  await wait(6500);
  const body = await page.evaluate(() => document.body.innerText);
  return body;
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
  await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle0' });
  await wait(3200);

  const first = await makeWorld(page, 'Что, если бы люди забыли, как читать?');
  await page.screenshot({ path: path.join(OUT, 'g1-world.png') });
  console.log('WORLD 1:', first.split('\n').slice(0, 12).join(' | '));

  await back(page);
  await back(page);
  const second = await makeWorld(page, 'Что, если бы дождь шёл только по расписанию?');
  await page.screenshot({ path: path.join(OUT, 'g2-world.png') });
  console.log('WORLD 2:', second.split('\n').slice(0, 12).join(' | '));

  const diff = first !== second;
  console.log('WORLDS DIFFER:', diff);

  await back(page);
  await back(page);
  await tap(page, 'Профиль');
  await wait(900);
  await page.mouse.move(195, 500);
  await page.mouse.wheel({ deltaY: 700 });
  await wait(700);
  await page.screenshot({ path: path.join(OUT, 'g3-profile.png') });

  await browser.close();
})().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
