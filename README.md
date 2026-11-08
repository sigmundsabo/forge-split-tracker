# FORGE — edzés split tracker

Négy edzés, egy split. Súly- és ismétlésnaplózás, pihenőidő-számláló, személyes rekordok,
izomcsoport-tracker és külön „össz súly" bejegyzés. Telefonra tervezve, sötét felülettel.

A split nincs naphoz kötve: a négy edzés önálló kártya, bármelyik bármikor indítható.
Edzésidő-becslés szándékosan nincs sehol.

## Élő

https://forge-split-tracker.netlify.app — demó fiók: `demo@forge.hu` / `forge1234`

A netlify.app ingyenes domainen a „Powered by Netlify" jelvény a jobb alsó sarokban
ül, és elfogja a koppintást az alatta lévő felületen. Ezért ezen a gazdagépen a
navigáció feljebb csúszik (`:root[data-nl-badge]`); saját domainen vagy a
kezdőképernyőről indítva nincs jelvény, és a sáv a helyén marad.

## Mi ez

Statikus frontend — nincs build lépés, nincs szerver, nincs hálózati hívás.
Egyetlen `index.html`, hash-alapú útvonalakkal (`#/split`, `#/workout/upper`, …).

```
index.html             a váz és a lenti navigáció
assets/app.css         tokenek, 4/8-as rács, hatlépcsős típusskála
assets/data.js         a split: gyakorlatok, szettek, pihenők, izomhozzájárulás
assets/app.js          router, localStorage, a kilenc képernyő
sw.js                  service worker: offline működés
manifest.webmanifest   kezdőképernyőre tehető (PWA)
tests/forge.spec.js    Playwright-runnerhez
tools/check.mjs        ugyanaz runner nélkül, a Playwright könyvtárán
tools/serve.mjs        statikus kiszolgáló, csak Node-beépítőkkel
```

## Naplózás közben

- **Szettípus** — a szett számára koppintva: normál → `B` bemelegítő → `D` drop →
  `K` kudarcig. A bemelegítő nem számít effektív sorozatba, nem lehet rekord, és
  rövidebb pihenőt indít (max. 60 s).
- **Pihenő** — a szett pipálásakor indul, a végén három rövid hang és rezgés.
- **Rekord** — csillag a soron, ha a szett felülmúlja az eddigi legjobbat.
- **Előző / Javaslat** — az „Előző" a múltkori számokat írja be. Ha múltkor minden
  szett elérte az ismétléssáv felső értékét, megjelenik a **+2,5 kg javaslat**, és a
  „Kitölt" be is írja a sáv alsó ismétlésszámával.
- **Kijelző** — edzés közben ébren marad (Wake Lock), a naplózóból kilépve elengedi.

A rezgés, a hang, a kijelző, a rekordjelzés, az előtöltés és a javaslat külön-külön
kikapcsolható a profilban. A rezgés Androidon működik; iOS Safari nem támogatja a
`navigator.vibrate`-et, ott a hang marad.

## Offline

A `sw.js` cache-first módon tartja a vázat (HTML, CSS, JS, ikon, manifest), a Google
Fonts fájljait pedig stale-while-revalidate módon. Telepítve, repülőgép-módban is
elindul, és mivel a napló `localStorage`-ban van, semmi nem áll meg.

Ha a váz fájljai változnak, **emeld a `VERSION`-t a `sw.js` elején** — új érték = új
cache, a régi az aktiválásnál törlődik.

## Futtatás

```bash
npm run dev
```

Majd nyisd meg: http://localhost:4321

## Tesztek

Két úton fut ugyanaz a kör — a Playwright test-runnerrel, és runner nélkül,
a Playwright könyvtári API-ján:

```bash
npm test
```

```bash
npm run check
```

Mindkettő iPhone 13, Pixel 7 és desktop Chrome profilon megy végig: belépés és rossz
jelszó, a négy edzés szettszáma, szettrögzítés és pihenő, szettípus-jelölés, a
bemelegítő kizárása az effektív sorozatból, rekordjelzés, előtöltés,
progressziójavaslat, offline indulás a service workerrel, összegző, izomcsoport-számok
(7 és 30 napra), az össz súly különállása, regisztráció, profilmentés és a beállítások
megmaradása, kg/lbs átszámítás, a fióktörlés teljes útja, valamint a vízszintes
csúszás, a 44 pixeles érintőfelületek és a konzolhibák ellenőrzése.

Utolsó futás: **34/34 rendben**.

A `npm run check` akkor is megy, ha a Playwright test-runner nem tud elindulni a
környezetben (sandbox, zárt CI) — csak böngészőt indít, saját kiszolgálóval.

## A split

| Edzés | Gyakorlat | Szett | Fő izmok |
|---|---|---|---|
| Upper | 8 | 23 | mell, hát, váll, kar |
| Lower | 6 | 17 | comb, hajlító, vádli, has |
| Anterior | 7 | 18 | mell, comb, bicepsz |
| Posterior | 8 | 19 | hát, hajlító, tricepsz |

Összesen 29 gyakorlat, 77 szett.

Az izomcsoport-tracker **effektív sorozatban** számol: elsődleges izom szettenként 1,
másodlagos 0,5 — ezért törtek a heti összegek (pl. mell 13,5). A célsáv heti 10–20.

Az „össz súly" bejegyzés tudatosan **nem** számít bele a trackerbe: azoknak szól, akik
már edzettek korábban, és csak a saját összesítésüket akarják továbbvinni.

## Adatok és jelszavak

Minden a böngésző `localStorage`-ában marad, ezen az eszközön. A szerver nem létezik,
így adat sem hagyja el a telefont. A jelszó SHA-256 + egyedi só formában tárolódik,
**de ez demó, nem valódi hitelesítés** — bárki, aki hozzáfér az eszközhöz, hozzáfér az
adatokhoz is. Éles használathoz szerveroldali auth kell (lásd `IDEAS.md`, 17. pont).

Demó fiók: `demo@forge.hu` / `forge1234`.

A profil alján a veszélyes zóna: CSV-export, majd fióktörlés. A törlés beírt
megerősítést (`TÖRLÉS`) és jelszót kér, és visszavonhatatlan.

## Telefonra

- `viewport-fit=cover` + `env(safe-area-inset-bottom)`: a lenti navigáció nem csúszik a gesztussáv alá
- `100dvh` a `100vh` helyett, hogy a mobil címsor ne vágja el a layoutot
- minden beviteli mező 16 pixeles betűvel, így az iOS nem zoomol fókuszra
- `inputmode="decimal"` / `"numeric"`: a súly- és ismétlésmezők számbillentyűzetet nyitnak
- minden érintőfelület legalább 44×44 pixel, a szett-pipa körül 44-es címkével
- `touch-action: manipulation`, nincs 300 ms-os koppintáskésés
- 440 pixel fölött középre zárt sávban fut, telefonon teljes szélességben
- kontraszt mindenhol legalább 4,5:1, látható fókuszgyűrűk, `prefers-reduced-motion`

## Tervezés

A képernyők vászonverziója (12 artboard, jegyzetekkel) a Claude design artifactban él.
Betűk: Bricolage Grotesque (display) + Inter (szöveg).
Színek: fekete alap, edzésenként egy lágy fényfolt — korall (Upper), kékeslila (Lower),
homok (Anterior), rózsa (Posterior).
