---
title: Automatizálás
description: Egy élő feljegyzés, a mesélői pult, és ugyanaz a chat-szerződés Discordon és Fluxeren.
---

----------

## Miért van automatizálás

A Kodranni **hibrid** asztali rendszer: először a történet, alatta a szoftver mint főkönyv és kockamotor. Automatizálás nélkül ennek a Guidebooknak több eljárása könyvelésbe fullasztaná az asztalt.

### Mit nyer az asztal

- **Egy élő feljegyzés** karakterenként és közösségenként — nincsenek szétágazó füzetek.
- **Gyors feloldás** a készleteknél, ómeneknél, különbségeknél, a gyakorlatnál, az erőfeszítésnél, a sérülésnél és a sodrásnál — hogy a fikciót ne állítsa meg a számolás.
- **Állapot a tett pillanatában** — ki dob, mennyi erőfeszítés maradt, visszhangok, alapítómítoszok — anélkül, hogy a lapokat chatbe gépelnéd.
- **Online folytonosság** ülések között a közös csarnokon és a lapokon.

Ez a lap az asztal szerződése. A csarnok és a lapok egy feljegyzés. Azon a gépen, amely a feljegyzést tartja, ugyanezek a lapok a **mesélői pult** (Storyteller Desk), és a változtatás eszközei ott vannak. A Discord és a Fluxer viszi a dobást, a sodrást, és a chatben kimondott szót. A frissen mutatott dobás sérülése az eredménykártyán és a pulton is beírható.

----------

## Egy feljegyzés

| Felület | Ki használja | Mit tart |
|---------|--------------|----------|
| **Guidebook** (ez a lap) | Mindenki | A szabályok |
| **Csarnok és lapok** | Az asztal | Sorsok, alapítómítoszok, a hierarchiaábra, frakciók, a karaktertérkép (character map), és személyenként egy lap — adottságok, jártasságok (benne a gyakorlat), vonások, erőfeszítés, visszhangok, sérülés, felszerelés |
| **Mesélői pult** | Mesélő | Ugyanezek a lapok, azon a gépen, amely a feljegyzést tartja, a változtatás eszközeivel |
| **Discord** és **Fluxer** | Az asztal | Dobások, a sodrás kártyája, a jelenet táblája, a Megmérettetés kockái, szavak |

Karakterenként egy lap. A gyakorlat látható annak, aki megnézi. A Discord és a Fluxer ugyanazt a feljegyzést olvassa és írja.

A csarnok állandó állapotán kívül marad, mert az ülésé:

- **Sodrás** (Tide) — egy nyitott sáv. Ha lezárul, a kártya történetként megmarad. Nem sors.
- **Jeleneti ómenlapok** (Scene Omen faces) — erre a jelenetre írva. A **7** és a **13** mindig érvényes. Minden más lapot a mesélő a pulton ír be. A csatorna mutatja a listát, és hogy mit tesz az egyes lap.
- **Restore** — ha a pihenőt eljátszottátok, a mesélő a pulton jegyzi az ételt, a vizet és az erőfeszítést.

----------

## Discord és Fluxer

A Discord és a Fluxer egy chat-szerződés. Mindkettő szervert, játékcsatornát és mesélői szerepet köt, és a fiókokat karakterekhez rendeli. Egy parancs mindkettőn ugyanazt jelenti.

A játékosok egy címet tartanak a csarnokhoz. Amíg az ülés tart, ez a cím az élő asztal. Ha az ülés áll, az utolsó nyilvános feljegyzést mutatja. A fiókok hozzárendelése a mesélő gépén marad.

### Parancsok

| Parancs | Ki | Mit tesz |
|---------|-----|----------|
| `/roll` | A kötött játékos | Azt a karaktert dobja. Adottság, jártasság, kockafok, erőfeszítés, és melyik visszhang érvényes. |
| `/select` | Játékos, akinek több élő karaktere van | Kiválasztja, melyiket veszi a `/roll`. Egy karakternél használatlan. |
| `/roll` és egy név | Mesélő | Lappal bíró NPC-t dob annak a személynek a nevében. A számokat a lap adja. |
| `/npc-roll` | Mesélő | Aki lap nélkül van: felirat, adottságkockák, jártasságkockák, kockafok. A sérülésnek nincs sávja, ahová essen. |
| `/intent` | Mesélő | Megállapodott készletet tesz ki egy megnevezett játékosnak. |
| `/create`, `/claim` | Játékos | Piszkozatot nyit, vagy lefoglal egy előkészített személyt. |
| `/birth-omen`, `/guiding-hand` | Az a játékos és a mesélő | Magán kockák. A pontok a piszkozatra kerülnek. |
| `/award-word` | Mesélő | Egy szót ír a beszélő javára, A Kívánáshoz. |
| `/tide` | Mesélő | Megnyitja a sodrás kártyáját. |
| `/review` | Mesélő | Megismétli a hírt, hogy egy karakter a pulton vár. |

Válasz egy dobásra: ellendobás. Válasz a sodrás kártyájára, vagy egy már ahhoz kötött dobásra: a sodrás lép. Az eredmény csatornaüzenet. Az adottság és a jártasság párjának nem kell egyeznie.

----------

## Az asztalnál

1. **Először a fikció.** A jelenetben a mesélő megnevezi az adottságot és a jártasságot, vagy primitív akciónál csak az adottságot, és a kockafokot. A biztonságos alap a **d8**. Az [előny és a hátrány](/hu/marks-and-tiers/#előny-és-hátrány) a mesélő döntése.
2. **A játékos dob.** A `/roll` a fiókhoz kötött karaktert használja. A lap már tudja az erőfeszítést, a visszhangokat és az alapítómítoszokat. A játékos megerősíti, mit fektet bele, és melyik visszhang érvényes, ha az asztal megegyezett, hogy a visszhang illik.
3. **A készlet padlója 1 kocka.**
4. **A kártya az eredmény.** Jelek, az ómen, és hogy miért ekkora a készlet. A mesélő erről a kártyáról vonhatja vissza a dobást.
5. **Ami származtatott, az származtatott marad.** A hanyatlás és a teherbírás túllépése a lapból következik. A páncélt és a hírnevet akkor írod a lapra, ha a fikció eldöntötte őket.

**Lappal bíró NPC.** A mesélő `/roll` a személy nevével. A tényleges adottság, a jártasság, a páncél, az erőfeszítés, a visszhangok és a sérüléssávok a lapról jönnek.

**Aki lap nélkül van.** `/npc-roll`. Felirat és a kockák. A világ legtöbb embere soha nem kap lapot. Lap a játékoskaraktereké, és azoké, akik vissza fognak térni.

**Ellendobás és sodrás.** Válasz, ahogy fent.

----------

## Hol változik a feljegyzés

**Sodrás.** A `/tide` egy kártyát tesz ki. A mesélő megadja a méretet (kis csetepaté, csetepaté, csata), az erőviszonyt, a két oldal nevét, és mindkét oldal színét. A kártya a [Sodrás](/hu/tide/) fejezet sávját mutatja, és minden kötött válasz frissíti a képet. A mesélő a kártyáról zárja a sodrást. A pult mutatja, nyitva van-e.

**Jeleneti lapok.** A mesélő a pulton veszi fel, javítja és törli őket. A mentés újraírja a csatorna tábláját, amelyet az asztal olvas.

**Megerősítés.** Ha egy karaktert beküldesz, a chat hírt kap, és az a változat a pultra kerül. A mesélő megnyitja, úgy szerkeszti, mint bármely más személyt, aztán játékba veszi, vagy a szerkesztéseivel együtt visszaküldi. A `/review` csak a hírt ismétli.

**Restore.** A pulton a mesélő kiválasztja, ki pihent. Személyenként: költ egy ételnapot, vagy hagyja, költ egy víz-napot, vagy hagyja, és beírja, hány erőfeszítéspont tér vissza. Az [Erőfeszítés](/hu/exertion/#visszatöltés) javaslatai ehhez a számhoz adnak támpontot. A sérülés külön szerkesztés az adott személyen. Aki benne volt, kaphat magán hírt.

**A csarnok és a személy.** A sorsok az öt gomb, Válságtól Bőségesig. Az ábra mozgatását kimondjátok, aztán a mesélő a pulton megteszi. A frakciók a saját kategóriáikban élnek. Visszhang, felszerelés, vonás, gyakorlat és páncél a személyen szerkeszthető. Ajándékba adott étel vagy víz a két lap szerkesztése. A karaktertérképet a mesélő letölti, a csarnokon kívül szerkeszti, és feltölti. Ha egy időugrás a gyakorlat romlását kéri, a pult az adott személyen javaslatot ad, és a mesélő megerősíti.

**Sérülés** a frissen mutatott dobásból az eredménykártyán kerül a lapra. A haldokló stabilizálása szerkesztés azon a személyen: a haldoklás megszűnik, a sáv 3-on marad, és a vonást, amely rendszerint megmarad, ott írod be.

----------

## A Megmérettetés (automatizálási mélység)

- A karakterfeljegyzés a **Character Concept**nél nyílik; az adottság- és jártasságkereteket ekkor kapja.
- **Születési ómen** (Birth Omen) és **vezető kéz** (Guiding Hand): a kockák magánban maradnak, annak a játékosnak és a mesélőnek. A pontok a piszkozatra kerülnek.
- **Szavak / A Kívánás**: az `/award-word` egy szót ír a beszélő javára. A saját lapján költi, a menüből. A mesélő az elfogadott állítás **célpontját** úgy jelöli, hogy azt a személyt szerkeszti. Ha az asztal elutasít egy Kívánás-eredményt, a mezők szerkesztésével javítod. A színház emberi marad.

----------

Kapcsolódó: [Kockamechanika](/hu/dice-mechanics/), [Karakteralkotás](/hu/character-creation/), [Hierarchiák](/hu/hierarchies/), [Sodrás](/hu/tide/), [Erőfeszítés](/hu/exertion/).

----------
