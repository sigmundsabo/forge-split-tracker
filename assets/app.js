/* FORGE — edzés split tracker
   Minden adat a böngésző localStorage-ában marad; nincs szerver, nincs hálózati hívás.
   A jelszó SHA-256 + só formában tárolódik, de ez demó, nem valódi hitelesítés. */

import { WORKOUTS, MUSCLES, TARGET, byId, setCount, workoutContribution, weeklyContribution } from './data.js';

/* ---------------------------------------------------------------- util */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const app = $('#app');
const navEl = $('#nav');

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hu = (n, digits = 1) =>
  Number(n).toLocaleString('hu-HU', { maximumFractionDigits: digits });

const KG_PER_LB = 2.2046226218;

async function digest(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // nem biztonságos környezet (pl. file://): csak hogy a demó működjön
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) | 0;
  return 'plain-' + h;
}

const salt = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');

/* ---------------------------------------------------------------- icons */

const I = {
  back: '<svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 4 5.5 8l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  logo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5v5M7.2 7v10M16.8 7v10M20 9.5v5M7.2 12h9.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  split: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.6" y="2.6" width="6.2" height="6.2" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11.2" y="2.6" width="6.2" height="6.2" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="2.6" y="11.2" width="6.2" height="6.2" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11.2" y="11.2" width="6.2" height="6.2" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  radar: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.4 17 7l-2.7 8.2H5.7L3 7l7-4.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 10v5.2M3 7l7 3 7-3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" opacity=".5"/></svg>',
  scale: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.6" width="14" height="12.4" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M13.1 12.4a3.2 3.2 0 1 0-6.2 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="m10 11.8-1.4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  user: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="6.6" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M3.8 17c.6-3.3 3.1-5 6.2-5s5.6 1.7 6.2 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8 9.9 5.7l4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8Z" fill="currentColor"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2.4v7.2m0 0L3 6.8m3 2.8 3-2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 9.6V2.4m0 0L3 5.2M6 2.4l3 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.4v9.2M3.4 8h9.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.4 5.2h9.2l-.7 8a1.6 1.6 0 0 1-1.6 1.45H5.7A1.6 1.6 0 0 1 4.1 13.2l-.7-8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 5.2h12M6.3 5.2V3.5A1.2 1.2 0 0 1 7.5 2.3h1a1.2 1.2 0 0 1 1.2 1.2v1.7M6.8 8v4M9.2 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  dl: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.4v7.4m0 0 3-2.9m-3 2.9L5 6.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.6 11.6v.8a1.6 1.6 0 0 0 1.6 1.6h7.6a1.6 1.6 0 0 0 1.6-1.6v-.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8 15 14H1L8 1.8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.9" r=".95" fill="currentColor"/></svg>',
  undo: '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2.2A4.8 4.8 0 1 1 2.2 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M2.2 4.2v2.9h2.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  muscle: {
    mell: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.6 3.4c1.3-.9 2.6-.6 4.4.6 1.8-1.2 3.1-1.5 4.4-.6-.3 3-1.9 4.6-4.4 5.2C3.5 8 1.9 6.4 1.6 3.4Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>',
    hat: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.6 10.2 4 9 10H3L1.8 4 6 1.6Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 4.4v5.4" stroke="currentColor" stroke-width="1" opacity=".55"/></svg>',
    vall: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="4.4" r="2.6" stroke="currentColor" stroke-width="1.1"/><path d="M2 10.4c.6-2 2-3 4-3s3.4 1 4 3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    tricepsz: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3.4 1.8v4.4a2.6 2.6 0 0 0 5.2 0V1.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M4.6 8.8h2.8v1.6H4.6z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>',
    bicepsz: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 8.4c0-3 1.6-4.8 4-4.8 1.8 0 3 1 3.4 2.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="8.6" cy="8.2" r="2" stroke="currentColor" stroke-width="1.1"/></svg>',
    comb: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4 1.6v4a3 3 0 0 0 .8 2l1.4 1.6M8 1.6v4a3 3 0 0 1-.8 2L5.8 9.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    combhajlito: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 2.2c3.2 0 5 1.6 5 4.2 0 1.8-.9 3-2.4 3.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    vadli: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M5.6 1.8c2 0 3.2 1.4 3.2 3.4 0 1.6-.8 2.6-.8 4.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M3.2 10.2h5.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
    has: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><rect x="3" y="1.8" width="6" height="8.4" rx="2" stroke="currentColor" stroke-width="1.1"/><path d="M6 1.8v8.4M3 4.6h6M3 7.4h6" stroke="currentColor" stroke-width=".9" opacity=".55"/></svg>',
    trapez: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.8 3.6 6 1.8l4.2 1.8L6 10.2 1.8 3.6Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>'
  }
};

const mIcon = (m) => I.muscle[m] || I.muscle.vall;

/* ---------------------------------------------------------------- store */

const K_USERS = 'forge.users.v1';
const K_SESSION = 'forge.session.v1';
const K_DATA = (email) => `forge.data.v1:${email}`;

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};
const drop = (key) => { try { localStorage.removeItem(key); } catch { /* ignore */ } };

const DEFAULT_PREFS = {
  autoRest: true,
  prBadges: true,
  prefill: true,
  progression: true,
  alert: true,
  wake: true
};

const blankData = () => ({ sessions: [], totals: [], prefs: { ...DEFAULT_PREFS } });

/* a régebbi mentésekben még nincs minden beállítás — az alapértékekkel töltjük fel */
const prefsOf = (data) => ({ ...DEFAULT_PREFS, ...(data.prefs || {}) });

const store = {
  users: () => read(K_USERS, {}),
  user(email) { return this.users()[email] || null; },
  saveUser(email, patch) {
    const users = this.users();
    users[email] = { ...(users[email] || {}), ...patch };
    write(K_USERS, users);
  },
  current() {
    const email = read(K_SESSION, null);
    if (!email) return null;
    const u = this.user(email);
    return u ? { email, ...u } : null;
  },
  login(email) { write(K_SESSION, email); },
  logout() { drop(K_SESSION); },
  data(email) { return read(K_DATA(email), blankData()); },
  saveData(email, data) { write(K_DATA(email), data); },
  wipe(email) {
    const users = this.users();
    delete users[email];
    write(K_USERS, users);
    drop(K_DATA(email));
    this.logout();
  }
};

/* demó fiók, hogy a login azonnal kipróbálható legyen */
async function seedDemo() {
  if (store.user('demo@forge.hu')) return;
  const s = salt();
  store.saveUser('demo@forge.hu', {
    name: 'Zsigmond',
    salt: s,
    hash: await digest(s + 'forge1234'),
    bodyWeight: 84.2,
    unit: 'kg',
    joined: '2026-09-06'
  });
  const d = blankData();
  d.totals = [{ kg: 12400, on: '2026-11-01', source: 'korabbi' }];
  store.saveData('demo@forge.hu', d);
}

/* ---------------------------------------------------------------- units */

const unitOf = (u) => (u?.unit === 'lbs' ? 'lbs' : 'kg');
const toDisp = (kg, unit) => (unit === 'lbs' ? Math.round(kg * KG_PER_LB * 10) / 10 : kg);
const toKg = (val, unit) => (unit === 'lbs' ? Math.round((val / KG_PER_LB) * 10) / 10 : val);

/* ------------------------------------------------- szettípusok és előzmény */

/* 'n' normál · 'b' bemelegítő · 'd' drop · 'k' kudarcig
   A bemelegítő nem számít effektív sorozatba, és nem lehet rekord sem. */
const SET_TYPES = ['n', 'b', 'd', 'k'];
const TYPE_LABEL = { n: '', b: 'B', d: 'D', k: 'K' };
const TYPE_NAME = { n: 'normál', b: 'bemelegítő', d: 'drop', k: 'kudarcig' };

const isWarmup = (set) => set.t === 'b';
const counts = (set) => set.done && !isWarmup(set);

/* egy gyakorlat eddigi legjobbja: a demó `prev` és a mentett edzések közül */
function bestFor(data, workoutId, exId, fallbackPrev) {
  let best = { w: 0, r: 0 };
  fallbackPrev.forEach(([w, r]) => {
    if (w > best.w || (w === best.w && r > best.r)) best = { w, r };
  });
  data.sessions
    .filter((s) => s.workout === workoutId)
    .forEach((s) => (s.sets || []).forEach((set) => {
      if (set.ex !== exId || !counts(set)) return;
      if (set.w > best.w || (set.w === best.w && set.r > best.r)) best = { w: set.w, r: set.r };
    }));
  return best;
}

/* legutóbbi mentett szettek egy gyakorlathoz, különben a demó `prev`.
   A bemelegítők kimaradnak: nem azokhoz képest progresszálunk. */
function lastFor(data, workoutId, exId, fallbackPrev) {
  const prior = data.sessions
    .filter((s) => s.workout === workoutId && (s.sets || []).some((x) => x.ex === exId && counts(x)))
    .slice(-1)[0];
  if (!prior) return fallbackPrev;
  const rows = prior.sets.filter((x) => x.ex === exId && counts(x)).map((x) => [x.w, x.r]);
  return rows.length ? rows : fallbackPrev;
}

/* ------------------------------------------------------ progressziójavaslat */

/* '3×8–10' → { sets: 3, min: 8, max: 10 } */
function repRange(scheme) {
  const m = /(\d+)\s*×\s*(\d+)(?:\s*[–-]\s*(\d+))?/.exec(scheme || '');
  if (!m) return null;
  return { sets: Number(m[1]), min: Number(m[2]), max: Number(m[3] || m[2]) };
}

/* Dupla progresszió: ha múltkor minden szett elérte az ismétléssáv felső
   értékét, legyen +2,5 kg a sáv alsó értékénél. */
const STEP_KG = 2.5;

function suggestFor(data, workoutId, ex) {
  const range = repRange(ex.scheme);
  if (!range) return null;
  const last = lastFor(data, workoutId, ex.id, ex.prev);
  if (!last.length) return null;
  if (!last.every(([, reps]) => reps >= range.max)) return null;
  const top = Math.max(...last.map(([kg]) => kg));
  if (!Number.isFinite(top) || top <= 0) return null;
  return { kg: top + STEP_KG, reps: range.min, done: last.length, hit: range.max };
}

/* ------------------------------------------------- rezgés, hang, kijelző */

/* Edzés közben a telefon a padon vagy a zsebben van: a néma visszaszámláló
   használhatatlan. A hangot csak felhasználói koppintás után lehet elindítani,
   ezért a szett pipálásakor nyitjuk meg az AudioContextet. */
const buzz = {
  audio: null,

  prime() {
    if (this.audio) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try { this.audio = new Ctor(); } catch { this.audio = null; }
  },

  vibrate(pattern) {
    try { navigator.vibrate?.(pattern); } catch { /* nem támogatott */ }
  },

  /* rövid visszajelzés a szett pipálásakor */
  tick(on) {
    if (!on) return;
    this.prime();
    this.vibrate(12);
  },

  /* a pihenő végén: három rövid hang és egy rezgésminta */
  async ring(on) {
    if (!on) return;
    this.vibrate([130, 70, 130, 70, 130]);
    const ctx = this.audio;
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      [0, 0.2, 0.4].forEach((at, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = i === 2 ? 1046 : 784;
        const t = ctx.currentTime + at;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch { /* a hang nem létfontosságú */ }
  }
};

/* A kijelző ne aludjon el két szett között. A rendszer bármikor elveheti,
   ezért a lap visszatérésekor újra kérjük. */
let wakeLock = null;
let wakeWanted = false;

async function keepAwake(on) {
  wakeWanted = Boolean(on);
  if (!wakeWanted || !('wakeLock' in navigator)) return;
  if (wakeLock && !wakeLock.released) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { wakeLock = null; }
}

function letSleep() {
  wakeWanted = false;
  try { wakeLock?.release(); } catch { /* már elengedte */ }
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeWanted) keepAwake(true);
});

/* ------------------------------------------------------------------ nav */

function renderNav(active) {
  if (!active) { navEl.hidden = true; navEl.innerHTML = ''; return; }
  const items = [
    ['split', '#/split', I.split, 'Split'],
    ['muscles', '#/muscles', I.radar, 'Izmok'],
    ['weight', '#/weight', I.scale, 'Súly'],
    ['profile', '#/profile', I.user, 'Profil']
  ];
  navEl.hidden = false;
  navEl.innerHTML = items
    .map(([id, href, icon, label]) =>
      `<a href="${href}" data-testid="nav-${id}"${id === active ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`)
    .join('');
}

/* --------------------------------------------------------------- screens */

const views = {};

/* ---- belépés ---- */

views.login = () => {
  app.innerHTML = `
  <div class="view view--auth">
    <div style="display:flex;align-items:center;gap:var(--s2)">
      <span aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:13px;background:radial-gradient(120% 120% at 30% 0%, rgba(238,122,99,.95), rgba(221,130,150,.75));color:var(--upper-ink)">${I.logo}</span>
      <span style="font-family:var(--display);font-size:var(--fs-h2);font-weight:700;letter-spacing:.1em">FORGE</span>
    </div>

    <div>
      <h1 class="display">Üdv újra</h1>
      <p class="sub" style="margin-top:var(--s2)">Lépj be, és ott folytatod, ahol abbahagytad — a súlyaid és a rekordjaid megmaradnak.</p>
    </div>

    <form id="f" novalidate style="display:flex;flex-direction:column;gap:var(--s3)">
      <div>
        <label class="lbl" for="email">E-mail</label>
        <input class="fld" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="nev@pelda.hu" data-testid="login-email">
      </div>
      <div>
        <label class="lbl" for="password">Jelszó</label>
        <input class="fld" id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" data-testid="login-password">
      </div>
      <p class="err" role="alert" aria-live="polite" data-testid="login-error"></p>
      <button class="cta" type="submit" data-testid="login-submit">Belépés</button>
    </form>

    <div class="notice">
      <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9px;background:rgba(138,143,224,.18);color:#9FA4E8">${I.undo}</span>
      <p>Kipróbálnád? <strong style="color:var(--text);font-weight:600">demo@forge.hu</strong> / <strong style="color:var(--text);font-weight:600">forge1234</strong>. Minden adat a telefonodon marad.</p>
    </div>

    <p style="text-align:center;font-size:var(--fs-label);color:var(--dim)">Még nincs fiókod? <a href="#/signup" style="font-weight:600" data-testid="to-signup">Regisztrálj</a></p>
  </div>`;

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#email').value.trim().toLowerCase();
    const pw = $('#password').value;
    const err = $('[data-testid="login-error"]');
    if (!email || !pw) { err.textContent = 'Add meg az e-mailt és a jelszót.'; return; }
    const u = store.user(email);
    if (!u || (await digest(u.salt + pw)) !== u.hash) {
      err.textContent = 'Nem talált ilyen fiókot ezzel a jelszóval. Ellenőrizd, vagy regisztrálj.';
      return;
    }
    store.login(email);
    go('#/split');
  });
};

/* ---- regisztráció ---- */

views.signup = () => {
  app.innerHTML = `
  <div class="view">
    <div class="topbar">
      <a class="icon-btn" href="#/login" aria-label="Vissza a belépéshez">${I.back}</a>
      <span class="eyebrow" style="flex:1">Új fiók</span>
    </div>

    <div>
      <h1 class="display">Fiók létrehozása</h1>
      <p class="sub" style="margin-top:var(--s2)">Pár adat, és a naplód bármikor visszanyitható.</p>
    </div>

    <form id="f" novalidate style="display:flex;flex-direction:column;gap:var(--s3)">
      <div>
        <label class="lbl" for="name">Név</label>
        <input class="fld" id="name" name="display_name" type="text" autocomplete="name" placeholder="Ahogy szólítsunk" data-testid="su-name">
      </div>
      <div>
        <label class="lbl" for="email">E-mail</label>
        <input class="fld" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="nev@pelda.hu" data-testid="su-email">
      </div>
      <div>
        <label class="lbl" for="password">Jelszó</label>
        <input class="fld" id="password" name="password" type="password" autocomplete="new-password" placeholder="Legalább 8 karakter" data-testid="su-password">
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s3)">
        <div>
          <label class="lbl" for="bw">Testsúly</label>
          <input class="fld" id="bw" name="body_weight" type="number" inputmode="decimal" step="0.1" min="0" placeholder="84,2" data-testid="su-weight">
        </div>
        <div>
          <span class="lbl" id="unit-lbl">Mértékegység</span>
          <div class="toggle" role="group" aria-labelledby="unit-lbl">
            <button class="chip" type="button" data-unit="kg" aria-pressed="true" data-testid="su-kg">kg</button>
            <button class="chip" type="button" data-unit="lbs" aria-pressed="false" data-testid="su-lbs">lbs</button>
          </div>
        </div>
      </div>
      <label for="terms" style="display:flex;gap:var(--s3);font-size:var(--fs-label);color:var(--dim);cursor:pointer">
        <input class="chk" id="terms" name="accept_terms" type="checkbox" data-testid="su-terms">
        <span>Elfogadom, hogy az adataim ezen az eszközön tárolódnak.</span>
      </label>
      <p class="err" role="alert" aria-live="polite" data-testid="su-error"></p>
      <button class="cta" type="submit" data-testid="su-submit">Fiók létrehozása</button>
    </form>

    <p style="text-align:center;font-size:var(--fs-label);color:var(--dim)">Van már fiókod? <a href="#/login" style="font-weight:600">Lépj be</a></p>
  </div>`;

  let unit = 'kg';
  $$('[data-unit]').forEach((b) => b.addEventListener('click', () => {
    unit = b.dataset.unit;
    $$('[data-unit]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.unit === unit)));
  }));

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('[data-testid="su-error"]');
    const name = $('#name').value.trim();
    const email = $('#email').value.trim().toLowerCase();
    const pw = $('#password').value;
    const bw = parseFloat($('#bw').value);
    if (!name) { err.textContent = 'Add meg a neved.'; $('#name').focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Ez az e-mail nem tűnik érvényesnek.'; $('#email').focus(); return; }
    if (pw.length < 8) { err.textContent = 'A jelszó legyen legalább 8 karakter.'; $('#password').focus(); return; }
    if (!$('#terms').checked) { err.textContent = 'A folytatáshoz fogadd el a tárolási tájékoztatót.'; $('#terms').focus(); return; }
    if (store.user(email)) { err.textContent = 'Ehhez az e-mailhez már tartozik fiók. Lépj be.'; return; }
    const s = salt();
    store.saveUser(email, {
      name,
      salt: s,
      hash: await digest(s + pw),
      bodyWeight: Number.isFinite(bw) ? toKg(bw, unit) : null,
      unit,
      joined: new Date().toISOString().slice(0, 10)
    });
    store.saveData(email, blankData());
    store.login(email);
    go('#/split');
  });
};

/* ---- split ---- */

views.split = (u) => {
  const data = store.data(u.email);
  const unit = unitOf(u);
  const exTotal = WORKOUTS.reduce((n, w) => n + w.exercises.length, 0);
  const setsTotal = WORKOUTS.reduce((n, w) => n + setCount(w), 0);
  const lastTotal = data.totals.reduce((n, t) => n + t.kg, 0);

  const cards = WORKOUTS.map((w) => {
    const contrib = workoutContribution(w);
    const muscles = Object.entries(contrib).sort((a, b) => b[1] - a[1]);
    const shown = muscles.slice(0, 4);
    const rest = muscles.length - shown.length;
    const doneCount = data.sessions.filter((s) => s.workout === w.id).length;
    return `
    <a class="glow" href="#/workout/${w.id}" style="--tint:${w.hex}" data-testid="card-${w.id}">
      <h2 class="display" style="font-size:var(--fs-display);text-transform:uppercase">${w.name}</h2>
      <p class="num" style="margin-top:var(--s2);font-size:var(--fs-label);color:rgba(255,255,255,.76)">${setCount(w)} szett · ${w.exercises.length} gyakorlat${doneCount ? ` · ${doneCount}× elvégezve` : ''}</p>
      <div class="pills" style="margin-top:var(--s4)">
        ${shown.map(([m]) => `<span class="pill">${mIcon(m)}${MUSCLES[m]}</span>`).join('')}
        ${rest > 0 ? `<span class="pill">+${rest}</span>` : ''}
      </div>
    </a>`;
  }).join('');

  app.innerHTML = `
  <div class="view view--nav">
    <div class="topbar">
      <a class="icon-btn" href="#/profile" aria-label="Profil">${I.user}</a>
      <h1 class="h1">Split</h1>
      <a class="icon-btn" href="#/muscles" aria-label="Izomcsoportok">${I.radar}</a>
    </div>
    <p class="meta num" data-testid="split-meta">${WORKOUTS.length} edzés · ${exTotal} gyakorlat · ${setsTotal} szett</p>

    <div style="display:flex;flex-direction:column;gap:var(--s3)">${cards}</div>

    <a class="ghost" href="#/weight" data-testid="to-weight">${I.plus} Össz súly hozzáadása${lastTotal ? ` · ${hu(lastTotal, 0)} ${unit === 'lbs' ? 'lbs' : 'kg'}` : ''}</a>
  </div>`;
  renderNav('split');
};

/* ---- naplózás ---- */

views.workout = (u, id) => {
  const w = byId(id);
  if (!w) { go('#/split'); return; }
  const data = store.data(u.email);
  const prefs = prefsOf(data);
  const unit = unitOf(u);
  const log = {}; // key -> { w, r, done, t }
  let rest = 0, restTotal = 0, ticker = null;

  const key = (exId, i) => `${exId}-${i + 1}`;

  const body = w.exercises.map((ex, i) => {
    const last = lastFor(data, w.id, ex.id, ex.prev);
    const sugg = prefs.progression ? suggestFor(data, w.id, ex) : null;
    const rows = ex.prev.map((_, si) => {
      const k = key(ex.id, si);
      const p = last[si] || last[last.length - 1] || [0, 0];
      return `
      <div class="set" data-row="${k}">
        <button class="set__no" type="button" data-t="n" data-type-btn="${k}"
                aria-label="${esc(ex.name)} ${si + 1}. szett típusa: normál. Koppints a jelöléshez."
                data-testid="type-${k}">${si + 1}</button>
        <input class="set__in" type="number" inputmode="decimal" step="0.5" min="0"
               name="w_${ex.id}_${si + 1}" data-k="${k}" data-f="w"
               placeholder="${hu(toDisp(p[0], unit))}"
               aria-label="${esc(ex.name)} ${si + 1}. szett súly (${unit})">
        <input class="set__in" type="number" inputmode="numeric" step="1" min="0"
               name="r_${ex.id}_${si + 1}" data-k="${k}" data-f="r"
               placeholder="${p[1]}"
               aria-label="${esc(ex.name)} ${si + 1}. szett ismétlés">
        <span class="set__pr" data-pr="${k}"></span>
        <label class="done" for="d_${k}">
          <span class="sr">${esc(ex.name)} ${si + 1}. szett kész</span>
          <input class="chk" id="d_${k}" name="d_${ex.id}_${si + 1}" type="checkbox" data-k="${k}" data-f="done">
        </label>
      </div>`;
    }).join('');

    return `
    <section class="ex" data-ex="${ex.id}">
      <div class="ex__head">
        <span class="ex__idx num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div style="flex:1;min-width:0">
          <h2 class="h2">${esc(ex.name)}</h2>
          <p class="meta num" style="margin-top:2px">${ex.scheme} · ${ex.rest} s pihenő</p>
        </div>
        ${prefs.prefill ? `<button class="chip" type="button" data-prefill="${ex.id}" data-testid="prefill-${ex.id}">Előző</button>` : ''}
      </div>
      ${sugg ? `
      <div class="sugg" data-testid="sugg-${ex.id}">
        <span aria-hidden="true" style="flex:none;color:var(--accent)">${I.up}</span>
        <p>Javaslat <strong class="num">${hu(toDisp(sugg.kg, unit))} ${unit}</strong> — múltkor mind a ${sugg.done} szett ${sugg.hit} ismétlés volt.</p>
        <button class="chip" type="button" data-sugg="${ex.id}" data-testid="sugg-fill-${ex.id}">Kitölt</button>
      </div>` : ''}
      <div class="set-head" aria-hidden="true">
        <span>#</span><span>${unit}</span><span>ism.</span><span></span><span></span>
      </div>
      ${rows}
    </section>`;
  }).join('');

  app.innerHTML = `
  <div class="view view--nav" style="--accent:${w.hex};--accent-ink:var(--${w.id}-ink)">
    <div class="topbar">
      <a class="icon-btn" href="#/split" aria-label="Vissza a splithez">${I.back}</a>
      <span class="eyebrow" style="flex:1;text-align:right;color:${w.hex}">${esc(w.eyebrow)}</span>
    </div>

    <div>
      <h1 class="display" style="text-transform:uppercase">${w.name}</h1>
      <p class="meta num" style="margin-top:var(--s2)" data-testid="wo-meta">${setCount(w)} szett · <span data-testid="wo-done">0</span> kész · <span data-testid="wo-eff">0</span> effektív</p>
    </div>

    <p class="legend">
      <span>A szett számára koppintva jelölhetsz:</span>
      <span><b>B</b> bemelegítő</span>
      <span><b>D</b> drop</span>
      <span><b>K</b> kudarcig</span>
      <span>A bemelegítő nem számít effektív sorozatba, és nem lehet rekord.</span>
    </p>

    <div style="display:flex;flex-direction:column;gap:var(--s3)">${body}</div>

    <div class="rest" data-testid="rest" hidden>
      <span class="rest__time" data-testid="rest-time" aria-live="off">0:00</span>
      <span class="rest__bar"><span class="rest__fill" data-fill style="width:100%"></span></span>
      <button class="chip" type="button" data-skip>Kihagy</button>
    </div>
    <p class="sr" role="status" aria-live="polite" data-testid="rest-sr"></p>

    <button class="cta" type="button" data-finish data-testid="finish">Edzés befejezése</button>
  </div>`;
  renderNav(null);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const restBox = $('[data-testid="rest"]');

  function paintRest() {
    if (rest <= 0) {
      restBox.hidden = true;
      if (ticker) { clearInterval(ticker); ticker = null; }
      return;
    }
    restBox.hidden = false;
    $('[data-testid="rest-time"]').textContent = fmt(rest);
    $('[data-fill]').style.width = `${(rest / restTotal) * 100}%`;
  }

  function startRest(seconds) {
    rest = seconds; restTotal = seconds;
    paintRest();
    $('[data-testid="rest-sr"]').textContent = `Pihenő elindult: ${seconds} másodperc.`;
    if (ticker) clearInterval(ticker);
    ticker = setInterval(() => {
      rest -= 1;
      if (rest <= 0) {
        $('[data-testid="rest-sr"]').textContent = 'Pihenő letelt.';
        buzz.ring(prefs.alert);
      }
      paintRest();
    }, 1000);
  }

  $('[data-skip]').addEventListener('click', () => { rest = 0; paintRest(); });

  function cell(k) { return { ...{ w: NaN, r: NaN, done: false, t: 'n' }, ...(log[k] || {}) }; }

  function paintPR(exId, si) {
    const ex = w.exercises.find((x) => x.id === exId);
    const k = key(exId, si);
    const c = cell(k);
    const slot = $(`[data-pr="${k}"]`);
    if (!slot) return;
    const best = bestFor(data, w.id, exId, ex.prev);
    const kg = toKg(c.w, unit);
    // bemelegítő soha nem rekord
    const isPR = prefs.prBadges && c.t !== 'b' && Number.isFinite(kg) && Number.isFinite(c.r) &&
      (kg > best.w || (kg === best.w && c.r > best.r));
    slot.innerHTML = isPR ? `<span title="Új rekord" aria-label="Új rekord">${I.star}</span>` : '';
  }

  function countDone() {
    const all = Object.values(log);
    $('[data-testid="wo-done"]').textContent = String(all.filter((x) => x.done).length);
    $('[data-testid="wo-eff"]').textContent = String(all.filter((x) => x.done && x.t !== 'b').length);
  }

  // a view gyökerére kötünk, nem az #app-ra: újrarendereléskor a listener is eltűnik
  const root = app.firstElementChild;

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset.k || t.dataset.f === 'done') return;
    const k = t.dataset.k;
    log[k] = { ...cell(k), [t.dataset.f]: parseFloat(t.value) };
    const [exId, n] = [k.slice(0, k.lastIndexOf('-')), Number(k.slice(k.lastIndexOf('-') + 1))];
    paintPR(exId, n - 1);
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.f !== 'done') return;
    const k = t.dataset.k;
    const c = { ...cell(k), done: t.checked };
    log[k] = c;
    $(`[data-row="${k}"]`).classList.toggle('set--done', t.checked);
    countDone();
    if (!t.checked) return;
    buzz.tick(prefs.alert);
    if (prefs.autoRest) {
      const exId = k.slice(0, k.lastIndexOf('-'));
      const ex = w.exercises.find((x) => x.id === exId);
      // a bemelegítő után nem kell két perc
      if (ex) startRest(c.t === 'b' ? Math.min(60, ex.rest) : ex.rest);
    }
  });

  /* a szett száma egyben a típusjelölő: normál → B → D → K → normál */
  $$('[data-type-btn]').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.typeBtn;
    const c = cell(k);
    const next = SET_TYPES[(SET_TYPES.indexOf(c.t) + 1) % SET_TYPES.length];
    log[k] = { ...c, t: next };
    const no = Number(k.slice(k.lastIndexOf('-') + 1));
    btn.dataset.t = next;
    btn.textContent = next === 'n' ? String(no) : TYPE_LABEL[next];
    const exId = k.slice(0, k.lastIndexOf('-'));
    const ex = w.exercises.find((x) => x.id === exId);
    btn.setAttribute('aria-label',
      `${ex ? ex.name : ''} ${no}. szett típusa: ${TYPE_NAME[next]}. Koppints a jelöléshez.`);
    $(`[data-row="${k}"]`).classList.toggle('set--warmup', next === 'b');
    paintPR(exId, no - 1);
    countDone();
  }));

  function fill(exId, rows) {
    const ex = w.exercises.find((x) => x.id === exId);
    ex.prev.forEach((_, si) => {
      const p = rows[si] || rows[rows.length - 1];
      if (!p) return;
      const k = key(exId, si);
      const shown = toDisp(p[0], unit);
      $(`input[data-k="${k}"][data-f="w"]`).value = String(shown);
      $(`input[data-k="${k}"][data-f="r"]`).value = String(p[1]);
      log[k] = { ...cell(k), w: shown, r: p[1] };
      paintPR(exId, si);
    });
  }

  $$('[data-prefill]').forEach((btn) => btn.addEventListener('click', () => {
    const exId = btn.dataset.prefill;
    const ex = w.exercises.find((x) => x.id === exId);
    fill(exId, lastFor(data, w.id, exId, ex.prev));
  }));

  /* a javaslat a felső sávot adja alsó ismétlésszámmal */
  $$('[data-sugg]').forEach((btn) => btn.addEventListener('click', () => {
    const exId = btn.dataset.sugg;
    const ex = w.exercises.find((x) => x.id === exId);
    const s = suggestFor(data, w.id, ex);
    if (!s) return;
    fill(exId, ex.prev.map(() => [s.kg, s.reps]));
  }));

  keepAwake(prefs.wake);

  $('[data-finish]').addEventListener('click', () => {
    if (ticker) clearInterval(ticker);
    const sets = [];
    Object.entries(log).forEach(([k, v]) => {
      if (!v.done || !Number.isFinite(v.w) || !Number.isFinite(v.r)) return;
      sets.push({
        ex: k.slice(0, k.lastIndexOf('-')),
        n: Number(k.slice(k.lastIndexOf('-') + 1)),
        w: toKg(v.w, unit),
        r: v.r,
        t: v.t || 'n',
        done: true
      });
    });
    const prs = [];
    sets.filter((s) => s.t !== 'b').forEach((s) => {
      const ex = w.exercises.find((x) => x.id === s.ex);
      const best = bestFor(data, w.id, s.ex, ex.prev);
      if (s.w > best.w || (s.w === best.w && s.r > best.r)) {
        prs.push({ ex: ex.name, w: s.w, r: s.r, prevW: best.w, prevR: best.r });
      }
    });
    const fresh = store.data(u.email);
    fresh.sessions.push({
      id: `${w.id}-${Date.now()}`,
      workout: w.id,
      on: new Date().toISOString(),
      sets,
      prs
    });
    store.saveData(u.email, fresh);
    go(`#/summary/${w.id}`);
  });
};

/* ---- összegzés ---- */

views.summary = (u, id) => {
  const w = byId(id);
  const data = store.data(u.email);
  const s = [...data.sessions].reverse().find((x) => x.workout === id);
  if (!w || !s) { go('#/split'); return; }
  const unit = unitOf(u);

  const volume = s.sets.reduce((n, x) => n + x.w * x.r, 0);
  const warmups = s.sets.filter((x) => x.t === 'b');
  const effective = s.sets.filter((x) => x.t !== 'b');
  const contrib = {};
  // csak a nem bemelegítő szettek adnak effektív sorozatot
  effective.forEach((set) => {
    const ex = w.exercises.find((x) => x.id === set.ex);
    if (!ex) return;
    Object.entries(ex.contrib).forEach(([m, v]) => { contrib[m] = (contrib[m] || 0) + v; });
  });
  const groups = Object.entries(contrib).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...groups.map(([, v]) => v));

  app.innerHTML = `
  <div class="view view--nav" style="--accent:${w.hex};--accent-ink:var(--${w.id}-ink)">
    <section class="glow" style="--tint:${w.hex}">
      <p class="eyebrow" style="color:rgba(255,255,255,.72)">${w.name} · befejezve</p>
      <h1 class="display" style="margin-top:var(--s2);font-size:40px;font-weight:800;text-transform:uppercase">Kész<br>az edzés</h1>
      <p style="margin-top:var(--s3);font-size:var(--fs-label);color:rgba(255,255,255,.76)">${s.sets.length ? `${s.sets.length} szett rögzítve.` : 'Nem rögzítettél szettet — legközelebb pipáld be őket.'} ${s.prs.length ? `${s.prs.length} új rekord ma.` : ''}</p>
    </section>

    <dl class="stat-row" style="margin:0">
      <div class="stat"><dt>Szett</dt><dd data-testid="sum-sets">${s.sets.length}</dd></div>
      <div class="stat"><dt>Volumen</dt><dd>${hu(toDisp(volume, unit), 0)}<span style="font-size:var(--fs-label);color:var(--dim)"> ${unit}</span></dd></div>
      <div class="stat" style="border-color:color-mix(in srgb,${w.hex} 35%,transparent);background:color-mix(in srgb,${w.hex} 8%,transparent)">
        <dt style="color:${w.hex}">Rekord</dt><dd style="color:${w.hex}" data-testid="sum-prs">${s.prs.length}</dd></div>
    </dl>

    <p class="meta num" data-testid="sum-eff">${effective.length} effektív sorozat${warmups.length ? ` · ${warmups.length} bemelegítő nem számít bele` : ''} · a volumenben minden szett benne van</p>

    ${s.prs.length ? `
    <section class="card">
      <h2 class="h2">Mai rekordok</h2>
      <ul style="display:flex;flex-direction:column;gap:var(--s3)">
        ${s.prs.map((p) => `
        <li style="display:flex;align-items:center;gap:var(--s3)">
          <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:11px;background:color-mix(in srgb,${w.hex} 14%,transparent);color:${w.hex}">${I.star}</span>
          <span style="flex:1;min-width:0">
            <span style="display:block;font-weight:600">${esc(p.ex)}</span>
            <span class="meta num" style="display:block">${hu(toDisp(p.w, unit))} ${unit} × ${p.r} · előtte ${hu(toDisp(p.prevW, unit))} ${unit} × ${p.prevR}</span>
          </span>
        </li>`).join('')}
      </ul>
    </section>` : ''}

    ${groups.length ? `
    <section class="card">
      <h2 class="h2">Mit terhelt ez az edzés</h2>
      <p class="meta">Effektív sorozat izomcsoportonként</p>
      <ul style="display:flex;flex-direction:column;gap:var(--s2)">
        ${groups.map(([m, v]) => `
        <li class="bar-row">
          <span style="font-size:var(--fs-label);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${MUSCLES[m]}</span>
          <span class="bar"><span style="width:${Math.round((v / max) * 100)}%;background:${w.hex}"></span></span>
          <span class="bar-val" style="color:var(--text-2)">${hu(v)}</span>
        </li>`).join('')}
      </ul>
    </section>` : `
    <div class="empty">${I.check}<p>Nem jött össze szett ebből az edzésből. A naplózás bármikor újraindítható.</p></div>`}

    <div style="display:flex;flex-direction:column;gap:var(--s2)">
      <a class="cta" href="#/split" data-testid="sum-back">Vissza a splithez</a>
      <a class="ghost" href="#/muscles">Izomcsoportok megnyitása</a>
    </div>
  </div>`;
  renderNav('split');
};

/* ---- izomcsoportok ---- */

views.muscles = (u) => {
  const range = views.muscles.range || 7;
  const base = weeklyContribution();
  const keys = Object.keys(MUSCLES);
  const factor = range === 30 ? 4.3 : 1;
  const values = keys.map((k) => Math.round((base[k] || 0) * factor * 10) / 10);
  const min = TARGET.min * factor;
  const max = TARGET.max * factor;
  const ceiling = Math.max(max, ...values);

  const angles = [-90, -54, -18, 18, 54, 90, 126, 162, 198, 234];
  const poly = values.map((v, i) => {
    const r = Math.min(v / ceiling, 1) * 96;
    const a = (angles[i] * Math.PI) / 180;
    return `${(180 + r * Math.cos(a)).toFixed(1)},${(140 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  const ring = (rad) => angles.map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `${(180 + rad * Math.cos(a)).toFixed(1)},${(140 + rad * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  const rows = keys.map((k, i) => {
    const v = values[i];
    const low = v < min;
    return `
    <li class="bar-row">
      <span style="display:flex;align-items:center;gap:6px;font-size:var(--fs-label);font-weight:500;overflow:hidden">
        <span aria-hidden="true" style="flex:none;color:var(--dim)">${mIcon(k)}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${MUSCLES[k]}</span>
      </span>
      <span class="bar"><span style="width:${Math.round((v / ceiling) * 100)}%;background:${low ? 'var(--low)' : 'var(--ok)'}"></span></span>
      <span class="bar-val" style="color:${low ? 'var(--low)' : 'var(--text-2)'}" data-testid="mg-${k}">
        ${low ? `<span aria-label="cél alatt">${I.down}</span>` : ''}${hu(v)}
      </span>
    </li>`;
  }).join('');

  const lowCount = values.filter((v) => v < min).length;

  app.innerHTML = `
  <div class="view view--nav" style="--accent:var(--lower);--accent-ink:var(--lower-ink)">
    <div class="topbar">
      <h1 class="h1">Izomcsoportok</h1>
      <div class="toggle" role="group" aria-label="Időszak" style="flex:none">
        <button class="chip" type="button" data-range="7" aria-pressed="${range === 7}" data-testid="range-7">7 nap</button>
        <button class="chip" type="button" data-range="30" aria-pressed="${range === 30}" data-testid="range-30">30 nap</button>
      </div>
    </div>
    <p class="meta">Effektív sorozat — a célsáv ${hu(min, 0)}–${hu(max, 0)} ${range === 30 ? '30 napra' : 'egy hétre'}. ${lowCount ? `${lowCount} csoport a sáv alatt.` : 'Minden csoport a sávban.'}</p>

    <section class="card">
      <svg viewBox="0 0 360 290" width="100%" role="img" aria-label="Izomcsoportok radardiagramja" style="display:block;height:auto">
        <g fill="none" stroke="#1E1E22" stroke-width="1">
          <polygon points="${ring(96)}"/><polygon points="${ring(72)}"/><polygon points="${ring(48)}"/><polygon points="${ring(24)}"/>
        </g>
        <g stroke="#17171B" stroke-width="1">
          ${angles.map((deg) => {
            const a = (deg * Math.PI) / 180;
            return `<line x1="180" y1="140" x2="${(180 + 96 * Math.cos(a)).toFixed(1)}" y2="${(140 + 96 * Math.sin(a)).toFixed(1)}"/>`;
          }).join('')}
        </g>
        <polygon points="${poly}" fill="rgba(138,143,224,.22)" stroke="#8A8FE0" stroke-width="2" stroke-linejoin="round"/>
        ${keys.map((k, i) => {
          const a = (angles[i] * Math.PI) / 180;
          const x = 180 + 118 * Math.cos(a);
          const y = 140 + 118 * Math.sin(a);
          const anchor = x < 170 ? 'end' : x > 190 ? 'start' : 'middle';
          return `<text x="${x.toFixed(0)}" y="${(y + 4).toFixed(0)}" text-anchor="${anchor}" fill="#8E8E97" font-family="Inter, sans-serif" font-size="10" font-weight="600">${MUSCLES[k]}</text>`;
        }).join('')}
      </svg>
    </section>

    <section class="card">
      <h2 class="h2">Számok</h2>
      <ul style="display:flex;flex-direction:column;gap:var(--s2)">${rows}</ul>
    </section>

    <div class="notice">
      <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9px;background:rgba(138,143,224,.18);color:#9FA4E8">${I.warn}</span>
      <p>Az „össz súly” bejegyzések nem számítanak bele: az csak a korábbi edzéseid összesített terhelése.</p>
    </div>
  </div>`;
  renderNav('muscles');

  $$('[data-range]').forEach((b) => b.addEventListener('click', () => {
    views.muscles.range = Number(b.dataset.range);
    views.muscles(u);
  }));
};

/* ---- össz súly ---- */

views.weight = (u) => {
  const data = store.data(u.email);
  const unit = unitOf(u);
  const current = data.totals.reduce((n, t) => n + t.kg, 0);
  const setsTotal = WORKOUTS.reduce((n, w) => n + setCount(w), 0);

  app.innerHTML = `
  <div class="view view--nav">
    <div class="topbar">
      <a class="icon-btn" href="#/split" aria-label="Vissza a splithez">${I.back}</a>
      <h1 class="h1" style="flex:1">Össz súly</h1>
    </div>
    <p class="sub">Add meg, mennyit mozgattál eddig összesen. Ez nem számít bele az izomcsoport-trackerbe.</p>

    <form id="f" novalidate style="display:flex;flex-direction:column;gap:var(--s4)">
      <div>
        <label class="sr" for="total">Össz súly (${unit})</label>
        <input class="big" id="total" name="total_weight" type="number" inputmode="decimal" step="1" min="0" placeholder="0" data-testid="total-input">
        <p class="meta" style="margin-top:var(--s2);text-align:center">${unit}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s2)">
        <button class="chip" type="button" data-add="250">+250</button>
        <button class="chip" type="button" data-add="500">+500</button>
        <button class="chip" type="button" data-add="1000">+1000</button>
        <button class="chip" type="button" data-clear>Töröl</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s3)">
        <div>
          <label class="lbl" for="on">Dátum</label>
          <input class="fld" id="on" name="logged_on" type="date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div>
          <label class="lbl" for="src">Honnan</label>
          <select class="fld" id="src" name="source">
            <option value="korabbi">Korábbi edzések</option>
            <option value="masik-app">Másik appból</option>
            <option value="becsles">Becslés</option>
          </select>
        </div>
      </div>

      <div class="notice">
        <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9px;background:rgba(138,143,224,.18);color:#9FA4E8">${I.warn}</span>
        <p>Ez a szám külön él: a <strong style="color:var(--text);font-weight:600">radar és az effektív sorozatok nem változnak</strong> tőle. Csak a saját összesítésed nő.</p>
      </div>

      <section class="card">
        <h2 class="h2">Mi változik</h2>
        <p class="num" style="font-size:var(--fs-h1);font-family:var(--display);font-weight:700">
          ${hu(toDisp(current, unit), 0)} → <span data-testid="preview">${hu(toDisp(current, unit), 0)}</span> ${unit}
        </p>
        <p class="meta num">Heti ${setsTotal} szett a splitből · változatlan</p>
      </section>

      <p class="err" role="alert" aria-live="polite" data-testid="total-error"></p>
      <button class="cta" type="submit" data-testid="total-save">Hozzáadás</button>
    </form>
  </div>`;
  renderNav('weight');

  const input = $('#total');
  const preview = $('[data-testid="preview"]');
  const repaint = () => {
    const add = parseFloat(input.value);
    preview.textContent = hu(toDisp(current, unit) + (Number.isFinite(add) ? add : 0), 0);
  };
  input.addEventListener('input', repaint);
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    input.value = String((parseFloat(input.value) || 0) + Number(b.dataset.add));
    repaint();
  }));
  $('[data-clear]').addEventListener('click', () => { input.value = ''; repaint(); });

  $('#f').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('[data-testid="total-error"]');
    const val = parseFloat(input.value);
    if (!Number.isFinite(val) || val <= 0) { err.textContent = 'Adj meg egy nullánál nagyobb súlyt.'; input.focus(); return; }
    const fresh = store.data(u.email);
    fresh.totals.push({ kg: toKg(val, unit), on: $('#on').value, source: $('#src').value });
    store.saveData(u.email, fresh);
    go('#/split');
  });
};

/* ---- profil ---- */

views.profile = (u) => {
  const data = store.data(u.email);
  const prefs = prefsOf(data);
  let unit = unitOf(u);
  const initials = (u.name || '?').trim().slice(0, 2).toUpperCase();
  const prs = data.sessions.reduce((n, s) => n + (s.prs?.length || 0), 0);

  app.innerHTML = `
  <div class="view view--nav">
    <h1 class="h1">Profil</h1>

    <section class="glow" style="--tint:var(--upper);display:flex;align-items:center;gap:var(--s4)">
      <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:20px;background:rgba(0,0,0,.35);font-family:var(--display);font-size:var(--fs-h1);font-weight:700">${esc(initials)}</span>
      <span style="min-width:0">
        <span style="display:block;font-family:var(--display);font-size:18px;font-weight:600" data-testid="pf-name">${esc(u.name)}</span>
        <span class="num" style="display:block;margin-top:2px;font-size:var(--fs-label);color:rgba(255,255,255,.68)">${data.sessions.length} edzés · ${prs} rekord</span>
      </span>
    </section>

    <form id="f" novalidate style="display:flex;flex-direction:column;gap:var(--s3)">
      <section class="card">
        <h2 class="h2">Adatok</h2>
        <div>
          <label class="lbl" for="name">Név</label>
          <input class="fld" id="name" name="display_name" type="text" autocomplete="name" value="${esc(u.name)}" data-testid="pf-name-input">
        </div>
        <div>
          <label class="lbl" for="email">E-mail</label>
          <input class="fld" id="email" name="email" type="email" value="${esc(u.email)}" readonly aria-readonly="true" style="color:var(--dim)">
        </div>
        <div>
          <label class="lbl" for="bw">Testsúly (<span data-unit-label>${unit}</span>)</label>
          <input class="fld" id="bw" name="body_weight" type="number" inputmode="decimal" step="0.1" min="0" value="${u.bodyWeight != null ? toDisp(u.bodyWeight, unit) : ''}" data-testid="pf-weight">
        </div>
      </section>

      <section class="card">
        <h2 class="h2">Mértékegység</h2>
        <p class="meta">Minden súly ebben jelenik meg, a korábbi naplóidban is.</p>
        <div class="toggle" role="group" aria-label="Mértékegység">
          <button class="chip" type="button" data-unit="kg" aria-pressed="${unit === 'kg'}" data-testid="pf-kg">Kilogramm (kg)</button>
          <button class="chip" type="button" data-unit="lbs" aria-pressed="${unit === 'lbs'}" data-testid="pf-lbs">Font (lbs)</button>
        </div>
      </section>

      <section class="card">
        <h2 class="h2">Edzés közben</h2>
        ${[
          ['autoRest', 'Pihenő automatikus indítása', 'Szett pipálása után elindul a visszaszámláló'],
          ['alert', 'Jelzés a pihenő végén', 'Rövid hang és rezgés — a telefon lehet a zsebben is'],
          ['wake', 'Kijelző ébren tartása', 'Két szett között ne aludjon el a telefon']
        ].map(([k, label, hint]) => `
        <label class="pref" for="p-${k}">
          <span style="min-width:0">${label}<span class="meta" style="display:block;margin-top:2px">${hint}</span></span>
          <input class="sw" id="p-${k}" name="${k}" type="checkbox" data-pref="${k}" ${prefs[k] ? 'checked' : ''} data-testid="pf-${k}">
        </label>`).join('')}
      </section>

      <section class="card">
        <h2 class="h2">Számok és javaslatok</h2>
        ${[
          ['prBadges', 'Rekord jelzése', 'Csillag a soron, ha felülmúlod az eddigi legjobbat'],
          ['prefill', 'Előző értékek előtöltése', '„Előző” gomb a gyakorlat fejlécében'],
          ['progression', 'Progressziójavaslat', '+2,5 kg, ha múltkor minden szett a sáv tetején volt']
        ].map(([k, label, hint]) => `
        <label class="pref" for="p-${k}">
          <span style="min-width:0">${label}<span class="meta" style="display:block;margin-top:2px">${hint}</span></span>
          <input class="sw" id="p-${k}" name="${k}" type="checkbox" data-pref="${k}" ${prefs[k] ? 'checked' : ''} data-testid="pf-${k}">
        </label>`).join('')}
      </section>

      <p class="err" role="status" aria-live="polite" data-testid="pf-status" style="color:var(--ok)"></p>
      <button class="cta" type="submit" data-testid="pf-save">Mentés</button>
    </form>

    <button class="ghost" type="button" data-logout data-testid="logout">Kijelentkezés</button>

    <section class="card" style="background:var(--card-2);margin-top:var(--s2)">
      <h2 class="h2" style="display:flex;align-items:center;gap:var(--s2);color:var(--danger-soft)">${I.warn} Veszélyes zóna</h2>
      <p class="meta">A fiók törlése minden edzésnaplót, rekordot és beállítást visszavonhatatlanul eltávolít. Előbb letöltheted az adataidat.</p>
      <div style="display:flex;flex-direction:column;gap:var(--s2)">
        <button class="ghost" type="button" data-export data-testid="export">${I.dl} Adatok letöltése (CSV)</button>
        <a class="danger-btn" href="#/delete" data-testid="to-delete">${I.trash} Fiók törlése</a>
      </div>
    </section>
  </div>`;
  renderNav('profile');

  $$('[data-unit]').forEach((b) => b.addEventListener('click', () => {
    const next = b.dataset.unit;
    if (next === unit) return;
    const shown = parseFloat($('#bw').value);
    unit = next;
    $$('[data-unit]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.unit === unit)));
    $('[data-unit-label]').textContent = unit;
    if (Number.isFinite(shown)) {
      const converted = next === 'lbs' ? shown * KG_PER_LB : shown / KG_PER_LB;
      $('#bw').value = String(Math.round(converted * 10) / 10);
    }
  }));

  $('#f').addEventListener('submit', (e) => {
    e.preventDefault();
    const bw = parseFloat($('#bw').value);
    store.saveUser(u.email, {
      name: $('#name').value.trim() || u.name,
      unit,
      bodyWeight: Number.isFinite(bw) ? toKg(bw, unit) : u.bodyWeight
    });
    const fresh = store.data(u.email);
    fresh.prefs = Object.fromEntries($$('[data-pref]').map((x) => [x.dataset.pref, x.checked]));
    store.saveData(u.email, fresh);
    $('[data-testid="pf-status"]').textContent = 'Mentve.';
    $('[data-testid="pf-name"]').textContent = $('#name').value.trim() || u.name;
  });

  $('[data-logout]').addEventListener('click', () => { store.logout(); go('#/login'); });
  $('[data-export]').addEventListener('click', () => exportCsv(u));
};

function exportCsv(u) {
  const data = store.data(u.email);
  const rows = [['tipus', 'datum', 'edzes', 'gyakorlat', 'szett', 'szettipus', 'suly_kg', 'ismetles']];
  data.sessions.forEach((s) => s.sets.forEach((x) => {
    rows.push(['szett', s.on, s.workout, x.ex, x.n, x.t || 'n', x.w, x.r]);
  }));
  data.totals.forEach((t) => rows.push(['ossz_suly', t.on, '', t.source, '', '', t.kg, '']));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `forge-${u.email.replace(/[^a-z0-9]+/gi, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---- fiók törlése ---- */

views.delete = (u) => {
  const data = store.data(u.email);
  const prs = data.sessions.reduce((n, s) => n + (s.prs?.length || 0), 0);
  const totals = data.totals.reduce((n, t) => n + t.kg, 0);
  const unit = unitOf(u);

  const wipes = [
    ['Edzésnapló', `${data.sessions.length} edzés`],
    ['Személyes rekordok', `${prs} rekord`],
    ['Össz súly bejegyzések', `${hu(toDisp(totals, unit), 0)} ${unit}`],
    ['Fiók és beállítások', esc(u.email)]
  ];

  app.innerHTML = `
  <div class="view" style="--accent:var(--danger-soft)">
    <div class="topbar">
      <a class="icon-btn" href="#/profile" aria-label="Vissza a profilhoz">${I.back}</a>
      <span class="eyebrow" style="flex:1;text-align:right;color:var(--danger-soft)">Visszavonhatatlan</span>
    </div>

    <div>
      <h1 class="display">Fiók törlése</h1>
      <p class="sub" style="margin-top:var(--s2)">A törlés nem vonható vissza, és nem tudjuk neked újra előállítani az adataidat.</p>
    </div>

    <section class="card" style="border-color:rgba(255,77,77,.28);background:rgba(255,77,77,.05)">
      <h2 class="h2">Ez törlődik</h2>
      <ul style="display:flex;flex-direction:column;gap:var(--s2)">
        ${wipes.map(([label, count]) => `
        <li style="display:flex;align-items:center;gap:var(--s3)">
          <span aria-hidden="true" style="flex:none;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:8px;background:rgba(255,77,77,.14);color:var(--danger-soft)"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
          <span style="flex:1;min-width:0;font-size:var(--fs-label)">${label}</span>
          <span class="num" style="flex:none;font-size:var(--fs-label);font-weight:600;color:var(--text-2)">${count}</span>
        </li>`).join('')}
      </ul>
    </section>

    <button class="ghost" type="button" data-export>${I.dl} Előbb töltsd le az adataidat</button>

    <form id="f" novalidate style="display:flex;flex-direction:column;gap:var(--s3)">
      <div>
        <label for="phrase" style="display:block;margin-bottom:var(--s2);font-size:var(--fs-label);color:var(--text-2)">
          Írd be, hogy <strong style="color:var(--danger-soft);font-weight:600;letter-spacing:.06em">TÖRLÉS</strong>, és a gomb aktiválódik.
        </label>
        <input class="fld" id="phrase" name="confirm_phrase" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="TÖRLÉS" style="font-weight:600;letter-spacing:.08em" data-testid="del-phrase">
        <p class="err" aria-live="polite" data-testid="del-hint"></p>
      </div>
      <div>
        <label class="lbl" for="pw">Jelszó megerősítése</label>
        <input class="fld" id="pw" name="password" type="password" autocomplete="current-password" placeholder="••••••••" data-testid="del-password">
      </div>
      <button class="wipe" type="submit" disabled data-testid="del-submit">${I.trash} Fiók végleges törlése</button>
    </form>

    <a class="ghost" href="#/profile" data-testid="del-cancel">Mégsem, maradok</a>
  </div>`;
  renderNav(null);

  const phrase = $('#phrase');
  const submit = $('[data-testid="del-submit"]');
  const hint = $('[data-testid="del-hint"]');

  phrase.addEventListener('input', () => {
    const ok = phrase.value.trim().toUpperCase() === 'TÖRLÉS';
    submit.disabled = !ok;
    hint.textContent = ok ? 'Megerősítve — a gomb aktív.' : (phrase.value ? 'Még nem egyezik.' : '');
    hint.style.color = ok ? 'var(--ok)' : 'var(--danger-soft)';
  });

  $('[data-export]').addEventListener('click', () => exportCsv(u));

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#pw').value;
    const stored = store.user(u.email);
    if (!stored || (await digest(stored.salt + pw)) !== stored.hash) {
      hint.textContent = 'A jelszó nem egyezik.';
      hint.style.color = 'var(--danger-soft)';
      $('#pw').focus();
      return;
    }
    store.wipe(u.email);
    go('#/login?deleted=1');
  });
};

/* ---------------------------------------------------------------- router */

const PUBLIC = new Set(['login', 'signup']);

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const raw = (location.hash || '#/split').replace(/^#\/?/, '');
  const [path] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const name = parts[0] || 'split';
  const u = store.current();

  if (!PUBLIC.has(name) && !u) { location.hash = '#/login'; return; }
  if (PUBLIC.has(name) && u && name === 'login' && !raw.includes('deleted')) { location.hash = '#/split'; return; }

  const view = views[name];
  if (!view) { location.hash = '#/split'; return; }

  // a kijelző csak a naplózó képernyőn marad ébren
  if (name !== 'workout') letSleep();

  view(u, parts[1]);
  window.scrollTo(0, 0);

  if (name === 'login' && raw.includes('deleted')) {
    const err = $('[data-testid="login-error"]');
    if (err) { err.style.color = 'var(--ok)'; err.textContent = 'A fiók törölve. Bármikor regisztrálhatsz újra.'; }
  }
}

window.addEventListener('hashchange', render);

/* a netlify.app jelvénye a jobb alsó sarkot fedi — ott feljebb tesszük a navigációt */
if (location.hostname.endsWith('.netlify.app')) {
  document.documentElement.setAttribute('data-nl-badge', '');
}

seedDemo().then(() => {
  if (!location.hash) location.hash = store.current() ? '#/split' : '#/login';
  render();
  document.body.dataset.ready = '1';
});

/* offline működés: a service worker a vázat és a betűket tartja meg */
const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || localHost)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mód nélkül is megy */ });
  });
}
