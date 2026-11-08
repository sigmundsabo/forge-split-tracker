/* FORGE — böngészős ellenőrzés a Playwright könyvtári API-ján.
   Ugyanazt járja körbe, mint a tests/forge.spec.js, de nem kell hozzá a
   Playwright test-runner: `node tools/check.mjs`.
   Három eszközprofilon fut: iPhone 13, Pixel 7, desktop.
   Minden ellenőrzés friss böngészőkontextust kap, így üres localStorage-dzsal indul. */

import { chromium, devices } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
const DEMO = { email: 'demo@forge.hu', password: 'forge1234' };

const results = [];
let browser;
let profileName = '';
let profileDevice = null;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* egy ellenőrzés: friss kontextus, friss lap, utána bezár */
async function check(name, fn) {
  const label = `[${profileName}] ${name}`;
  const ctx = await browser.newContext({ ...profileDevice, locale: 'hu-HU' });
  const page = await ctx.newPage();
  try {
    await fn(page);
    results.push({ ok: true, label });
    process.stdout.write(`  ✓ ${label}\n`);
  } catch (e) {
    results.push({ ok: false, label, detail: e.message });
    process.stdout.write(`  ✗ ${label}\n      ${e.message}\n`);
  } finally {
    await ctx.close().catch(() => {});
  }
}

async function waitText(loc, expected, label = '') {
  const deadline = Date.now() + 6000;
  let last = '<nincs elem>';
  while (Date.now() < deadline) {
    try { last = (await loc.first().innerText({ timeout: 800 })).trim(); } catch { /* még nincs ott */ }
    const hit = expected instanceof RegExp ? expected.test(last) : last.includes(expected);
    if (hit) return last;
    await wait(100);
  }
  throw new Error(`${label} nem egyezik — kapott: "${last}", várt: ${expected}`);
}

async function waitUrl(page, re) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    if (re.test(page.url())) return;
    await wait(80);
  }
  throw new Error(`az útvonal nem lett ${re} — most: ${page.url()}`);
}

async function assertVisible(loc, label) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    if (await loc.first().isVisible().catch(() => false)) return;
    await wait(80);
  }
  throw new Error(`nem látható: ${label}`);
}

async function assertHidden(loc, label) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    if (!(await loc.first().isVisible().catch(() => false))) return;
    await wait(80);
  }
  throw new Error(`láthatónak maradt: ${label}`);
}

function eq(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    throw new Error(`${label} — kapott: "${actual}", várt: "${expected}"`);
  }
}

async function login(page, who = DEMO) {
  await page.goto(`${BASE}/`);
  await assertVisible(page.getByTestId('login-submit'), 'belépés gomb');
  await page.getByTestId('login-email').fill(who.email);
  await page.getByTestId('login-password').fill(who.password);
  await page.getByTestId('login-submit').click();
  await assertVisible(page.getByTestId('split-meta'), 'split fejléc');
}

/* ------------------------------------------------------------- a teljes kör */

async function fullSuite() {
  await check('a belépés nélküli látogató a login képernyőn landol', async (page) => {
    await page.goto(`${BASE}/#/split`);
    await waitUrl(page, /#\/login$/);
    await assertVisible(page.getByTestId('login-submit'), 'belépés gomb');
  });

  await check('rossz jelszó beszédes hibát ad, nem lép be', async (page) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('login-email').fill(DEMO.email);
    await page.getByTestId('login-password').fill('rosszjelszo');
    await page.getByTestId('login-submit').click();
    await waitText(page.getByTestId('login-error'), 'Nem talált ilyen fiókot', 'hibaszöveg');
  });

  await check('a demó fiókkal be lehet lépni, és a split 77 szettet mutat', async (page) => {
    await login(page);
    await waitText(page.getByTestId('split-meta'), '4 edzés · 29 gyakorlat · 77 szett', 'split fejléc');
    for (const id of ['upper', 'lower', 'anterior', 'posterior']) {
      await assertVisible(page.getByTestId(`card-${id}`), `${id} kártya`);
    }
  });

  await check('a négy kártya a saját naplózójára visz, helyes szettszámmal', async (page) => {
    await login(page);
    for (const [id, sets] of Object.entries({ upper: 23, lower: 17, anterior: 18, posterior: 19 })) {
      await page.getByTestId(`card-${id}`).click();
      await waitUrl(page, new RegExp(`#/workout/${id}$`));
      await waitText(page.getByTestId('wo-meta'), `${sets} szett`, `${id} szettszám`);
      await page.getByRole('link', { name: 'Vissza a splithez' }).click();
      await assertVisible(page.getByTestId('split-meta'), 'split fejléc');
    }
  });

  await check('nincs edzésidő-becslés és nincs naphoz kötés', async (page) => {
    await login(page);
    const split = (await page.getByTestId('app').innerText()).toLowerCase();
    for (const word of ['heti terv', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'perc']) {
      if (split.includes(word)) throw new Error(`a split tartalmazza: "${word}"`);
    }
    await page.getByTestId('card-upper').click();
    const wo = (await page.getByTestId('app').innerText()).toLowerCase();
    if (wo.includes('heti terv')) throw new Error('a naplózó tartalmazza: "heti terv"');
    if (/\d+\s*perc/.test(wo)) throw new Error('a naplózóban időbecslés van');
  });

  await check('szett rögzítése elindítja a pihenőt és számolja a kész szetteket', async (page) => {
    await login(page);
    await page.getByTestId('card-upper').click();
    await page.locator('input[name="w_pullover_1"]').fill('50');
    await page.locator('input[name="r_pullover_1"]').fill('10');
    await page.locator('#d_pullover-1').check();

    await waitText(page.getByTestId('wo-done'), /^1$/, 'kész szettek');
    await assertVisible(page.getByTestId('rest'), 'pihenő sáv');
    await waitText(page.getByTestId('rest-time'), /^1:[0-3]\d$/, 'pihenő óra');

    await page.getByRole('button', { name: 'Kihagy' }).click();
    await assertHidden(page.getByTestId('rest'), 'pihenő sáv');
  });

  await check('a legjobb szett túllépése rekordjelet kap', async (page) => {
    await login(page);
    await page.getByTestId('card-upper').click();
    // a pullover eddigi legjobbja 45 kg × 10
    await page.locator('input[name="w_pullover_2"]').fill('47.5');
    await page.locator('input[name="r_pullover_2"]').fill('9');
    await assertVisible(page.locator('[data-pr="pullover-2"] [aria-label="Új rekord"]'), 'rekordjel');
  });

  await check('az „Előző” gomb beírja a múltkori súlyt és ismétlést', async (page) => {
    await login(page);
    await page.getByTestId('card-upper').click();
    await page.getByTestId('prefill-chestpress').click();
    eq(await page.locator('input[name="w_chestpress_1"]').inputValue(), '60', 'előtöltött súly');
    eq(await page.locator('input[name="r_chestpress_1"]').inputValue(), '10', 'előtöltött ismétlés');
  });

  await check('az edzés befejezése összegzőt ad, a rekorddal együtt', async (page) => {
    await login(page);
    await page.getByTestId('card-upper').click();
    await page.locator('input[name="w_pullover_1"]').fill('50');
    await page.locator('input[name="r_pullover_1"]').fill('10');
    await page.locator('#d_pullover-1').check();
    await page.getByRole('button', { name: 'Kihagy' }).click();
    await page.getByTestId('finish').click();

    await waitUrl(page, /#\/summary\/upper$/);
    await waitText(page.getByTestId('sum-sets'), /^1$/, 'rögzített szett');
    await waitText(page.getByTestId('sum-prs'), /^1$/, 'rekordok száma');
    await assertVisible(page.getByText('Pullover').first(), 'rekord sora');
  });

  await check('a tracker radart és tíz számot ad, a cél alattit megjelöli', async (page) => {
    await login(page);
    await page.getByTestId('nav-muscles').click();
    await assertVisible(page.getByRole('img', { name: 'Izomcsoportok radardiagramja' }), 'radar');

    await waitText(page.getByTestId('mg-mell'), '13,5', 'mell');
    await waitText(page.getByTestId('mg-vall'), '15,5', 'váll');
    await waitText(page.getByTestId('mg-tricepsz'), '14', 'tricepsz');
    await waitText(page.getByTestId('mg-hat'), '11', 'hát');
    await waitText(page.getByTestId('mg-bicepsz'), '12', 'bicepsz');
    // a has 3 effektív sorozat: a 10-es sáv alatt, szín mellett ikonnal is jelölve
    await assertVisible(page.getByTestId('mg-has').getByLabel('cél alatt'), 'cél alatti jelzés');

    await page.getByTestId('range-30').click();
    eq(await page.getByTestId('range-30').getAttribute('aria-pressed'), 'true', '30 napos állapot');
    await waitText(page.getByTestId('mg-mell'), '58,1', 'mell 30 napra');
  });

  await check('az össz súly nem nyúl az izomcsoport-számokhoz', async (page) => {
    await login(page);
    await page.getByTestId('nav-muscles').click();
    const before = (await page.getByTestId('mg-mell').innerText()).trim();

    await page.getByTestId('nav-weight').click();
    await page.getByTestId('total-input').fill('3000');
    await waitText(page.getByTestId('preview'), /^15\s400$/, 'előnézet');
    await page.getByTestId('total-save').click();
    await waitUrl(page, /#\/split$/);
    await waitText(page.getByTestId('to-weight'), /15\s400/, 'split összesítő');

    await page.getByTestId('nav-muscles').click();
    const after = (await waitText(page.getByTestId('mg-mell'), '13,5', 'mell változatlan')).trim();
    eq(after, before, 'mell effektív sorozat');
  });

  await check('az össz súly üresét és nullát elutasít', async (page) => {
    await login(page);
    await page.getByTestId('nav-weight').click();
    await page.getByTestId('total-save').click();
    await waitText(page.getByTestId('total-error'), 'nullánál nagyobb', 'hibaszöveg');
  });

  await check('regisztráció: rövid jelszót elutasít, utána belép', async (page) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('to-signup').click();
    await page.getByTestId('su-name').fill('Teszt Elek');
    await page.getByTestId('su-email').fill('teszt@pelda.hu');
    await page.getByTestId('su-password').fill('rovid');
    await page.getByTestId('su-terms').check();
    await page.getByTestId('su-submit').click();
    await waitText(page.getByTestId('su-error'), 'legalább 8 karakter', 'jelszóhiba');

    await page.getByTestId('su-password').fill('nyolckarakter');
    await page.getByTestId('su-submit').click();
    await waitUrl(page, /#\/split$/);
    await page.getByTestId('nav-profile').click();
    await waitText(page.getByTestId('pf-name'), 'Teszt Elek', 'profil név');
  });

  await check('a profil ment, és a kg/lbs váltó átszámol', async (page) => {
    await login(page);
    await page.getByTestId('nav-profile').click();
    eq(await page.getByTestId('pf-weight').inputValue(), '84.2', 'testsúly kg-ban');

    await page.getByTestId('pf-lbs').click();
    eq(await page.getByTestId('pf-weight').inputValue(), '185.6', 'testsúly lbs-ben');

    await page.getByTestId('pf-name-input').fill('Zsiga');
    await page.getByTestId('pf-save').click();
    await waitText(page.getByTestId('pf-status'), 'Mentve', 'mentés jelzés');

    await page.getByTestId('nav-split').click();
    await page.getByTestId('nav-profile').click();
    await waitText(page.getByTestId('pf-name'), 'Zsiga', 'mentett név');
    eq(await page.getByTestId('pf-lbs').getAttribute('aria-pressed'), 'true', 'mentett mértékegység');
  });

  await check('a fióktörlés beírt megerősítést és jelszót kér', async (page) => {
    await login(page);
    await page.getByTestId('nav-profile').click();
    await page.getByTestId('to-delete').click();
    await waitUrl(page, /#\/delete$/);

    eq(await page.getByTestId('del-submit').isDisabled(), true, 'gomb kezdetben inaktív');

    await page.getByTestId('del-phrase').fill('TORLES');
    await waitText(page.getByTestId('del-hint'), 'Még nem egyezik', 'nem egyező jelzés');
    eq(await page.getByTestId('del-submit').isDisabled(), true, 'gomb rossz szónál inaktív');

    await page.getByTestId('del-phrase').fill('TÖRLÉS');
    await waitText(page.getByTestId('del-hint'), 'Megerősítve', 'megerősítés');
    eq(await page.getByTestId('del-submit').isDisabled(), false, 'gomb aktív');

    await page.getByTestId('del-password').fill('rosszjelszo');
    await page.getByTestId('del-submit').click();
    await waitText(page.getByTestId('del-hint'), 'A jelszó nem egyezik', 'jelszóhiba');
    await waitUrl(page, /#\/delete$/);
  });

  await check('helyes jelszóval a fiók eltűnik, és nem lehet újra belépni', async (page) => {
    await login(page);
    await page.getByTestId('nav-profile').click();
    await page.getByTestId('to-delete').click();
    await page.getByTestId('del-phrase').fill('TÖRLÉS');
    await page.getByTestId('del-password').fill(DEMO.password);
    await page.getByTestId('del-submit').click();

    await waitUrl(page, /#\/login/);
    await waitText(page.getByTestId('login-error'), 'A fiók törölve', 'törlés visszajelzés');

    await page.getByTestId('login-email').fill(DEMO.email);
    await page.getByTestId('login-password').fill(DEMO.password);
    await page.getByTestId('login-submit').click();
    await waitText(page.getByTestId('login-error'), 'Nem talált ilyen fiókot', 'törölt fiók');
  });

  await check('a „Mégsem” visszavisz a profilra törlés nélkül', async (page) => {
    await login(page);
    await page.getByTestId('nav-profile').click();
    await page.getByTestId('to-delete').click();
    await page.getByTestId('del-cancel').click();
    await waitUrl(page, /#\/profile$/);
    await assertVisible(page.getByTestId('pf-name'), 'profil név');
  });

  await check('nincs konzolhiba a fő útvonalakon', async (page) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await login(page);
    for (const hash of ['#/split', '#/workout/upper', '#/workout/lower', '#/workout/anterior',
      '#/workout/posterior', '#/muscles', '#/weight', '#/profile', '#/delete']) {
      await page.goto(`${BASE}/${hash}`);
      await wait(120);
    }
    // a Google Fonts offline nem töltődik — az nem a kódunk hibája
    const real = errors.filter((e) => !/fonts\.(googleapis|gstatic)\.com|ERR_(NAME|INTERNET|CONNECTION|BLOCKED)/i.test(e));
    if (real.length) throw new Error(`konzolhibák: ${real.slice(0, 3).join(' | ')}`);
  });
}

/* --------------------------------------------------------- minden eszközön */

const ROUTES = ['#/split', '#/workout/upper', '#/workout/posterior', '#/muscles', '#/weight', '#/profile', '#/delete'];

async function layoutSuite() {
  await check('nincs vízszintes csúszás egyetlen képernyőn sem', async (page) => {
    await login(page);
    for (const hash of ROUTES) {
      await page.goto(`${BASE}/${hash}`);
      await wait(120);
      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 1) throw new Error(`${hash}: ${over}px vízszintes túlfolyás`);
    }
  });

  await check('minden érintőfelület legalább 44 px magas', async (page) => {
    await login(page);
    for (const hash of ROUTES) {
      await page.goto(`${BASE}/${hash}`);
      await wait(120);
      const bad = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('a, button, input, select').forEach((el) => {
          if (el.type === 'hidden' || el.closest('.sr')) return;
          // egy jelölőnégyzet érintőfelülete a körülötte lévő címke, nem a négyzet maga
          const box = el.closest('label') || el;
          const r = box.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()}.${el.className || '-'} ${Math.round(r.height)}px`);
        });
        return out;
      });
      if (bad.length) throw new Error(`${hash}: ${bad.join(', ')}`);
    }
  });

  await check('a lenti navigáció a képernyőn belül marad', async (page) => {
    await login(page);
    const fits = await page.evaluate(() => {
      const nav = document.querySelector('#nav');
      if (!nav || nav.hidden) return true;
      const r = nav.getBoundingClientRect();
      return r.right <= window.innerWidth + 1 && r.left >= -1;
    });
    if (!fits) throw new Error('a navigáció kicsúszik a képernyőből');
  });
}

/* --------------------------------------------------------------------- futás */

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await startServer(PORT, root);
browser = await chromium.launch();

const profiles = [
  ['iPhone 13', devices['iPhone 13'], true],
  ['Pixel 7', devices['Pixel 7'], false],
  ['desktop', devices['Desktop Chrome'], false]
];

for (const [name, device, runFull] of profiles) {
  profileName = name;
  profileDevice = device;
  process.stdout.write(`\n${name}\n`);
  if (runFull) await fullSuite();
  await layoutSuite();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
process.stdout.write(`\n${results.length - failed.length}/${results.length} ellenőrzés rendben\n`);
if (failed.length) {
  process.stdout.write(`\n${failed.length} hibás:\n`);
  failed.forEach((f) => process.stdout.write(`  ✗ ${f.label}\n      ${f.detail}\n`));
  process.exitCode = 1;
}
