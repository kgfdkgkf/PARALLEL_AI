const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://127.0.0.1:8100/';
const OUT = path.join(__dirname, '..', '.shots');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tap(page, label, options = {}) {
  const exact = options.exact !== false;
  const measure = () =>
    page.evaluate(
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
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
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
      const nodes = Array.from(document.querySelectorAll('div, span, a, button'));
      const target = nodes
        .filter((node) => {
          const content = (node.textContent || '').trim();
          return isExact ? content === text : content.includes(text);
        })
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      if (target) target.scrollIntoView({ block: 'center' });
    }, label, exact);
    await wait(200);
    box = await measure();
    if (!box) return false;
  }
  await page.mouse.click(box.x, box.y);
  return true;
}

async function text(page) {
  return page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('CONSOLE ERROR', message.text().slice(0, 200));
    if (message.text().startsWith('[AI]')) console.log('AI LOG', message.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await wait(3500);
  console.log('HOME HAS AI BADGE:', (await text(page)).includes('AI CORE'));
  await page.screenshot({ path: path.join(OUT, 'ai-01-home.png') });

  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(800);
  console.log('CREATE HINT:', (await text(page)).includes('AI CORE:'));
  await page.screenshot({ path: path.join(OUT, 'ai-02-create.png') });

  await tap(page, 'Что, если бы время можно было покупать?');
  await wait(300);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
  await wait(8500);
  const world = await text(page);
  console.log('WORLD FROM AI:', world.slice(0, 220));
  console.log('HAS MOCK TITLE:', world.includes('ГОРОД БЕЗ СНА'));
  await page.screenshot({ path: path.join(OUT, 'ai-03-world.png') });

  await tap(page, 'Карта');
  await wait(900);
  await page.screenshot({ path: path.join(OUT, 'ai-04-map.png') });

  await tap(page, 'Жители');
  await wait(800);
  await tap(page, 'Лида Крон', { exact: false });
  await wait(900);
  await page.screenshot({ path: path.join(OUT, 'ai-05-character.png') });

  await page.evaluate(() => {
    const input = document.querySelector('input');
    if (input) input.scrollIntoView({ block: 'center' });
  });
  const inputBox = await page.evaluate(() => {
    const input = document.querySelector('input');
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (inputBox) {
    await page.mouse.click(inputBox.x, inputBox.y);
    await page.keyboard.type('Почему вы не спите?');
    await page.keyboard.press('Enter');
    await wait(3000);
    const chat = await text(page);
    console.log('CHAT HAS MOCK REPLY:', chat.includes('отвечает:'));
    await page.screenshot({ path: path.join(OUT, 'ai-06-chat.png') });
  } else {
    console.log('NO INPUT FOUND');
  }

  const back = await page.evaluate(() => {
    const node = document.querySelector('[aria-label="back"]');
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (back) await page.mouse.click(back.x, back.y);
  await wait(900);

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(1200);
  const decision = await text(page);
  console.log('FIRST DECISION:', decision.slice(0, 200));
  console.log('HAS AI DECISION:', decision.includes('Первая капсула'));
  await page.screenshot({ path: path.join(OUT, 'ai-07-decision.png') });

  await tap(page, 'Свобода');
  await wait(400);
  await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
  await wait(1600);
  await page.screenshot({ path: path.join(OUT, 'ai-08-outcome.png') });

  await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
  await wait(2600);
  const world2 = await text(page);
  console.log('AFTER CHOICE:', world2.slice(0, 200));
  await page.screenshot({ path: path.join(OUT, 'ai-09-world-after.png') });

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(1600);
  const second = await text(page);
  console.log('SECOND DECISION:', second.slice(0, 220));
  console.log('HAS AI SECOND DECISION:', second.includes('трещина в графике'));
  await page.screenshot({ path: path.join(OUT, 'ai-10-decision-2.png') });

  await browser.close();
})().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
