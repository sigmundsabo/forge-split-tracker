/* FORGE — a split és a gyakorlatok.
   `contrib`: effektív sorozat izomcsoportonként, szettenként.
   Elsődleges izom = 1, másodlagos = 0,5 — ettől törtek a heti összegek. */

export const MUSCLES = {
  mell: 'Mell',
  vall: 'Váll',
  tricepsz: 'Tricepsz',
  has: 'Has',
  comb: 'Comb',
  vadli: 'Vádli',
  combhajlito: 'Combhajlító',
  bicepsz: 'Bicepsz',
  trapez: 'Trapéz',
  hat: 'Hát'
};

/* heti effektív sorozat ajánlott sávja */
export const TARGET = { min: 10, max: 20 };

export const WORKOUTS = [
  {
    id: 'upper',
    name: 'Upper',
    eyebrow: 'Mell · hát · váll · kar',
    tint: 'var(--upper)',
    ink: 'var(--upper-ink)',
    hex: '#EE7A63',
    exercises: [
      { id: 'pullover',  name: 'Pullover',           scheme: '3×8–10',  rest: 90,  contrib: { hat: 1, mell: 0.5 },                prev: [[45, 10], [45, 9], [40, 10]] },
      { id: 'chestpress',name: 'Chest press',        scheme: '3×6–10',  rest: 120, contrib: { mell: 1, tricepsz: 0.5, vall: 0.5 },prev: [[60, 10], [60, 8], [57.5, 8]] },
      { id: 'ohp',       name: 'Vállból nyomás',     scheme: '3×6–8',   rest: 120, contrib: { vall: 1, tricepsz: 0.5 },           prev: [[40, 8], [40, 7], [37.5, 7]] },
      { id: 'bicep',     name: 'Bicep curl',         scheme: '3×8–10',  rest: 60,  contrib: { bicepsz: 1 },                       prev: [[16, 10], [16, 9], [14, 10]] },
      { id: 'shrug',     name: 'Csuklya',            scheme: '3×10–12', rest: 75,  contrib: { trapez: 1 },                        prev: [[70, 12], [70, 11], [65, 12]] },
      { id: 'lateral',   name: 'Lateral raise',      scheme: '3×8–10',  rest: 60,  contrib: { vall: 1 },                          prev: [[10, 10], [10, 9], [9, 10]] },
      { id: 'reverse',   name: 'Reverse curl',       scheme: '2×10–12', rest: 60,  contrib: { bicepsz: 1 },                       prev: [[12, 12], [12, 10]] },
      { id: 'triext',    name: 'Triceps extension',  scheme: '3×8–10',  rest: 60,  contrib: { tricepsz: 1 },                      prev: [[30, 10], [30, 9], [27.5, 9]] }
    ]
  },
  {
    id: 'lower',
    name: 'Lower',
    eyebrow: 'Comb · hajlító · vádli · has',
    tint: 'var(--lower)',
    ink: 'var(--lower-ink)',
    hex: '#8A8FE0',
    exercises: [
      { id: 'pendsquat', name: 'Pendulum squat',     scheme: '3×8–10',  rest: 150, contrib: { comb: 1 },         prev: [[100, 10], [100, 8], [90, 10]] },
      { id: 'adductor',  name: 'Adductor',           scheme: '3×10–12', rest: 75,  contrib: { comb: 0.5 },       prev: [[60, 12], [60, 11], [55, 12]] },
      { id: 'legcurl',   name: 'Seated leg curl',    scheme: '3×8–10',  rest: 90,  contrib: { combhajlito: 1 },  prev: [[45, 10], [45, 9], [40, 10]] },
      { id: 'legext',    name: 'Combfeszítő',        scheme: '2×6–8',   rest: 90,  contrib: { comb: 1 },         prev: [[70, 8], [70, 7]] },
      { id: 'calf',      name: 'Álló vádli',         scheme: '3×10–12', rest: 60,  contrib: { vadli: 1 },        prev: [[80, 12], [80, 11], [75, 12]] },
      { id: 'crunch',    name: 'Abdominal crunch',   scheme: '3×10–12', rest: 60,  contrib: { has: 1 },          prev: [[40, 12], [40, 12], [35, 12]] }
    ]
  },
  {
    id: 'anterior',
    name: 'Anterior',
    eyebrow: 'Mell · comb · bicepsz',
    tint: 'var(--anterior)',
    ink: 'var(--anterior-ink)',
    hex: '#EBD3AE',
    exercises: [
      { id: 'chestpress',name: 'Chest press',        scheme: '3×6–8',   rest: 120, contrib: { mell: 1, tricepsz: 0.5, vall: 0.5 }, prev: [[62.5, 8], [60, 8], [60, 7]] },
      { id: 'ohp',       name: 'Vállból nyomás',     scheme: '2×6–8',   rest: 120, contrib: { vall: 1, tricepsz: 0.5 },            prev: [[42.5, 7], [40, 7]] },
      { id: 'legext',    name: 'Combfeszítő',        scheme: '3×8–10',  rest: 90,  contrib: { comb: 1 },                           prev: [[70, 10], [70, 9], [65, 10]] },
      { id: 'incline',   name: 'Incline chest press',scheme: '3×6–8',   rest: 120, contrib: { mell: 1, vall: 0.5, tricepsz: 0.5 }, prev: [[50, 8], [50, 7], [45, 8]] },
      { id: 'hammer',    name: 'Hammer curl',        scheme: '2×6–8',   rest: 60,  contrib: { bicepsz: 1 },                        prev: [[18, 8], [18, 7]] },
      { id: 'peckdeck',  name: 'Peck deck',          scheme: '3×8–10',  rest: 75,  contrib: { mell: 1 },                           prev: [[45, 10], [45, 9], [40, 10]] },
      { id: 'bicep',     name: 'Bicep curl',         scheme: '2×8–10',  rest: 60,  contrib: { bicepsz: 1 },                        prev: [[16, 10], [16, 9]] }
    ]
  },
  {
    id: 'posterior',
    name: 'Posterior',
    eyebrow: 'Hát · hajlító · tricepsz',
    tint: 'var(--posterior)',
    ink: 'var(--posterior-ink)',
    hex: '#DD8296',
    exercises: [
      { id: 'pulldown',  name: 'Lehúzás',               scheme: '3×8–10',  rest: 120, contrib: { hat: 1, bicepsz: 0.5 },              prev: [[65, 10], [65, 9], [60, 10]] },
      { id: 'legcurl',   name: 'Seated leg curl',       scheme: '2×8–10',  rest: 90,  contrib: { combhajlito: 1 },                    prev: [[45, 10], [45, 9]] },
      { id: 'row',       name: 'Hashoz húzás',          scheme: '3×8–10',  rest: 120, contrib: { hat: 1, bicepsz: 0.5, trapez: 0.5 }, prev: [[70, 10], [70, 9], [65, 10]] },
      { id: 'calf',      name: 'Álló vádli',            scheme: '2×10–12', rest: 60,  contrib: { vadli: 1 },                          prev: [[80, 12], [80, 11]] },
      { id: 'reversefly',name: 'Reverse fly',           scheme: '3×8–10',  rest: 60,  contrib: { vall: 1 },                           prev: [[15, 10], [15, 9], [12.5, 10]] },
      { id: 'triup',     name: 'Tricep extension fel',  scheme: '2×10–12', rest: 60,  contrib: { tricepsz: 1 },                       prev: [[25, 12], [25, 11]] },
      { id: 'lowback',   name: 'Mélyhát',               scheme: '2×8–12',  rest: 90,  contrib: { hat: 1 },                            prev: [[50, 12], [50, 10]] },
      { id: 'tridown',   name: 'Tricep extension le',   scheme: '2×10–12', rest: 60,  contrib: { tricepsz: 1 },                       prev: [[30, 12], [30, 11]] }
    ]
  }
];

export const byId = (id) => WORKOUTS.find((w) => w.id === id);

export const setCount = (w) =>
  w.exercises.reduce((n, ex) => n + ex.prev.length, 0);

/* egy edzés izomcsoport-hozzájárulása, ha minden szett megvan */
export function workoutContribution(w) {
  const out = {};
  w.exercises.forEach((ex) => {
    Object.entries(ex.contrib).forEach(([m, v]) => {
      out[m] = (out[m] || 0) + v * ex.prev.length;
    });
  });
  return out;
}

/* a teljes split heti effektív sorozatai */
export function weeklyContribution() {
  const out = {};
  WORKOUTS.forEach((w) => {
    Object.entries(workoutContribution(w)).forEach(([m, v]) => {
      out[m] = (out[m] || 0) + v;
    });
  });
  return out;
}
