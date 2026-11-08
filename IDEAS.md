# Ötletek — mi jöhet ezután

Amit Hevy, Liftoff, Strong és a Boostcamp már megoldott, és ebbe a splitbe is beillik.
Sorrend: amitől ténylegesen jobb lesz az edzés közbeni használat, nem ami szépen hangzik.

## Már bent van

- Pihenőidő-számláló, a szett pipálásakor indul (Hevy)
- Személyes rekord jelzése a soron és az összegzőn (Hevy, Strong)
- Előző szett előtöltése gyakorlatonként (Liftoff)
- Előző heti súly és ismétlés a mező halvány alapértékeként
- Fióktörlés megerősítéssel, CSV-exporttal, 30 napos visszaállítással
- **Szettípus-jelölés** — a szett számára koppintva normál → B (bemelegítő) →
  D (drop) → K (kudarcig). A bemelegítő nem számít effektív sorozatba, nem lehet
  rekord, és rövidebb pihenőt indít. Az összegző külön kiírja, mennyi volt belőle.
- **Offline működés** — service worker tartja a vázat és a betűket, így térerő
  nélkül is elindul. A napló amúgy is a telefonon van.
- **Jelzés a pihenő végén** — három rövid hang és rezgésminta, plusz rövid rezgés
  a szett pipálásakor. Mellé a kijelző ébren tartása edzés közben (Wake Lock).
  Mindkettő kikapcsolható a profilban.
- **Progressziójavaslat** — ha múltkor minden szett elérte az ismétléssáv felső
  értékét, a gyakorlat fejlécében megjelenik a +2,5 kg javaslat, egy „Kitölt"
  gombbal, ami be is írja a sáv alsó ismétlésszámával.

## Következő — ezt vinném tovább

### 1. Import Hevyből / Strongból (CSV)
Az „össz súly" mező egy kerülőút arra, hogy a felhasználónak van előtörténete.
A valódi válasz: töltse be a régi naplóját, és onnantól igazi rekordjai és trendjei
lesznek. Ugyanaz a CSV-séma, amit most exportálunk — a szettípus oszloppal együtt.

### 2. A tracker a naplóból is számoljon
A radar ma a split *tervét* mutatja (heti 13,5 effektív sorozat mellre).
Mellé kellene egy „Napló" mód: mennyi jött össze tényleg az elmúlt 7 vagy 30 napban,
bemelegítő nélkül. A szettípus-jelölés már megvan hozzá, az adat is — csak a nézet
hiányzik. Ettől lesz a bemelegítő-jelölés igazán hasznos.

### 3. Progresszió visszafelé is
Ma csak felfelé javaslunk. Ha két egymást követő alkalommal sem jött össze a sáv alja,
jelezze, és ajánljon deloadot — ez az, ami megóv a megrekedéstől.

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
