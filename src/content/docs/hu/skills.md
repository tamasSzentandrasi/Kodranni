---
title: Jártasságok
description: Jártasságok hat őstípus alá rendezve, gyakorlattal és fejlődési szabályokkal.
---

> *„Az emberek úgy tettetnek, mintha nem szeretnék a szőlőt, ha a tőke túl magas, hogy elérjék.”*
> — *Marguerite de Navarre*

----------

<figure class="kod-breath not-content">
<img src="/scenes/vineyard.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

A **jártasságok** (Skills) hat **őstípus** (Archetype) alá vannak rendezve. Az őstípusok nem kasztok. Mindegyik elnevezett, rokon jártasságcsoport; a karakter bármelyikből vehet.

**A jártasságok 0 és 3 között értékeltek.**

| Fok | Jelentés |
|-----|----------|
| **0** | Nincs érdemi gyakorlottság abban a konkrét jártasságban |
| **3** | Rendkívül gyakorlott abban a területen |

Minden jártasságnak egy irányító **[adottsága](/hu/foundations/)** van, ami a [gyakorlat](#fejlődés) küszöbeit szabja.

A konkrét technikák, tájegységi stílusok, megnevezett eszközök és igen-nem képességek **[vonások](/hu/traits/)** maradnak — nem jártasságok. Vagy megvan a technika, a szerszámhoz való kéz, az állapot — vagy nincs.

Az asztalnál a mesélő azt a jártasságot választja, ami a játékos leírt szándékához a legjobban illik, amikor a [kockakészletet](/hu/marks-and-tiers/#a-kockakészlet-felépítése) építi.

----------

## Fejlődés

Minden alkalommal, amikor egy **jártasság** dobáson szerepel, **gyakorlatot** (Practice) hozhat (az [automatizálás](/hu/automation/) követi). A [primitív](/hu/marks-and-tiers/#a-kockakészlet-felépítése) akciók **nem** adnak gyakorlatot — nincs jártasság.

A gyakorlat szorosan az **[erőfeszítéshez](/hu/exertion/)** kötött. A **jelek** csak akkor válnak gyakorlattá, ha erőfeszítést fektettél bele — győzelemkor **és** vereségkor. A vereség **+2**-t is ad. A kettő összeadódik. A küzdelem és a befektetett erő tanít; a kockázat nélküli őrlés nem.

**Ellendobás** — a gyakorlat a **jelek különbségét** használja (a te jeleid mínusz az övék). A **0** különbség döntetlen: nem vereség, és nincs automatikus jutalom.

| Eredmény | Nincs erőfeszítés | Erőfeszítés belefektetve |
|----------|-------------------|--------------------------|
| **Nyert** | — | + jelek különbsége |
| **Vesztett** | +2 | + jelek különbsége **és** +2 |
| **Döntetlen** | — | — |

**Ellendobás nélkül**

| Eredmény | Nincs erőfeszítés | Erőfeszítés belefektetve |
|----------|-------------------|--------------------------|
| **Több kudarc, mint jel** | +2 | +2 **és** +1 két jelenként (lefelé) |
| **Jelek ≥ kudarcok** | — | +1 két jelenként (lefelé) |

<div class="kod-widget not-content" data-widget="practice-award">
<p class="kod-widget__title">Mit ér ez a dobás</p>
<p class="kod-widget__intro">Válaszd a dobást, és hogy fektettél-e bele erőfeszítést. A primitív akciók nincsenek itt — semmit sem adnak.</p>
<div class="kod-widget__controls" role="group" aria-label="Dobás típusa">
<button type="button" class="kod-widget__btn" data-practice-kind="opposed" aria-pressed="true">Ellendobás</button>
<button type="button" class="kod-widget__btn" data-practice-kind="unopposed">Ellendobás nélkül</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Eredmény" data-practice-results="opposed">
<button type="button" class="kod-widget__btn" data-practice-result="won" aria-pressed="true">Nyert</button>
<button type="button" class="kod-widget__btn" data-practice-result="lost">Vesztett</button>
<button type="button" class="kod-widget__btn" data-practice-result="tie">Döntetlen</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Eredmény" data-practice-results="unopposed" hidden>
<button type="button" class="kod-widget__btn" data-practice-result="struggle" aria-pressed="true">Több kudarc</button>
<button type="button" class="kod-widget__btn" data-practice-result="held">Jelek ≥ kudarcok</button>
</div>
<div class="kod-widget__controls" role="group" aria-label="Erőfeszítés">
<button type="button" class="kod-widget__btn" data-practice-exert="no" aria-pressed="true">Nincs erőfeszítés</button>
<button type="button" class="kod-widget__btn" data-practice-exert="yes">Erőfeszítés belefektetve</button>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-won-no">
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>4–1-re győztél — különbség <strong>3</strong>. Nincs erőfeszítés. A jelek nem válnak gyakorlattá. A győzelemből semmi.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-won-yes" hidden>
<p class="kod-practice-award__total"><strong>+3</strong></p>
<p>Ugyanaz a 4–1 győzelem. Erőfeszítés belefektetve. A jelek különbsége <strong>3</strong> gyakorlattá válik. Nem vesztettél, tehát nincs +2.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-lost-no" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>4–2-re levertek — különbség <strong>2</strong>. Nincs erőfeszítés. A jelek nem válnak gyakorlattá. A vereség így is <strong>+2</strong>-t ad.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-lost-yes" hidden>
<p class="kod-practice-award__total"><strong>+4</strong></p>
<p>Ugyanaz a 2–4 vereség. Erőfeszítés belefektetve, a jelek különbsége <strong>2</strong> átvált. A vereség <strong>+2</strong>-t ad. Összeadódnak: <strong>2 + 2 = 4</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-tie-no" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>Különbség <strong>0</strong>. A döntetlen nem vereség. Nincs +2. Nincs erőfeszítés, a jelek sem válnak gyakorlattá.</p>
</div>
<div class="kod-widget__panel" data-panel-id="opposed-tie-yes" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>Különbség <strong>0</strong>. Az erőfeszítés a döntetlent nem mozdítja. Nincs különbség, ami átváltson. Nincs +2.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-struggle-no" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>Több kudarc, mint jel (1 jel, 3 kudarc). Nincs erőfeszítés. A küzdelem <strong>+2</strong>-t ad. A jelek nem válnak gyakorlattá.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-struggle-yes" hidden>
<p class="kod-practice-award__total"><strong>+3</strong></p>
<p>Több kudarc, mint jel, és erőfeszítés belefektetve. Küzdelem <strong>+2</strong>, plusz floor(3 jel ÷ 2) = <strong>+1</strong>. Összeadódnak: <strong>2 + 1 = 3</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-held-no" hidden>
<p class="kod-practice-award__total"><strong>+0</strong></p>
<p>4 jel, 1 kudarc — a jelek nyerik a számolást. Nincs küzdelmi jutalom. Nincs erőfeszítés, ezek a jelek nem válnak gyakorlattá.</p>
</div>
<div class="kod-widget__panel" data-panel-id="unopposed-held-yes" hidden>
<p class="kod-practice-award__total"><strong>+2</strong></p>
<p>Ugyanaz a 4 jel. Erőfeszítés belefektetve. floor(4 ÷ 2) = <strong>+2</strong>. Nincs küzdelmi jutalom — a jelek már verték a kudarcokat.</p>
</div>
</div>

A gyakorlat küszöbök ellen gyűlik:

| Jelenlegi jártasság | Alapküszöb |
|---------------------|------------|
| 0 → 1               | 24         |
| 1 → 2               | 48         |
| 2 → 3               | 72         |

Ezeket a küszöböket a jártasság uralkodó **adottsága** módosítja:

| Adottság | Küszöbmódosító |
|----------|----------------|
| **3** (átlag fölötti) | Felezve |
| **2** (átlagos) | Alapértékek |
| **1** (átlag alatti) | Duplázva |

A magas veleszületett lehetőség gyorsítja a tanulást. Az alacsony lassítja. Az automatizálás kezeli a gyűjtést és az emelést. A pontos gyakorlat az **élő lapon** (live character sheet) látszik. Az adapterek nem írják ki a gyakorlat mennyiségét — nézd a lapot.

<figure class="kod-breath not-content">
<img src="/scenes/practice.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

<div class="kod-widget not-content" data-widget="step-flow" id="practice-track">
<p class="kod-widget__title">Gyakorlat — a reflexíj a sztyeppén</p>
<p class="kod-widget__intro"><strong>Temur</strong>, ifjú íjkészítő, állóképesség 2, íj- és nyílkészítés 0 → 1 (küszöb <strong>24</strong>). <strong>Qara</strong>, az orda öreg íjkészítője, karizma 2, mentorálás 1 → 2 (küszöb <strong>48</strong>). Hun tábor. Szarv, ín, és egy makacs has.</p>
<p class="kod-step-flow__label" data-step-label></p>
<div class="kod-step-flow__track" role="group" aria-label="Gyakorlat lépései">
<button type="button" class="kod-widget__btn" data-tab="p1" aria-pressed="true">1</button>
<button type="button" class="kod-widget__btn" data-tab="p2">2</button>
<button type="button" class="kod-widget__btn" data-tab="p3">3</button>
</div>
<div class="kod-widget__panel" data-panel-id="p1" data-step-title="Az első hajlítás">
<p>Temur gőzöli a szarvat, és megpróbálja a reflexíj első hajlítását. A has ellenáll. Több kudarc, mint jel. Nem fektet bele erőfeszítést.</p>
<p><strong>Temur</strong> · szembenállás nélkül állóképesség + íj- és nyílkészítés · több kudarc, mint jel · nincs erőfeszítés → <strong>+2 gyakorlat</strong> (íj- és nyílkészítés).</p>
<p>Temur: <strong>2 / 24</strong>. Qara még nem dobott.</p>
</div>
<div class="kod-widget__panel" data-panel-id="p2" data-step-title="Az öreg leül" hidden>
<p>Qara leül. Megnevezi az utolsó réteg hibáját, és érezteti Temurral a fában. Akarat + mentorálás, <strong>d8</strong>. Erőfeszítést fektet bele. <strong>3 jel</strong>.</p>
<p><strong>Qara</strong> · szembenállás nélkül · erőfeszítés belefektetve · floor(3 ÷ 2) → <strong>+1 gyakorlat</strong> (mentorálás). Qara: <strong>1 / 48</strong>.</p>
<p>Temur még az este újra nekilát a hasnak, most erőfeszítést fektet bele. <strong>4 jel</strong> → <strong>+2 gyakorlat</strong> (íj- és nyílkészítés). Temur: <strong>4 / 24</strong>.</p>
</div>
<div class="kod-widget__panel" data-panel-id="p3" data-step-title="Íjazd fel" hidden>
<p>Qara nem dicsér, amíg az íj nem lő. *„Íjazd fel. A nád a kocsinál.”* Temur erőfeszítést fektet bele, és a szarvazat így is leveri — ellendobásos vereség 1 jellel.</p>
<p><strong>Temur</strong> · ellendobásos vereség · erőfeszítés belefektetve · jelek különbsége <strong>1</strong> + vereség <strong>+2</strong> → <strong>+3 gyakorlat</strong> (íj- és nyílkészítés). Temur: <strong>7 / 24</strong>.</p>
<p>Qara figyeli, és igazítja a fogást — újabb mentorálás-dobás, erőfeszítés, 2 jel → <strong>+1 gyakorlat</strong>. Qara: <strong>2 / 48</strong>. Mindketten tanultak. Az ifjú többet a vereségből.</p>
</div>
<div class="kod-step-flow__nav">
<button type="button" data-step-prev>← Vissza</button>
<button type="button" data-step-next>Tovább →</button>
</div>
</div>

<aside class="kod-counsel" aria-label="Tanács">
<p>A küzdelem tanít. Az erő számít. Vég nélkül, nehézség nélkül ismételni semmit sem ér.</p>
</aside>

### Romlás (csak kérésre)

A jártasságok akkor veszíthetnek haladást, ha a mesélő az automatizálástól időugrás vagy hasonló narratív szakasz értékelését kéri — nem folyamatosan a háttérben.

**Szokványos időugrás**

1. Vedd az **öt** jártasságot, amelynek a **legalacsonyabb** a gyakorlati haladása a következő fok felé.  
2. Dobj az **ómenkockával**.  
3. Ebből az ötből véletlenszerűen válaszd ki, hány jártasságot rontasz:

| Ómen | Rontott jártasságok (az ötből) |
|------|--------------------------------|
| 1–5 | 0 |
| 6–10 | 1 |
| 11–15 | 2 |
| 16–20 | 3 |

**Rövid időugrás (alternatíva)**

Ugyanaz az ötös készlet, de csak:

| Ómen | Rontott jártasságok |
|------|---------------------|
| 1–10 | 0 |
| 11–20 | 1 |

A fikció dönti el, *miért* ült rá a rozsda; az automatizálás csak a kért eljárást alkalmazza.

<aside class="kod-example">
<p class="kod-example__scene">Temur első hajlítása csúnya. Qara tanít. Egy csendes tél után ugyanazokon a legelőkön a mesélő rövid időugrást kér az automatizálástól az elhanyagolt jártasságokra.</p>
<ol class="kod-example__steps">
<li><strong>Temur, szembenállás nélküli íj- és nyílkészítés:</strong> több kudarc, mint jel, nincs erőfeszítés → <strong>+2 gyakorlat</strong>.</li>
<li><strong>Qara, mentorálás erőfeszítéssel, 3 jel:</strong> <strong>+1 gyakorlat</strong> (floor 3÷2). Temur később ugyanazon az estén, erőfeszítés, 4 jel → <strong>+2 gyakorlat</strong>.</li>
<li><strong>Rövid időugrás (a mesélő kéri):</strong> vedd az öt legalacsonyabb haladású jártasságot; ómen 1–10 → egyet sem ront; ómen 11–20 → egyet ront az ötből, véletlenszerűen.</li>
</ol>
</aside>

----------

## A hat őstípus

Minden őstípus egy szerepet nevez meg, és listázza a hozzá tartozó jártasságokat. A karakterek nincsenek egy őstípusra korlátozva. Minden jártasság mutatja az irányító adottságát és egy rövid meghatározást.

<div class="kod-archetypes not-content">

<details class="kod-archetype kod-archetype--warrior" id="warrior-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/warrior.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Harcos</span>
<span class="kod-archetype__tag">Harc és fegyveres fenyegetés</span>
</summary>
<div class="kod-archetype__body">
<p>A harcos a küzdelmet és az erőszak uralását fedi: fegyverek, védelem, megfélemlítés, harctéri parancs, és a harc olvasása. Ezek a harc jártasságai, és azé, hogy azonnali testi fenyegetés alatt embereket rendezz.</p>
<ol>
<li><strong>Vágás</strong> (erő) — vágóélek aprító vagy söprő vágásra</li>
<li><strong>Szúrás</strong> (ügyesség) — hegy és döfések</li>
<li><strong>Zúzás</strong> (erő) — tompa ütőfegyverek és csapások</li>
<li><strong>Fegyvertelen</strong> (erő) — ütés és birkózás fegyver nélkül</li>
<li><strong>Megfélemlítés</strong> (tekintély) — fenyegetés kivetítése kimutatott vagy sejtett erőszakos kapacitással</li>
<li><strong>Elhárítás</strong> (akarat) — aktív átirányítás fegyverrel vagy pajzzsal</li>
<li><strong>Riposzt</strong> (akarat) — a gyakorolt azonnali válasz sikeres elhárítás vagy kitérés után</li>
<li><strong>Vezénylés</strong> (tekintély) — parancsok, amelyeknek a harc hevében vagy azonnali testi fenyegetés alatt engedelmeskednek</li>
<li><strong>Taktika</strong> (értelem) — a harc alakjának olvasása, helyzet, a terep és a létszám kihasználása</li>
<li><strong>Pozicionálás</strong> (ügyesség) — mozgékonyság, egyensúly és helyzet a harcban</li>
<li><strong>Harci éberség</strong> (észlelés) — nyílások, fenyegetések és váltások észlelése a közvetlen harcban</li>
<li><strong>Hajítás</strong> (állóképesség) — bármely dobott fegyver vagy tárgy, amivel ütni vagy harcképtelenné tenni lehet</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--wayfarer" id="wayfarer-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/wayfarer.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Vándor</span>
<span class="kod-archetype__tag">Utazás és a szabad ég</span>
</summary>
<div class="kod-archetype__body">
<p>A vándor az utazást és a földből élést fedi: felderítés, vadászat, hátasok, kis hajók, vadonismeret és út menti csere. Ezek az ösvény, a tábor és a mező jártasságai — nem a háztartásé, és nem a formális tanulásé.</p>
<ol>
<li><strong>Felderítés</strong> (észlelés) — útkeresés, tájékozódás csillagok, tájjelek és ösvények alapján, terep olvasása utazáshoz</li>
<li><strong>Csapdázás és nyomolvasás</strong> (észlelés) — megtalálás, követés, csapdák tervezése és használata</li>
<li><strong>Gyűjtögetés és halászat</strong> (állóképesség) — ehető növények, gombák, vízforrások és halászat</li>
<li><strong>Íjászat</strong> (észlelés) — minden íj</li>
<li><strong>Hajózás és navigáció</strong> (észlelés) — kis hajók, folyók, tavak és alap tengerészet</li>
<li><strong>Állatkezelés</strong> (akarat) — vadállatok, és társállatok idomítása vagy kezelése</li>
<li><strong>Kitérés</strong> (ügyesség) — tiszta kitérés, testmozgás a támadás vonalából</li>
<li><strong>Lovaglás</strong> (tekintély) — hátas uralása harci és utazási nyomás alatt</li>
<li><strong>Lesállás és álcázás</strong> (ravaszság) — terep választása és természetes fedés meglepetéshez vagy rejtőzéshez</li>
<li><strong>Úszás</strong> (állóképesség) — mozgás és túlélés vízben</li>
<li><strong>Vadonismeret</strong> (állóképesség) — a természet, a terep és az élő világ ismerete</li>
<li><strong>Kereskedés</strong> (karizma) — csere, értékalku és piaci ügyek az úton</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--artisan" id="artisan-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/artisan.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Kézműves</span>
<span class="kod-archetype__tag">Készítés és építés</span>
</summary>
<div class="kod-archetype__body">
<p>A kézműves a fizikai munka készítését és javítását fedi: fém, fa, szövet, hajók, szerszámok, finom mesterség, és a munka irányítása. Ezek a műhely, az udvar és a kohó jártasságai.</p>
<ol>
<li><strong>Szabászat és vért</strong> (állóképesség) — szövet, bőr, puha anyagok, és védőfelszerelés készítése vagy javítása</li>
<li><strong>Kovácsolás</strong> (erő) — fém megmunkálása a kohónál</li>
<li><strong>Ács- és kőművesség</strong> (erő) — fa- és kőépítés, alakítás</li>
<li><strong>Erjesztés</strong> (állóképesség) — erjesztés és folyadékok tartósítása</li>
<li><strong>Finom mesterségek</strong> (ügyesség) — ékszer, üveg, és hasonló nagy pontosságú munka</li>
<li><strong>Hajóács</strong> (erő) — csónakok és hajók építése és javítása</li>
<li><strong>Mérnökség és tervezés</strong> (értelem) — egyszerű gépek, szerkezeti tervezés és mechanizmusok</li>
<li><strong>Íj- és nyílkészítés</strong> (állóképesség) — íjak, nyilak és kapcsolódó felszerelés</li>
<li><strong>Értékbecslés</strong> (észlelés) — tárgyak és anyagok értékének, hitelességének és minőségének megítélése</li>
<li id="handcrafting"><strong>Kézi készítés</strong> (ügyesség) — rögtönzött szerszámok és tárgyak csontból, fából, ínból, kőből és elérhető anyagokból</li>
<li><strong>Felügyelet</strong> (tekintély) — munkáscsoportok irányítása és összehangolása</li>
<li><strong>Szerelés és javítás</strong> (állóképesség) — meglévő szerszámok, mechanizmusok és tárgyak hibakeresése, igazítása, helyreállítása</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--mother" id="mother-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/mother.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Anya</span>
<span class="kod-archetype__tag">Háztartás és gondoskodás</span>
</summary>
<div class="kod-archetype__body">
<p>Az anya a háztartást és az emberek gondozását fedi: étel, gyógyítás, gyerekek, földművelés, háziállatok, és személyes befolyás a rokonságban és a házban. Nem nem, nem csak szülőké — a háztartás és a benne élők életben tartásának és összetartásának jártasságai.</p>
<ol>
<li><strong>Főzés és tartósítás</strong> (akarat) — étel készítése és tartósítása</li>
<li id="herbalism"><strong>Füvészet</strong> (értelem) — gyógynövények és mérgek</li>
<li><strong>Gyermekgondozás</strong> (akarat) — gyereknevelés és bábáskodás</li>
<li><strong>Állattenyésztés</strong> (akarat) — háziállatok tenyésztése, gondozása és kezelése</li>
<li><strong>Földművelés</strong> (erő) — talaj, termény, mező</li>
<li><strong>Empátia</strong> (karizma) — érzelmi állapotok olvasása és személyes támasz</li>
<li><strong>Előadás</strong> (karizma) — kifejezés hangon (ének), testen (tánc) és jelenléten (színjáték)</li>
<li id="healing"><strong>Gyógyítás</strong> (akarat) — a test, sebek és sérülések fizikai kezelése (kritikus a <a href="/hu/harm/#haldoklás">haldoklás</a> stabilizálásához)</li>
<li><strong>Illem</strong> (akarat) — illő formák, módok és társas viselkedés otthoni és kapcsolati helyzetekben</li>
<li><strong>Csábítás</strong> (karizma) — intim befolyás, báj és érzelmi nyomás személyes kapcsolatokban</li>
<li><strong>Befolyás</strong> (tekintély) — kapcsolati helyzet, kötelezettségek és családi horogok használata</li>
<li><strong>Ihletés</strong> (tekintély) — mások tettekre, érzésre vagy alkotásra indítása</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--sage" id="sage-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/sage.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Bölcs</span>
<span class="kod-archetype__tag">Tudás és tanács</span>
</summary>
<div class="kod-archetype__body">
<p>A bölcs a tudást, a feljegyzést és a formális tanácsot fedi: számítás, hagyomány, térképek, tanítás, nyomozás, tárgyalás, rítusok és hosszú távú tervezés. Ezek a tanulás, a beszéd és az emlékezet jártasságai. A stratégia itt hosszú távú tervezés; a harcos <strong>taktikája</strong> a közvetlen harcot fedi.</p>
<ol>
<li><strong>Vita és szónoklat</strong> (karizma) — szerkesztett érvelés és meggyőző beszéd</li>
<li><strong>Számvetés és könyvelés</strong> (értelem) — számok, főkönyvek, részesedések és gyakorlati számolás</li>
<li><strong>Nyomozás</strong> (észlelés) — rendszeres vizsgálat események, helyek és bizonyítékok után</li>
<li><strong>Néphagyomány és címertan</strong> (értelem) — helyi hagyomány, nemzetségek, jelek és emlékezett szokás</li>
<li><strong>Térképészet</strong> (értelem) — térképek, távolságok és feljegyzett földrajz</li>
<li><strong>Mentorálás</strong> (karizma) — mások tanítása, hogy a jártasság és az ítélet gyökeret verjen</li>
<li><strong>Ábrázolás</strong> (értelem) — műszaki rajz, ábrák, sémák és a tudás vizuális feljegyzése</li>
<li><strong>Tárgyalás</strong> (tekintély) — formális alku megállapodás felé a felek között</li>
<li><strong>Emberismeret</strong> (észlelés) — indítékok, érzelmi állapot és kimondatlan helyzet olvasása</li>
<li><strong>Stratégia</strong> (értelem) — hosszú távú tervezés a közvetlen harcon túl</li>
<li><strong>Szertartás</strong> (tekintély) — közösségi rítusok, temetések, eskük és formális tartás</li>
<li><strong>Prédikáció</strong> (karizma) — nyilvános erkölcsi vagy szellemi beszéd, amely megmozdít egy tömeget</li>
</ol>
</div>
</details>

<details class="kod-archetype kod-archetype--trickster" id="trickster-12">
<summary class="kod-archetype__summary">
<img class="kod-archetype__panel" src="/archetypes/trickster.jpg" alt="" width="256" height="256" loading="lazy" decoding="async" />
<span class="kod-archetype__name">Cselszövő</span>
<span class="kod-archetype__tag">Titok és megtévesztés</span>
</summary>
<div class="kod-archetype__body">
<p>A cselszövő a lopakodást, a lopást, a hamisítást, a csempészetet, a megtévesztést és a kapcsolódó alattomos munkát fedi. A karakternek nem kell hivatásos tolvajnak lennie ezekhez a jártasságokhoz — a titok, a félrevezetés, és az őrökön túljutás jártasságai.</p>
<ol>
<li><strong>Zárnyitás</strong> (ravaszság) — zárak, reteszek és egyszerű mechanikus pecsétek legyőzése</li>
<li><strong>Zsebtolvajlás</strong> (ravaszság) — tárgyak levétele valakiről, anélkül hogy észrevenné</li>
<li><strong>Lopakodás</strong> (ügyesség) — csendes mozgás és rejtve maradás mozgás közben</li>
<li><strong>Hamisítás</strong> (ravaszság) — hamis iratok, pecsétek, jelek, és írás vagy mesterségjelek meggyőző utánzata</li>
<li><strong>Rágalom és gúny</strong> (karizma) — nyilvános vagy suttogott támadás a hírnév ellen szavakkal</li>
<li><strong>Csempészet</strong> (ravaszság) — áru vagy emberek juttatása őrök, vámok és motozók mellett</li>
<li><strong>Megtévesztés</strong> (ravaszság) — hazugság, hamis személyek és szándékos félrevezetés</li>
<li><strong>Utcai tájékozódás</strong> (ravaszság) — városok, alvilági csatornák és informális városi hatalom olvasása</li>
<li><strong>Akrobatika</strong> (ügyesség) — ugrás, egyensúly, hajlékonyság és atletikus mozgás nyomás alatt</li>
<li><strong>Kézügyesség</strong> (ravaszság) — tenyérbe rejtés, csere, elrejtés, apró manipulációk</li>
<li><strong>Mellék- és rögtönzött harc</strong> (ügyesség) — másodlagos fegyverek és tárgyak, amelyek nem fegyvernek készültek</li>
<li><strong>Mászás</strong> (erő) — függőleges mozgás sziklán, fán, kötélen és falon</li>
</ol>
</div>
</details>

</div>

----------

Kapcsolódó: [Emberi adottságok](/hu/human-potential/), [Karakteralkotás](/hu/character-creation/) jártasságkeretei, [Automatizálás](/hu/automation/) gyakorlatkövetése.

----------
