# Ötletek — mi jöhet ezután

Amit Hevy, Liftoff, Strong és a Boostcamp már megoldott, és ebbe a splitbe is beillik.
Sorrend: amitől ténylegesen jobb lesz az edzés közbeni használat, nem ami szépen hangzik.

## Már bent van

- Pihenőidő-számláló, a szett pipálásakor indul (Hevy)
- Személyes rekord jelzése a soron és az összegzőn (Hevy, Strong)
- Előző szett előtöltése gyakorlatonként (Liftoff)
- Előző heti súly és ismétlés a mező halvány alapértékeként
- Fióktörlés megerősítéssel, CSV-exporttal, 30 napos visszaállítással

## Top 5 — ezt vinném tovább

### 1. Bemelegítő szettek jelölése
Szettenként `W` (warmup) / `D` (drop) / `F` (failure) jelölés, mint Hevyben.
A bemelegítő **kimarad az effektív sorozatból** — ez egy csapásra pontosabbá teszi a
trackert, mert most minden szett egyenlően számol. Kis UI, nagy adatjavulás.

### 2. Offline működés (service worker)
A konditeremben gyakran nincs térerő, az app meg hálózatról töltődik. A manifest már
megvan; egy cache-first service worker kell, és telepítve, repülőgép-módban is megy.

### 3. Haptika és hang
`navigator.vibrate()` a szett pipálásakor, rövid jelzés a pihenő végén. Edzés közben a
telefon a zsebben vagy a padon van — a néma visszaszámláló használhatatlan.
Mellé: `Screen Wake Lock`, hogy ne aludjon el a kijelző két szett között.

### 4. Progressziójavaslat
Ha az előző alkalommal minden szettben elérted az ismétlésintervallum felső értékét,
a mező alapértéke `+2,5 kg` legyen, egy magyarázó sorral. Ez a dupla progresszió
automatizálása — a legtöbb tracker ezt nem csinálja meg helyetted.

### 5. Import Hevyből / Strongból (CSV)
Az „össz súly" mező egy kerülőút arra, hogy a felhasználónak van előtörténete.
A valódi válasz: töltse be a régi naplóját, és onnantól igazi rekordjai és trendjei
lesznek. Ugyanaz a CSV-séma, amit most exportálunk.

## Naplózás

- RPE / RIR mező szettenként, összecsukva (a progresszió valódi mérése)
- Tárcsakalkulátor: a beírt súlyhoz mutatja az oldalankénti tárcsákat (Liftoff)
- `+` / `−` lépés a súlymező mellé — zsíros kézzel a számbillentyűzet lassú
- Egysoros szettjegyzet („bal váll nyomott")
- Szuperszett: két gyakorlat összekapcsolása, a pihenő csak a pár végén indul
- Gyakorlatcsere edzés közben, ha a gép foglalt — alternatíva ugyanarra az izomra
- Becsült 1RM gyakorlatonként (Epley), és a trend időben

## Progresszió és motiváció

- Gyakorlat-részletező: minden korábbi szett, a legjobb szett, volumen-trend
- Konzisztencia: hány egymást követő héten volt meg mind a négy edzés (Liftoff-streak)
- Heti kártya: volumen, rekordok, és melyik izomcsoport maradt le
- Testsúly-napló a profilban, egy vonalgrafikonnal

## Izomcsoport-tracker

- Sávon **felüli** jelzés is — most csak a cél alattit mutatjuk
- Az előző négy hét radarja szellemvonalként a mostani alatt
- Konkrét javaslat: „a has 3 effektív sorozatnál áll, tegyél +2 szettet a Lowerbe"
- Bemelegítő szettek kizárása (lásd 1. pont)

## Fiók és adat

- Szerveroldali auth és felhőszinkron (Supabase: Postgres + RLS + magic link),
  hogy több eszközön ugyanaz a napló legyen. A mostani űrlapok már `name` attribútumokkal
  készültek, pont ezért.
- Jelszó-visszaállítás (most a link a regisztrációra visz)
- Edzés megosztása képként — a leggyakoribb organikus növekedési csatorna ezeknél az appoknál

## Amit szándékosan nem

- **Edzésidő-becslés** — kifejezett kérés, hogy ne legyen
- **Naphoz kötött terv** („hétfő: Upper") — a split négy önálló kártya
- **Gyakorlatadatbázis** — a terv kész, a böngészhető katalógus csak zajt adna
- **Testfigura a trackeren** — a radar és a számok elegendőek
