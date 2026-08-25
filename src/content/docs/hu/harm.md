---
title: Sérülés
description: A kilenc sérüléssáv, a haldoklás, a felépülés és a védelmi arányok.
---

> _*Deyr fé, deyja frændur, deyr sjálfur ið sama.*_  
> _*„Meghal a jószág, meghalnak a rokonok, magad is meghalsz.”*_  
> — *Hávamál*

----------

A Kodranni **nem** követ találati pontot. A kilenc [adottság](/hu/foundations/) foszlását követi.

A **sérülés** (Harm) kilenc megnevezett sávon van feljegyezve. Minden sáv egy adottsághoz van párosítva. Minden sérüléspont eggyel csökkenti azt az adottságot a kocka szempontjából.

<div class="kod-harm-grid not-content">
<div class="kod-harm-col kod-harm-col--phys">
<p class="kod-harm-col__label">Testi</p>
<ul>
<li><strong>Zúzott</strong> (Crushed) ← Erő</li>
<li><strong>Vérzés</strong> (Bleeding) ← Ügyesség</li>
<li><strong>Láz</strong> (Fever) ← Állóképesség</li>
</ul>
</div>
<div class="kod-harm-col kod-harm-col--ment">
<p class="kod-harm-col__label">Szellemi</p>
<ul>
<li><strong>Köd</strong> (Fog) ← Értelem</li>
<li><strong>Zavarodott</strong> (Disoriented) ← Észlelés</li>
<li><strong>Sokk</strong> (Shock) ← Akarat</li>
</ul>
</div>
<div class="kod-harm-col kod-harm-col--soc">
<p class="kod-harm-col__label">Társas</p>
<ul>
<li><strong>Bemocskolt</strong> (Tarnished) ← Karizma</li>
<li><strong>Leleplezett</strong> (Exposed) ← Ravaszság</li>
<li><strong>Gyalázat</strong> (Disgrace) ← Tekintély</li>
</ul>
</div>
</div>

- A sávok **0-tól 3-ig** mennek.  
- Hatékony adottság = max(0, adottság − sérüléspontok).  
- A kockakészlet soha nem esik **1** kocka alá, a sérüléstől függetlenül.

A mesélő a fikció szerint oszt pontot. A sáv neve csak a mechanikai címke.

----------

<figure class="kod-breath not-content">
<img src="/scenes/wound-care.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

## Sérülés okozása

Sérülés csak akkor keletkezik, ha a fikció **és** a kocka is indokolja a maradandó kárt.

| Dobás típusa | Sérüléspont |
|-----------|-------------|
| **[Ellendobás](/hu/tide/#helyzeti-kockafeloldás)** | Jelek különbsége ÷ védelmi arány (**mindig lefelé kerekítve**) |
| **Ellendobás nélkül** (esés, környezet, veszélyes tettek) | (kudarcok − jelek) ÷ védelmi arány (**mindig lefelé kerekítve**, minimum 0) |

**Védelmi arányok** (protection ratio)

| Védelem | Arány |
|------------|-------|
| Nincs páncél / nincs releváns hírnév | ÷1 |
| Könnyű páncél / mérsékelt hírnév-fölény | ÷2 |
| Nehéz páncél / erős hírnév-fölény | ÷3 |

- A **mesélő választja a sérüléssávot**, ha a fikció kétértelmű.  
- **Nincs kevert esemény:** egy adott okozás testi **vagy** társas/szellemi — nem mindkettő halmozva. A testi védelem a felvett [páncélt](/hu/inventory/) használja (Nincs / Könnyű / Nehéz). A társas és szellemi védelem a **hírnevet** (relatív [hierarchiahely](/hu/hierarchies/#hírnév)). A hírnév-rés a védelmi arányhoz legfeljebb két szint (pl. uralkodó a kitaszított ellen).

Légy szűkmarkú. A legtöbb sikeres találat **0 vagy 1** pontot ad. Két pont figyelemre méltó. Három egyetlen váltásban ritka.

<aside class="kod-example">
<p class="kod-example__scene">Az udvari harcban egy dárda rést talál a könnyű láncing széle alatt. Az ellendobásos váltás egyértelműen a támadónak ment (3 jel különbség). A páncél még számít: felezi a maradandó sérülést. A mesélő testi sebet olvas, amely a kéz finom uralmát lopja el — nem társas megaláztatást ugyanazon az ütésen.</p>
<ol class="kod-example__steps">
<li><strong>Ellendobásos különbség:</strong> 3 jel (támadó előnyben).</li>
<li><strong>Védelem:</strong> könnyű páncél → oszd 2-vel.</li>
<li><strong>Sérüléspont:</strong> floor(3 ÷ 2) = <strong>1</strong>.</li>
<li><strong>Sáv (a mesélő a fikcióból választ):</strong> Vérzés (ügyesség) +1 — a seb a karon van; a kéz reszket.</li>
<li><strong>Nem kevert:</strong> ez az esemény nem rak társas vagy szellemi sávot is.</li>
</ol>
</aside>

----------

<figure class="kod-breath not-content">
<img src="/scenes/death.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

## Haldoklás

Ha bármely sérüléssáv **3**-ra ér, a karakter **haldokló** (Dying).

- Haldoklás közben **minden dobás [erőfeszítést](/hu/exertion/) kíván**.  
- Ha az erőfeszítés **0**-ra ér, a karakter **meghal**.

Ez az ablak utolsó tetteket, utolsó szavakat vagy kétségbeesett stabilizálást enged. A stabilizálás sikeres **[gyógyítás](/hu/skills/#healing)** próbát kíván, és leveszi a haldoklást; a sáv 3-on marad a további felépülésig, és szinte mindig állandó **[vonást](/hu/traits/)** hagy.

A gyógyítás nem szuperképesség. A kellő tudás és anyag nélkül — **[füvészet](/hu/skills/#herbalism)**, kötszer, **[kézi készítés](/hu/skills/#handcrafting)** sínhez, és ami a sebnek tényleg kell — a próbát **[hátránynak](/hu/marks-and-tiers/#előny-és-hátrány)** vedd. A legjobb gondozással is van, hogy nincs mit tenni. Harcolj tovább. Mentsd, akit tudsz. Nincs történetpáncél. A halál mindenkit elvisz a végén.

<div class="kod-widget not-content" data-widget="step-flow" id="dying-demo">
<p class="kod-widget__title">Haldoklás — láz az úton</p>
<p class="kod-widget__intro">Egy társ megpróbálja megtartani. A gyógyítás jártasság, nem csoda.</p>
<p class="kod-step-flow__label" data-step-label></p>
<div class="kod-step-flow__track" role="group" aria-label="Haldoklás lépései">
<button type="button" class="kod-widget__btn" data-tab="d1" aria-pressed="true">I</button>
<button type="button" class="kod-widget__btn" data-tab="d2">II</button>
<button type="button" class="kod-widget__btn" data-tab="d3">III</button>
<button type="button" class="kod-widget__btn" data-tab="d4">IV</button>
</div>
<div class="kod-widget__panel" data-panel-id="d1" data-step-title="Láz 3">
<p>A seb elromlott. A <strong>láz</strong> 3-ra ér. A karakter <strong>haldokló</strong>. Még beszélhet. Minden dobás most erőfeszítést kíván. Ha az erőfeszítés 0, meghal.</p>
</div>
<div class="kod-widget__panel" data-panel-id="d2" data-step-title="Ami náluk van" hidden>
<p>A társnak van füve és tiszta vászna — füvészet, kötszer. Nincs kohó, sínezés nem kell lázhoz. A mesélő akaratot + gyógyítást nevez, <strong>d8</strong> (hétköznapi: megvan a tudás és az anyag).</p>
<p>Ha sem füve, sem jártassága nincs, ugyanaz a szándék <strong>d6</strong> lenne. A kívánság nem orvosság.</p>
</div>
<div class="kod-widget__panel" data-panel-id="d3" data-step-title="A próba" hidden>
<p>Eltöltik az éjszakát. A jelek gyéren jönnek — 1. A láz annyira megtörik, hogy a haldoklás felenged. A sáv 3-on marad, amíg a felépülés le nem viszi a pontokat. Állandó vonás marad (gyengült mellkas). Él. Nincs jól.</p>
</div>
<div class="kod-widget__panel" data-panel-id="d4" data-step-title="Ha nem sikerül" hidden>
<p>Nulla jel, vagy senki sem tud gyógyítást próbálni, mielőtt az erőfeszítés kimerül: halál. A társ nem videojáték-próbát rontott el. Néha a test kész. A játék folytatódik. A visszhangok és az örökségek maradnak.</p>
</div>
<div class="kod-step-flow__nav">
<button type="button" data-step-prev>← Vissza</button>
<button type="button" data-step-next>Tovább →</button>
</div>
</div>

Halál után: vedd le a karaktert a [hierarchiaábráról](/hu/hierarchies/#a-hierarchiaábra). A folytonosság a [visszhangokon](/hu/echoes/) és az [örökségeken](/hu/hierarchies/#örökségek) keresztül megy tovább. A játék nem áll meg az ülés közepén teljes karaktercserére.

<aside class="kod-example">
<p class="kod-example__scene">A seb elromlott az úton. A láz két napja kúszik; amikor a lázsáv 3-ra ér, a karakter <strong>haldokló</strong>. Még beszélhet és cselekedhet, de minden tett azt a kevés erőt emészti, ami maradt. Egy társ virraszt az éjszakán füvekkel és biztos kézzel.</p>
<ol class="kod-example__steps">
<li><strong>Láz</strong> 3-ra ér → a karakter <strong>haldokló</strong>.</li>
<li><strong>Haldoklás közben:</strong> minden dobás <a href="/hu/exertion/">erőfeszítést</a> kíván. Ha az erőfeszítés 0-ra ér → halál.</li>
<li><strong>Stabilizálás:</strong> a társ akarat + gyógyításra dob, és sikerül → a haldoklás véget ér. A lázsáv 3-on marad, amíg a felépülés le nem viszi a pontokat. Állandó <a href="/hu/traits/">vonás</a> általában marad (heg, sántítás, gyengült mellkas — a mesélő nevezi meg).</li>
</ol>
</aside>

----------


## Felépülés

A felépülés lassú, és pihenéstől, gondozástól és táplálástól függ.

| Feltétel | Hatás |
|-----------|--------|
| Rövid pihenő | 1 pontot törölhet egyetlen sávról, ha etetik és gondozzák |
| Hosszú pihenő | 1–2 pontot törölhet a gondozástól, menedéktől és ételtől függően |
| Nincs étel vagy víz | Csökkenti vagy megszünteti a felépülést |
| Sáv 3-on | Csak a haldoklás stabilizálása után csökkenthető |

A [felszerelés](/hu/inventory/) (kötszer, fű, tiszta víz, menedék mint fikció) és a pihenés minősége számít. A mesélő ítéli meg, mit enged a helyzet.

----------

## Rosszabbodás és ómenek

Minden sérülés rosszabbodhat.

A mesélő egyedi [ómen](/hu/omens/#az-ómenkocka-és-a-következmények) lapokat tölthet be fertőzésre, másodlagos vérzésre, terjedő lázra, növekvő szégyenre és hasonló romlásra. Ha azok a lapok előjönnek, további sérülés jár. Pozitív következmény csökkentheti vagy megelőzheti a sérülést.

A hétköznapi **7**-es és **13**-as lap ugyanerre a célra a mesélő belátása szerint továbbra is elérhető.

----------

<aside class="kod-note" aria-label="Jegyzet">
<p><em>„Ne izgulj. Úgyis megöllek előbb-utóbb.”</em></p>
</aside>

Kapcsolódó: [Kockamechanika](/hu/dice-mechanics/), [Erőfeszítés](/hu/exertion/), [Hierarchiák](/hu/hierarchies/), [Automatizálás](/hu/automation/).

----------
