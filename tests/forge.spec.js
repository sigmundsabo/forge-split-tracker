import { test, expect } from '@playwright/test';

const DEMO = { email: 'demo@forge.hu', password: 'forge1234' };

async function login(page, who = DEMO) {
  await page.goto('/');
  await expect(page.getByTestId('login-submit')).toBeVisible();
  await page.getByTestId('login-email').fill(who.email);
  await page.getByTestId('login-password').fill(who.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('split-meta')).toBeVisible();
}

// Playwright minden tesztnek friss böngészőkontextust ad, így a localStorage
// üresen indul — nem kell törölni, és a teszten belüli navigációk megtartják.

test('a belépés nélküli látogató a login képernyőn landol', async ({ page }) => {
  await page.goto('/#/split');
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByTestId('login-submit')).toBeVisible();
});

test('rossz jelszó beszédes hibát ad, nem lép be', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-email').fill(DEMO.email);
  await page.getByTestId('login-password').fill('rosszjelszo');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toContainText('Nem talált ilyen fiókot');
  await expect(page.getByTestId('login-submit')).toBeVisible();
});

test('a demó fiókkal be lehet lépni, és a split 77 szettet mutat', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('split-meta')).toContainText('4 edzés · 29 gyakorlat · 77 szett');
  for (const id of ['upper', 'lower', 'anterior', 'posterior']) {
    await expect(page.getByTestId(`card-${id}`)).toBeVisible();
  }
});

test('a négy edzéskártya a saját naplózójára visz', async ({ page }) => {
  await login(page);
  const expected = { upper: 23, lower: 17, anterior: 18, posterior: 19 };
  for (const [id, sets] of Object.entries(expected)) {
    await page.getByTestId(`card-${id}`).click();
    await expect(page).toHaveURL(new RegExp(`#/workout/${id}$`));
    await expect(page.getByTestId('wo-meta')).toContainText(`${sets} szett`);
    await page.getByRole('link', { name: 'Vissza a splithez' }).click();
  }
});

test('nincs edzésidő-becslés és nincs naphoz kötés a felületen', async ({ page }) => {
  await login(page);
  const split = (await page.getByTestId('app').innerText()).toLowerCase();
  for (const word of ['heti terv', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'perc']) {
    expect(split).not.toContain(word);
  }
  await page.getByTestId('card-upper').click();
  const wo = (await page.getByTestId('app').innerText()).toLowerCase();
  expect(wo).not.toContain('heti terv');
  expect(wo).not.toMatch(/\d+\s*perc/);
});

test('szett rögzítése elindítja a pihenőt és számolja a kész szetteket', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();

  await page.locator('input[name="w_pullover_1"]').fill('50');
  await page.locator('input[name="r_pullover_1"]').fill('10');
  await page.locator('#d_pullover-1').check();

  await expect(page.getByTestId('wo-done')).toHaveText('1');
  await expect(page.getByTestId('rest')).toBeVisible();
  await expect(page.getByTestId('rest-time')).toHaveText(/^1:[23]\d$/);

  await page.getByRole('button', { name: 'Kihagy' }).click();
  await expect(page.getByTestId('rest')).toBeHidden();
});

test('a súly/ismétlés túllépése rekordjelet kap', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  // a pullover eddigi legjobbja 45 kg × 10
  await page.locator('input[name="w_pullover_2"]').fill('47.5');
  await page.locator('input[name="r_pullover_2"]').fill('9');
  await expect(page.locator('[data-pr="pullover-2"] [aria-label="Új rekord"]')).toBeVisible();
});

test('az „Előző” gomb beírja a múltkori súlyt és ismétlést', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  await page.getByTestId('prefill-chestpress').click();
  await expect(page.locator('input[name="w_chestpress_1"]')).toHaveValue('60');
  await expect(page.locator('input[name="r_chestpress_1"]')).toHaveValue('10');
});

test('a szett száma jelölhető: normál → B → D → K → normál', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  const btn = page.getByTestId('type-pullover-1');
  await expect(btn).toHaveText('1');
  for (const [label, name] of [['B', 'bemelegítő'], ['D', 'drop'], ['K', 'kudarcig']]) {
    await btn.click();
    await expect(btn).toHaveText(label);
    await expect(btn).toHaveAttribute('aria-label', new RegExp(name));
  }
  await btn.click();
  await expect(btn).toHaveText('1');
});

test('a bemelegítő nem számít effektív sorozatba és nem lehet rekord', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  await page.locator('input[name="w_pullover_1"]').fill('50');
  await page.locator('input[name="r_pullover_1"]').fill('10');
  await page.locator('#d_pullover-1').check();

  await expect(page.getByTestId('wo-done')).toHaveText('1');
  await expect(page.getByTestId('wo-eff')).toHaveText('1');
  await expect(page.locator('[data-pr="pullover-1"] [aria-label="Új rekord"]')).toBeVisible();

  await page.getByTestId('type-pullover-1').click(); // → bemelegítő
  await expect(page.getByTestId('wo-done')).toHaveText('1');
  await expect(page.getByTestId('wo-eff')).toHaveText('0');
  await expect(page.locator('[data-pr="pullover-1"] [aria-label="Új rekord"]')).toBeHidden();
});

test('az összegző kiírja az effektív sorozatot és a bemelegítőt', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  await page.locator('input[name="w_pullover_1"]').fill('50');
  await page.locator('input[name="r_pullover_1"]').fill('10');
  await page.locator('#d_pullover-1').check();
  await page.getByRole('button', { name: 'Kihagy' }).click();

  await page.locator('input[name="w_pullover_2"]').fill('20');
  await page.locator('input[name="r_pullover_2"]').fill('8');
  await page.getByTestId('type-pullover-2').click(); // → bemelegítő
  await page.locator('#d_pullover-2').check();
  await page.getByRole('button', { name: 'Kihagy' }).click();

  await page.getByTestId('finish').click();
  await expect(page).toHaveURL(/#\/summary\/upper$/);
  await expect(page.getByTestId('sum-sets')).toHaveText('2');
  await expect(page.getByTestId('sum-prs')).toHaveText('1');
  await expect(page.getByTestId('sum-eff')).toContainText('1 effektív sorozat');
  await expect(page.getByTestId('sum-eff')).toContainText('1 bemelegítő nem számít bele');
});

test('progressziójavaslat jelenik meg, ha a sáv teteje megvolt', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();
  // a lateral raise múltkor 3×10 volt 10 kg-mal, a sáv 8–10 → +2,5 kg
  await expect(page.getByTestId('sugg-lateral')).toContainText('12,5 kg');
  await expect(page.getByTestId('sugg-lateral')).toContainText('mind a 3 szett 10 ismétlés');
  await expect(page.getByTestId('sugg-pullover')).toBeHidden();

  await page.getByTestId('sugg-fill-lateral').click();
  await expect(page.locator('input[name="w_lateral_1"]')).toHaveValue('12.5');
  await expect(page.locator('input[name="r_lateral_1"]')).toHaveValue('8');
  await expect(page.locator('input[name="w_lateral_3"]')).toHaveValue('12.5');
});

test('a javaslat kikapcsolható a profilban', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  await page.getByTestId('pf-progression').uncheck();
  await page.getByTestId('pf-save').click();
  await expect(page.getByTestId('pf-status')).toHaveText('Mentve.');

  await page.getByTestId('nav-split').click();
  await page.getByTestId('card-upper').click();
  await expect(page.getByTestId('sugg-lateral')).toBeHidden();
});

test('az új beállítások megmaradnak mentés után', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  for (const id of ['pf-alert', 'pf-wake', 'pf-progression']) {
    await expect(page.getByTestId(id)).toBeChecked();
  }
  await page.getByTestId('pf-alert').uncheck();
  await page.getByTestId('pf-wake').uncheck();
  await page.getByTestId('pf-save').click();
  await expect(page.getByTestId('pf-status')).toHaveText('Mentve.');

  await page.goto('/#/profile');
  await expect(page.getByTestId('pf-alert')).not.toBeChecked();
  await expect(page.getByTestId('pf-wake')).not.toBeChecked();
  await expect(page.getByTestId('pf-progression')).toBeChecked();
});

test('a service worker aktiválódik, és offline is elindul az app', async ({ page, context }) => {
  await login(page);
  const active = await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready.then((r) => Boolean(r && (r.active || r.installing))),
    new Promise((res) => setTimeout(() => res(false), 8000))
  ]));
  expect(active, 'a service worker nem aktiválódott').toBe(true);
  await page.waitForTimeout(700);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('split-meta')).toContainText('77 szett');
  await page.getByTestId('card-upper').click();
  await expect(page.getByTestId('wo-meta')).toContainText('23 szett');
  await context.setOffline(false);
});

test('az edzés befejezése összegzőt ad, és a rekord megjelenik', async ({ page }) => {
  await login(page);
  await page.getByTestId('card-upper').click();

  await page.locator('input[name="w_pullover_1"]').fill('50');
  await page.locator('input[name="r_pullover_1"]').fill('10');
  await page.locator('#d_pullover-1').check();
  await page.getByRole('button', { name: 'Kihagy' }).click();

  await page.getByTestId('finish').click();
  await expect(page).toHaveURL(/#\/summary\/upper$/);
  await expect(page.getByTestId('sum-sets')).toHaveText('1');
  await expect(page.getByTestId('sum-prs')).toHaveText('1');
  await expect(page.getByText('Pullover').first()).toBeVisible();
});

test('az izomcsoport-tracker radart és tíz számot mutat, cél alattit megjelöl', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-muscles').click();
  await expect(page.getByRole('img', { name: 'Izomcsoportok radardiagramja' })).toBeVisible();

  await expect(page.getByTestId('mg-mell')).toContainText('13,5');
  await expect(page.getByTestId('mg-vall')).toContainText('15,5');
  await expect(page.getByTestId('mg-hat')).toContainText('11');
  // a has 3 effektív sorozat: a 10-es sáv alatt, szín mellett ikonnal is jelölve
  await expect(page.getByTestId('mg-has').getByLabel('cél alatt')).toBeVisible();

  await page.getByTestId('range-30').click();
  await expect(page.getByTestId('range-30')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('mg-mell')).toContainText('58,1');
});

test('az össz súly nem nyúl az izomcsoport-számokhoz', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-muscles').click();
  const before = await page.getByTestId('mg-mell').innerText();

  await page.getByTestId('nav-weight').click();
  await page.getByTestId('total-input').fill('3000');
  // a hu-HU ezres elválasztó nem sima szóköz, ezért reguláris kifejezés
  await expect(page.getByTestId('preview')).toHaveText(/^15\s400$/);
  await page.getByTestId('total-save').click();
  await expect(page).toHaveURL(/#\/split$/);
  await expect(page.getByTestId('to-weight')).toContainText(/15\s400/);

  await page.getByTestId('nav-muscles').click();
  await expect(page.getByTestId('mg-mell')).toHaveText(before);
});

test('az össz súly nullát és üresét elutasít', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-weight').click();
  await page.getByTestId('total-save').click();
  await expect(page.getByTestId('total-error')).toContainText('nullánál nagyobb');
});

test('regisztráció után a saját fiókba lép be', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('to-signup').click();
  await page.getByTestId('su-name').fill('Teszt Elek');
  await page.getByTestId('su-email').fill('teszt@pelda.hu');
  await page.getByTestId('su-password').fill('rovid');
  await page.getByTestId('su-terms').check();
  await page.getByTestId('su-submit').click();
  await expect(page.getByTestId('su-error')).toContainText('legalább 8 karakter');

  await page.getByTestId('su-password').fill('nyolckarakter');
  await page.getByTestId('su-submit').click();
  await expect(page).toHaveURL(/#\/split$/);
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('pf-name')).toHaveText('Teszt Elek');
});

test('a profil ment, és a kg/lbs váltó átszámol', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('pf-weight')).toHaveValue('84.2');

  await page.getByTestId('pf-lbs').click();
  await expect(page.getByTestId('pf-weight')).toHaveValue('185.6');

  await page.getByTestId('pf-name-input').fill('Zsiga');
  await page.getByTestId('pf-save').click();
  await expect(page.getByTestId('pf-status')).toHaveText('Mentve.');

  await page.getByTestId('nav-split').click();
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('pf-name')).toHaveText('Zsiga');
  await expect(page.getByTestId('pf-lbs')).toHaveAttribute('aria-pressed', 'true');
});

test('a fiók törlése jelszót és beírt megerősítést kér', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  await page.getByTestId('to-delete').click();
  await expect(page).toHaveURL(/#\/delete$/);

  await expect(page.getByTestId('del-submit')).toBeDisabled();

  await page.getByTestId('del-phrase').fill('TORLES');
  await expect(page.getByTestId('del-hint')).toHaveText('Még nem egyezik.');
  await expect(page.getByTestId('del-submit')).toBeDisabled();

  await page.getByTestId('del-phrase').fill('TÖRLÉS');
  await expect(page.getByTestId('del-hint')).toHaveText('Megerősítve — a gomb aktív.');
  await expect(page.getByTestId('del-submit')).toBeEnabled();

  await page.getByTestId('del-password').fill('rosszjelszo');
  await page.getByTestId('del-submit').click();
  await expect(page.getByTestId('del-hint')).toHaveText('A jelszó nem egyezik.');
  await expect(page).toHaveURL(/#\/delete$/);
});

test('helyes jelszóval a fiók eltűnik, és nem lehet újra belépni', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  await page.getByTestId('to-delete').click();
  await page.getByTestId('del-phrase').fill('TÖRLÉS');
  await page.getByTestId('del-password').fill(DEMO.password);
  await page.getByTestId('del-submit').click();

  await expect(page).toHaveURL(/#\/login/);
  await expect(page.getByTestId('login-error')).toContainText('A fiók törölve');

  await page.getByTestId('login-email').fill(DEMO.email);
  await page.getByTestId('login-password').fill(DEMO.password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toContainText('Nem talált ilyen fiókot');
});

test('a „Mégsem” visszavisz a profilra törlés nélkül', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-profile').click();
  await page.getByTestId('to-delete').click();
  await page.getByTestId('del-cancel').click();
  await expect(page).toHaveURL(/#\/profile$/);
  await expect(page.getByTestId('pf-name')).toBeVisible();
});

test('telefonszélességen nincs vízszintes csúszás', async ({ page }) => {
  await login(page);
  for (const hash of ['#/split', '#/workout/posterior', '#/muscles', '#/weight', '#/profile', '#/delete']) {
    await page.goto(`/${hash}`);
    await page.waitForTimeout(80);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `vízszintes túlfolyás: ${hash}`).toBeLessThanOrEqual(1);
  }
});

test('minden érintőfelület legalább 44 px magas', async ({ page }) => {
  await login(page);
  for (const hash of ['#/split', '#/workout/upper', '#/muscles', '#/weight', '#/profile']) {
    await page.goto(`/${hash}`);
    const small = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('a, button, input, select').forEach((el) => {
        if (el.type === 'hidden' || el.closest('.sr')) return;
        // egy jelölőnégyzet érintőfelülete a körülötte lévő címke, nem a négyzet maga
        const box = el.closest('label') || el;
        const r = box.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.height < 43.5) bad.push(`${el.tagName.toLowerCase()}.${el.className || '-'} ${Math.round(r.height)}px`);
      });
      return bad;
    });
    expect(small, `kis érintőfelület: ${hash}`).toEqual([]);
  }
});

test('nincs konzolhiba a fő útvonalakon', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await login(page);
  for (const hash of ['#/split', '#/workout/upper', '#/workout/lower', '#/workout/anterior', '#/workout/posterior', '#/muscles', '#/weight', '#/profile', '#/delete']) {
    await page.goto(`/${hash}`);
    await page.waitForTimeout(60);
  }
  expect(errors).toEqual([]);
});
