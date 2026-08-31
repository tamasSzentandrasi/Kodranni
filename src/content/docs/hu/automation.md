---
title: Automatizálás
description: Miért hibrid TTRPG a Kodranni, közös lapok, és a Fluxer/Discord automatizálási szerződés.
---

----------

## Miért van automatizálás

A Kodranni **hibrid** asztali rendszer: először a történet, alatta a szoftver mint főkönyv és kockamotor. Automatizálás nélkül ennek a Guidebooknak több eljárása könyvelésbe fullasztaná az asztalt.

### Mit nyer az asztal

- **Egy élő feljegyzés** karakterenként és közösségenként — nincsenek szétágazó füzetek.
- **Gyors feloldás** a készleteknél, ómeneknél, különbségeknél, **Practice**, **Exertion**, **Harm** és **Tide** mezőknél — hogy a fikciót ne állítsa meg a számolás.
- **Állapot a tett pillanatában** — ki dob, mennyi **Exertion** maradt, **Echoes**, **Myths** — anélkül, hogy a lapokat chatbe gépelnéd.
- **Online folytonosság** ülések között a közös lapokon és a közösségi lapon.

Ez a lap az asztalnak szóló szerződés. A mérnöki irány a projekt forrásában van, és változik, ahogy a termék UI-ja kialakul. A mesélő kampányeszközei egy webes pultra költöznek, amely a közös tracker és a lapok klónja; a Discord és a Fluxer marad az asztal beszélgetése és kockája. A **Harm** alkalmazása mindkét helyen létezhet.

----------

## Egyetlen igazságforrás

| Felület | Ki használja | Mit tart |
|---------|--------------|----------|
| **Guidebook** (ez a lap) | Mindenki | Szabályok — egy nyilvános szabálykészlet |
| **Character sheet** | Játékos + mesélő (közös nézet) | Egy élő feljegyzés karakterenként — **Foundations**, **Skills** (**beleértve a Practice haladást**), **Traits**, **Exertion**, **Echoes**, **Harm**, Hierarchy-helyek, **Inventory**, **flags** |
| **Community tracker** | Az asztal (közös nézet) | **Fortunes**, **Foundation Myths**, **Hierarchy Diagram** (≤5 tengely) |

A lapok és a tracker **közösségenként** léteznek. A hosztolás és a megosztás moduláris: a közösség adata az igazság; a chatfelületek csak utasításokat hajtanak rá.

**Nincs** külön *„player sheet”* és *„ST sheet”* ugyanarra a karakterre. Az **adat** nem ágazik. A **Practice** haladás **látható** a lapon annak, aki nézni akarja.

**Nem** a fő Community trackeren (üléseszközök, nem állandó közösségi állapot):

- **Tide** — akkor nyílik, ha kell; ha egy Tide véget ér, ami marad, általában napló arról, hol állt le — nem állandó tracker-mező.
- **Scene Omen faces** — a mesélő listázza, kezeli és törli őket; jeleneteszközök, nem közösségi sorsok.

----------

## Platformok

Az automatizálás **két platformot** támogat, egyenrangú chatfelületként:

| Platform | Szerep |
|----------|--------|
| **Fluxer** | Chatfelület guild/szerver-kötéssel, tokenbeállítással, fiók-hozzárendeléssel |
| **Discord** | Ugyanaz a viselkedés; guild ID-k, tokenbeállítás, fiók-hozzárendelés |

Minden telepítés platform-hitelesítőadatot, **guild / server ID**-t (vagy Fluxer-megfelelőt) és a **közösség** feljegyzését köti. A botok **fiók-ID-kat és nickeket** is karakterekhez rendelik, hogy a célzott utasítás mindig tudja, *melyik játékos karakterét* szólítja.

A botok vékony kliensek a közösségi tároló fölött. A puszta perjel-bot nem elég: a játékos felőli UI-n a **Foundation**, **Skill**, fok, **Exertion**, **Echo**/**Myth** jelölés és a jóváhagyások **könnyen választhatók** legyenek, a platform beépített erősségeit használva először (menük, gombok a mesélői **Approve**/**Deny**-hoz, válaszszálak) — kutatott, újító, jó UX, nem gombok fala.

Ülések között és alatt a játékosok **áttekinthető közös nézetet** is használnak a lapokról és a Community trackerről: **élő** URL, amíg a mesélő ülése fut, és **nyilvános archívum** URL (kampánybemutató oldal), ha nem. A platform fiók-hozzárendelései és a teljes napló a mesélő gépén maradnak — nem a nyilvános oldalon.

----------

## Tervezési elvek

1. **Mesélői hatalom** — Tartós változáshoz mesélői jóváhagyás kell, ahol a szabályok ezt mondják (Hierarchy, Inventory és hasonlók). A jóváhagyás **mesélői gombokkal** megy (**Approve** / **Deny**) a kérésüzeneten.  
2. **Először a fikció, aztán az utasítás** — A narrációban a mesélő megnevezi a **Foundation**t és a **Skill**t (vagy egyedül a Foundationt **Primitive**-nél). A **játékos** indítja a dobásutasítást a megállapodott beállítással. Az automatizálás már tudja a hozzárendelt fiókot és a karakterét; a UI-n ott az **Exertion**, a választható **Echoes** és a jelölhető közösségi **Myths**.  
3. **A kockafok ki van mondva** — Biztonságos alap **d8**; a végső döntés a mesélőé az [előny és hátrány](/hu/marks-and-tiers/#előny-és-hátrány) szerint.  
4. **Következtess, ha biztonságos; kérj mezőt, ha a fikció dönt** — Olyan állapotok, mint a **Decadence** (hanyatlás) vagy a teherbírás-túllépés, az interakciókban kikövetkeztethetők, hogy kevesebb legyen a könyvelés. Az **Armour** és a **Reputation** továbbra is külön mezőt kíván: a jelenlétük a fikcióban dől el, mielőtt bármely arány számolódna. A Hierarchy **szintjei** teljes létrák, nem csak **Outsider**/**Ruler**; a relatív szintekülönbség narratívan rögzül, aztán az utasításban érvényesül.  
5. **Válaszláncok** — Az ellendobás egyszerűen **dobás válaszként** egy korábbi dobásüzenetre (bármely Foundation + Skill pár; játékos vagy mesélői NPC-dobás). A **Tide**-hozzájárulás a Tide-eseményre vagy egy már ahhoz kötött dobásra adott válaszokból jön.  
6. **Készletminimum** — Egy készlet sem esik 1 kocka alá.  
7. **Külön felépülés** — Az **Exertion** visszavétele és a **Harm** gyógyulása külön lépés a narratív pihenő után.  
8. **Egy közösségi tároló** — A lapok és a tracker soha nem ágaznak szét platformok között.  
9. **Végrehajt, mutat, követ** — Az automatizálás elsődleges dolga: végrehajtani az utasítást, mutatni az eredményt, megőrizni a változást. Balesetre: **Revert last roll**.

----------

## Képességtérkép

| Képesség | Játékos | Mesélő | Automatizálás |
|----------|---------|--------|---------------|
| **Player roll** | A megállapodott beállítással indítja; **Exertion** / **Echo** / **Myth** jelölés a UI-n | A fikcióban megnevezi a Foundation + Skill (vagy Primitive) párt és a fokot | Hozzárendeli a fiókot → karakterre; a készletet a lapból tölti; dob + Omen; frissíti a Practice/Exertiont |
| **Storyteller NPC roll** | — | ST dobásmenetet használ: Foundation, Skill, Exertion, fok stb. (nincs PC-lap) | Dob és jelent; nincs PC-lap változás, hacsak nincs célpont |
| **Opposed margin** | Válasz-dobás a fikcióban | A különbséget értelmezi | Észleli a válaszlinket; kiszámolja a jelek különbségét |
| **Omen faces** | — | Jelenetlapokat listáz / beállít / töröl | Minden dobáson jelzi a beállított + alapértelmezett lapokat |
| **Tide** | Cselekszik; a válasz-dobások kapcsolódhatnak | Nyit/zár; méret és erőviszony | Követi, amíg nyitva; történet, ha zárva |
| **Practice** | Látható a lapon | **Prompt degrade** (időugrás) | Gyűlik; emel fokot; kért romlás |
| **Exertion** | Játékos dobásokra fekteti bele | Pihenőt/esemény-apasztást ad | Követi a készletet; üres büntetés; biztonságos esetben következtet |
| **Echoes** | Létrehoz / felidéz / lezár a mesélővel | Hangnemet vétóz; a lezárás jutalmát adja | Súlyt mér a teherbíráshoz; a mesélő rendelte lapváltozásokat alkalmazza |
| **Fortunes** | — | Igazít | A Community trackeren |
| **Foundation Myths** | Dobáson jelöl, ha illik | Kapcsolható/összeadható hatásokat farag (csak ST) | Csak jelölve érvényesül |
| **Harm / Dying** | — | Sávot választ; alkalmaz; gyógyít (külön) | Követi; Dying; halálmenet |
| **Hierarchy Diagram** | Mozgatást kér | **Approve** (gomb) | ≤5 tengely a trackeren |
| **Inventory** | Változást kér; étel/víz utánpótlás | **Approve** (gomb) | Közös lap-felszerelés |
| **Character / Weighing** | A koncepciótól tovább | Véglegesít; a **Word** a **beszélő** lapján költődik; a mesélő jelöli a **célpontot** | Keretek; magán Omen-dobások; lapfrissítés |
| **Legacy** | Echo-ként faragva a mesélővel (nem külön botút) | Ugyanaz, mint más Echo-kimenet | Hétköznapi Echo / lapváltozások |

----------

## Asztali menet (játékosi akció)

```text
A játékos elmondja a szándékot (szerepjáték)
        ↓
A mesélő a fikcióban megnevezi: Foundation + Skill | Primitive,
  és a kockafokot (alapból d8) — Advantage/Disadvantage a kontextus szerint
        ↓
A játékos elindítja a dobásutasítást (hozzárendelt fiók → karakter).
  A UI már mutatja: Exertion, választható Echoes, jelölhető Myths.
  A játékos választja, mit tesz bele és mit jelöl; megerősít.
        ↓
Az automatizálás dob a fő készlettel + Omennel; mutatja az eredményt;
  követi a lapváltozásokat (Practice, Exertion, flags…)
        ↓
A mesélő elmeséli a kimenetelt (+ Consequence, ha az Omen lapot hoz)
        ↓
Ha tartós állapot jóváhagyást kíván (zsákmány, rang…):
  kérés → mesélő gomb Approve → közös lap/tracker
  (az élő közös nézet azonnal frissül; a nyilvános archívum követi)
```

**Mesélő NPC-t dob:** külön ST dobásutasítás kifejezett számokkal (Foundation, Skill, Exertion, fok, Advantage). Nincs játékoskarakter-lap.

**Ellendobás:** bármely dobás (játékos vagy ST) **válaszként** egy dobásüzenetre. A pároknak nem kell egyezniük.

**Tide-kötött:** válasz a Tide-eseményre vagy egy már azon a Tide-on lévő dobásra.

**Baleset:** **Revert last roll**.

----------

## A Megmérettetés (automatizálási mélység)

- A karakterfeljegyzés a **Character Concept**nél születik; a kezdeti Foundation- és Skill-kereteket ekkor kapja.  
- **Birth Omen** (születési ómen) és **Guiding Hand** (vezető kéz): az automatizálás dob; a pontok a piszkozatlapra kerülnek.  
- **Words** / **Wanting**: a beszélő egy **Word**et a **saját** lapján költ (a menüből). A mesélő jelöli az elfogadott állítás **célpontját**. A színház emberi marad; a számolás és a megőrzés nem.

----------

## Beállítás (még alakul)

A telepítési lépések, a Fluxer vs Discord tokenek, a fiók-hozzárendelés és a UI-kutatás a projekt forrásához tartoznak, és változnak. Amíg a termék el nem készül, ezt a fejezetet **viselkedési szerződésnek** vedd.

Parancs**családok** (a nevek a UX-tervet követik):

- **Player roll** / **Storyteller roll** — az Omen mindig benne van; nincs külön *„omen command”*  
- **Reply** = ellendobás vagy Tide-kötés, ha a szülő dobás vagy Tide-esemény  
- Exertion award · Harm apply/heal (külön) · Tide open/close  
- Scene Omen list/set/clear (ST)  
- Echo · Myth craft (ST) · Fortune  
- Hierarchy kérés + ST gomb **Approve** · Diagram a trackeren  
- Inventory kérés + **Approve** · restock  
- Character sheet · Community tracker · Practice degrade (promptolt) · **Revert last roll**

A mérnöki jegyzetek a projekt forrásában vannak, nem ezen a lapon.

Kapcsolódó: [Kockamechanika](/hu/dice-mechanics/), [Karakteralkotás](/hu/character-creation/), [Hierarchiák](/hu/hierarchies/).

----------
