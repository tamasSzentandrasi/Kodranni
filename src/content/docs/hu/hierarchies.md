---
title: Hierarchiák
description: Hierarchiák, hírnév, örökségek és az ábra.
---

> _*„Jobb tíz emberrel kéznél lenni, mint tízezerrel távol.”*_  
> — Timur

----------

## Hierarchiák, hírnév és örökségek

A hierarchiák (Hierarchy) azt mutatják, hol áll valaki a közösség szemében — elhitt, értett, elfogadott hely.

A hierarchia a közösségen belüli hatalom **egy tengelye** — nem a teljes társadalmi térkép. Minden kampány alapból négy tengellyel indul. A mesélő átnevezheti, hozzáadhatja vagy elveheti őket — kemény **maximum öt**.

Egy ember **több** tengelyen is tarthat szintet egyszerre (**tisztelt** (Honoured) a **pénzen** (Coin), **elismert** (Acknowledged) a **fegyveren** (Arms)). Az emelkedés **tengelyenként** megy. Az **uralkodó** (Ruler) nem az ötödik fok egyik létrán sem — **egyetlen közös hely minden tengely fölött**. Csak egy ember ülhet rajta, bármelyik tengelyen emelkedett is.

A [Kampányelőkészítésben](/hu/campaign-setup/) a tengelyeket hagyd név nélkül; az állás játékban derül ki, és akkor igényled.

### Szintek

Minden tengely ugyanazt a négy fokot használja, fentről le: **tisztelt**, **megbízott** (Trusted), **elismert**, **kitaszított** (Outcast). Az **uralkodó** fölöttük ül, nem rajtuk.

<figure class="kod-breath not-content">
<img src="/scenes/emissaries.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

### Az ábra alakja

Az ábrát (Diagram) fentről lefelé olvasd: egy korona, aztán párhuzamos létrák. Minden oszlop külön hierarchia. Minden létra **ugyanazt a négy szintet** használja (az oszlop teteje = tisztelt, alja = kitaszított). Az **előkészítés** minden fokot név nélkül hagy. A **játékban** egy kidolgozott Althing-példa: kettős tengely, pártfogás, megbízás és a kívülálló tornác egyszerre látszik.

<div class="kod-hier not-content" data-widget="hierarchy-board" data-mode="play" aria-label="Hierarchia-foglaltság">
<div class="kod-hier__modes" role="group" aria-label="Ábra állapota">
<button type="button" class="kod-widget__btn" data-hier-mode="setup">Előkészítés</button>
<button type="button" class="kod-widget__btn" data-hier-mode="play" aria-pressed="true">Játékban</button>
</div>
<div class="kod-hier__cast" role="list" aria-label="A példa emberei">
<button type="button" class="kod-chip" data-person="ketill">Ketill</button>
<button type="button" class="kod-chip" data-person="hakon">Hákon</button>
<button type="button" class="kod-chip" data-person="ingibjorg">Ingibjörg</button>
<button type="button" class="kod-chip" data-person="leif">Leif</button>
<button type="button" class="kod-chip" data-person="sigrid">Sigrid</button>
</div>
<div class="kod-hier-diagram">
<div class="kod-hier-ruler">
<p class="kod-hier-ruler__title">Uralkodó</p>
<button type="button" class="kod-chip" data-person="ketill" data-play>Ketill</button>
<p class="kod-hier-ruler__note">Egy hely az egész közösségnek — minden tengely fölött, nem a Fegyver, Hit, Pénz vagy Vér teteje.</p>
</div>
<div class="kod-hier-body">
<div class="kod-hier-axes">
<div class="kod-hier-axis" data-axis="arms">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Fegyver</p>
<p class="kod-hier-axis__domain">Harci erő, védelem, háború, az erőszak joga</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Tisztelt</strong></li>
<li><strong>Megbízott</strong> <button type="button" class="kod-chip" data-person="hakon" data-play>Hákon</button></li>
<li><strong>Elismert</strong> <button type="button" class="kod-chip" data-person="leif" data-play>Leif</button></li>
<li><strong>Kitaszított</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="faith">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Hit</p>
<p class="kod-hier-axis__domain">Szertartás, szent tudás, erkölcsi súly</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Tisztelt</strong></li>
<li><strong>Megbízott</strong></li>
<li><strong>Elismert</strong></li>
<li><strong>Kitaszított</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="coin">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Pénz</p>
<p class="kod-hier-axis__domain">Vagyon, kereskedelem, anyagi többlet, alkuerő</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Tisztelt</strong> <button type="button" class="kod-chip" data-person="ingibjorg" data-play>Ingibjörg</button></li>
<li><strong>Megbízott</strong></li>
<li><strong>Elismert</strong> <button type="button" class="kod-chip" data-person="leif" data-play>Leif</button></li>
<li><strong>Kitaszított</strong></li>
</ol>
</div>
<div class="kod-hier-axis" data-axis="blood">
<div class="kod-hier-axis__head">
<p class="kod-hier-axis__name">Vér</p>
<p class="kod-hier-axis__domain">Rokonság, föld, származás, házi hatalom</p>
</div>
<ol class="kod-hier-rungs">
<li><strong>Tisztelt</strong> <button type="button" class="kod-chip" data-person="ketill" data-play>Ketill</button></li>
<li><strong>Megbízott</strong></li>
<li><strong>Elismert</strong> <button type="button" class="kod-chip" data-person="hakon" data-play>Hákon</button></li>
<li><strong>Kitaszított</strong></li>
</ol>
</div>
</div>
<aside class="kod-hier-porch" aria-label="Kívülállók">
<p class="kod-hier-porch__title">Kívülállók</p>
<button type="button" class="kod-chip" data-person="sigrid" data-play>Sigrid</button>
<p class="kod-hier-porch__note">Külön, amíg belépnek. Akkor kitaszított a rájuk illő tengelyeken.</p>
</aside>
</div>
</div>
<div class="kod-hier__frame" aria-live="polite">
<p data-person-note="default">Kattints egy névre. Az az ember minden tengelyen kigyullad, ahol ül. A kettős tengely két fok egyszerre, nem ötödik létra. A Hit szándékosan üres — tengely játékban is maradhat névtelen.</p>
<p data-person-note="ketill" hidden>Ketill az uralkodói helyen ül. A Véren emelkedett, és ott tisztelt maradt. Nem állhat a falon és az Althingon egyszerre, ezért a Fegyvert Hákont bízza. Hírnév: aki nyilvánosan megszégyeníteni próbálja, a saját foka és a minden tengely fölötti hely közti rést kapja.</p>
<p data-person-note="hakon" hidden>Hákon a Fegyveren megbízott, mert Ketill marsallnak nevezte — ez megbízás, nem második uralkodó. Rokonságként elismert a Véren is. Kettős tengely: mindkét létra kigyullad. Senki sem uralkodik jól, ha nem adja le a munkát.</p>
<p data-person-note="ingibjorg" hidden>Ingibjörg tisztelt a Pénzen — a malomkönyv. Leif pártfogója. A Fegyveren nem ül. Ha a csarnokban Leif ellen megy, a Pénz kétfoknyi rése a társas vagy szellemi sérülés védelmi aránya. A fikcióbeli befolyás szabad szerepjáték marad.</p>
<p data-person-note="leif" hidden>Leif (játékos). Elismert a Fegyveren a tavalyi rajtaütésből. A Pénzen kitaszított volt, amíg Ingibjörg malomkönyv-visszhangja jól zárult; most elismert a Pénzen. Az emelkedés tengelyenként megy — a visszhang a Fegyvert nem mozdította. Kettős tengely: mindkét fok kigyullad.</p>
<p data-person-note="sigrid" hidden>Sigrid kívülálló: a tornácon, egyik létrán sem. Ha belép a közösségbe, kitaszítottként indul a ráillő tengelyeken. A tornác az ábra mellett van, soha nem ötödik oszlop.</p>
</div>
<p class="kod-hier-caption">Ugyanaz a négy fok minden tengelyen. Egy karakter állhat magasan az egyiken és alacsonyan a másikon. Az uralkodói hely egyetlen, és minden tengely fölött ül.</p>
</div>

Akik soha nem tartoztak a közösséghez, **kívülállók** (Outsider). Az ábrán **külön** ülnek (egyik tengelyen sem), amíg belépnek; akkor **kitaszítottként** indulnak a rájuk illő tengelyeken.

Alap a [Megmérettetés után](/hu/character-creation/#a-megmérettetés-után): **kitaszított**, hacsak a fikció már feljebb nem helyezi őket.

----------

### Hírnév

A **hírnév** (Reputation) a karakter relatív helye a ráillő hierarchián.

Egyetlen kemény mechanikai hatása a **védelmi arány**, amikor [sérülést](/hu/harm/#sérülés-okozása) számoltok társas vagy szellemi küzdelemben. Minél nagyobb a rés, annál nehezebb az alacsonyabbnak tartós társas vagy szellemi kárt tenni a magasabbon.

Más mechanika nincs a szinthez kötve. A fikcióbeli befolyás szabad szerepjáték marad.

----------

<figure class="kod-breath not-content">
<img src="/scenes/kingsgambit.jpg" alt="" width="1168" height="784" loading="lazy" decoding="async" />
</figure>

### Emelkedés

Az emelkedés általában **pártfogással** vagy **horoggal** indul.

Egy magasabb szintű karakter kitüntetést, szerepet, feladatot vagy nyilvános szívességet ad. Ez az adomány **[visszhang](/hu/echoes/)** lesz. A visszhang lezárása dönti el, hogy a karakter emelkedik, marad, vagy esik.

A játékosok NPC-k emelkedését is indíthatják így. Óvatosan: a becsvágyó alárendelt a pártfogót fenyegeti; a gyenge alárendelt kiüresíti a közösséget. Senki sem uralkodik jól megbízás nélkül.

A pártfogás a legtisztább út, nem az egyetlen. Nyilvános tettek, erő, egy fölöttes halála, vagy üres hely elfoglalása is mozgathat karaktert. Az asztal dönti el, mit bír el a fikció.

Ugyanazon a szinten a versengés és az együttműködés szerepjáték marad.

<aside class="kod-example" aria-label="Példa">
<p class="kod-example__scene">A fenti foglaltság ez a jelenet a lezárás után. Az Althing előtt Ingibjörg — tisztelt a Pénzen, a nő, aki még mindig az egyetlen ép malomkönyvet tartja — félrehívja Leifet az udvaron. A malomkönyvet, ami a malomrészesedés igényét bizonyítja, múlt héten ellopták. Tanúk előtt nevezi meg: hozd vissza, mielőtt a gyűlés összeül, és szólni fog érte. Ez a megbízás visszhang lett. Jól zárult, és megnyitotta a Pénzen az emelkedést (kitaszított → elismert). A visszhang a Fegyvert nem mozdította, és nem tette tiszteltté. Később, ha Ingibjörg a csarnokban megszégyeníteni próbálja, a Pénz kétfoknyi rése a társas sérülés védelmi aránya — nem automatikus hatalom magából a szívességből. Ketill azon a létrán nincs: uralkodik, mert a helyen ül, és mert a Fegyvert már Hákont bízta.</p>
<ol class="kod-example__steps">
<li><strong>Pártfogás / horog:</strong> Ingibjörg (tisztelt, Pénz) nyilvánosan a malomkönyv visszaszerzését bízza Leifre az Althing előtt.</li>
<li><strong>Visszhang születik:</strong> „Hozd vissza a malomkönyvet az Althing előtt” (súlyt az asztal szabja).</li>
<li><strong>Emelkedés:</strong> jól zárult; a mesélő a Pénzen kitaszított → elismertet hagyott jóvá. A Fegyver ott maradt, ahová a rajtaütés tette.</li>
<li><strong>Megbízás:</strong> Ketill (uralkodó, tisztelt Vér) nem ül megbízottként a Fegyveren — Hákon ül, mert az uralkodó marsallnak nevezte.</li>
<li><strong>Hírnév / társas harc:</strong> Ingibjörg vs Leif a Pénzen két fok. Ez a rés a védelmi arány, amikor társas vagy szellemi sérülés jár. Más mechanika nincs a szinthez kötve.</li>
</ol>
</aside>

----------

<figure class="kod-breath not-content">
<img src="/scenes/eclipse.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async" />
</figure>

### Örökségek

Ha egy karakter meghal, teljesen lekerül a hierarchiaábráról. Csak a hátrahagyott **[visszhangok](/hu/echoes/)** maradnak.

A játékos következő karaktere ezek közül egyet **örökségként** (Legacy) igényelhet — személyes visszhang, amely az előd állására, nevére vagy befejezetlen munkájára tart igényt. Megélni, elutasítani, vagy összetörni alatta: ez a történet.

Az örökség **nem ad automatikus rangot**. Csak elismert igényt ad, és okot a küzdelemre.

A karakterhalál nem szakítja meg az ülést. A játék megy tovább. Az ábráról való törlés és az örökség faragása az ülés **után** történik. A játékos később új karakterrel tér vissza, a mesélővel alkotva ([Karakteralkotás](/hu/character-creation/)).

----------

### A hierarchiaábra

Az ábra a kampány minden ismert és követett karakterének közös feljegyzése. Minden játékos és a mesélő látja.

Menet (ugyanaz a minta, mint a [felszerelésnél](/hu/inventory/#kezelés)):

1. A játékos kéri a hozzáadást / elvételt / mozgatást automatizáláson  
2. A mesélő jóváhagyja  
3. Az automatizálás végrehajtja  

A halott karakterek törlődnek. Egyetlen maradék jelenlétük a visszhangokon át van, amelyeket az élők még hordoznak.

<aside class="kod-counsel" aria-label="Tanács">
<p>Bármely Kodranni-történet nagyobb közösséget követ, mégis elágazhat egyéni szálakra. Szándék szerint minden játékos története a közös legendát erősíti.</p>
<p><em>A történet csak félig van elmondva, ha csak egy ember mondja.</em></p>
</aside>

----------

> _*„Ne támaszkodj túlságosan senkire e világon, mert még a saját árnyékod is elhagy, ha sötétségben vagy.”*_  
> — Taqī ad-Dīn Aḥmad ibn Taymiyyah

Kapcsolódó: [Sérülés](/hu/harm/), [Visszhangok](/hu/echoes/), [Kampányelőkészítés](/hu/campaign-setup/), [Automatizálás](/hu/automation/).

----------
