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
    if (message.type() === 'error' && !message.text().includes('404')) console.log('CONSOLE', message.text().slice(0, 160));
  });
  await page.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle0' });
  await wait(3200);

  const onboarded = (await page.evaluate(() => document.body.innerText)).toUpperCase().includes('ШАГ ПЕРВЫЙ');
  console.log('ONBOARDING:', onboarded);
  if (onboarded) {
    await page.screenshot({ path: path.join(OUT, 'n1-onboarding.png') });
    await tap(page, 'ДАЛЬШЕ');
    await wait(500);
    await tap(page, 'ДАЛЬШЕ');
    await wait(500);
    await tap(page, 'НАЧАТЬ');
    await wait(800);
  }

  await tap(page, 'СОЗДАТЬ ВСЕЛЕННУЮ');
  await wait(800);
  await tap(page, 'случайная');
  await wait(500);
  await tap(page, 'СОЗДАТЬ РЕАЛЬНОСТЬ');
  await wait(6500);

  const world = await page.evaluate(() => document.body.innerText);
  console.log('ROLE+OBJECTIVE:', world.includes('ВАША РОЛЬ') && world.includes('ЦЕЛЬ ПАРТИИ'));
  await page.screenshot({ path: path.join(OUT, 'n2-world.png') });

  await tap(page, 'Карта');
  await wait(900);
  await tap(page, 'Осмотреть место');
  await wait(1200);
  const scene = await page.evaluate(() => document.body.innerText);
  console.log('SCENE SHOWN:', scene.includes('Понятно'));
  await page.screenshot({ path: path.join(OUT, 'n3-scene.png') });

  await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
  await wait(1200);
  await tap(page, 'Контроль');
  await wait(400);
  await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
  await wait(1500);
  await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
  await wait(1800);

  for (let round = 0; round < 2; round += 1) {
    await tap(page, 'ВМЕШАТЬСЯ В ИСТОРИЮ');
    await wait(1500);
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes('СОЮЗНИКИ')) {
      console.log('ALLIES:', true);
      await page.screenshot({ path: path.join(OUT, 'n4-allies.png') });
      break;
    }
    console.log('ALLIES ROUND', round, false);
    await tap(page, 'Контроль');
    await wait(300);
    await tap(page, 'ИЗМЕНИТЬ РЕАЛЬНОСТЬ');
    await wait(1400);
    await tap(page, 'ВОЙТИ В НОВУЮ ВЕТВЬ');
    await wait(1600);
  }
  await page.screenshot({ path: path.join(OUT, 'n4-allies.png') });

  await browser.close();
})().catch((error) => {
  console.error('FAILED', error);
  process.exit(1);
});
