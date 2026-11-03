# Magyar jogi előkészítés – időpontkérő portál

Forrásellenőrzés dátuma: **2026. október 30.**

Technikai frissítés (2026. november 1.): a fiókok, autók és időpontkérések PocketBase-t használnak. A tájékoztató a szerveroldali tárolást, az állapotelőzményeket, a telefonos megerősítést, a munkamenet- és vendég-hozzáférési sütit, valamint az alapból kikapcsolt, külön aktiválható szolgáltatási értesítéseket is leírja. A frissítés alvázszámot és bruttó árbecslés-részletezést is kezel. Az üzemeltetőnek a tényleges adattárolás előtt ki kell töltenie a megőrzést, szolgáltatókat és hivatalos cégadatokat; a nyitott üzemeltetői ellenőrzéseket ez a belső ellenőrzőlista követi.

A felhasználó által megerősített és jelenleg megvalósított modell: **a weboldal csak időpontot kér; a javítás tartalmát és végleges árát külön egyeztetik.** Ár megjelenítése önmagában nem dönti el, hogy létrejön-e javítási szerződés: a teljes folyamatot, a gombok és nyilatkozatok tartalmát kell vizsgálni. A rögzített árú online megrendelési modellre való átállást külön tisztázni és megvalósítani kell. A portál valós időpontkérést rögzít, de nem köt javítási szerződést és nem fizettet. Az itt leírt módosítások jogi és technikai előkészítést jelentenek; nem tanúsítják egy későbbi éles vállalkozás teljes jogszabályi megfelelőségét.

A dokumentumok a saját működéshez szerkeszthetők. A hiányzó hiteles cégadatok és adatkezelési döntések éles használat előtt kitöltendők, az éles szöveget a konkrét működés alapján magyar jogban jártas szakemberrel szükséges ellenőriztetni.

## 1. Mi került a weboldalra?

| Dokumentum / funkció                            | Szerkeszthető forrás                   | Rendeltetés                                                                       |
| ----------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Adatkezelési Tájékoztató                        | `content/legal.ts`                     | GDPR-tájékoztatás, érintetti jogok, fiók-, jármű- és foglalási adatfolyamok       |
| ÁSZF                                            | `content/terms.ts`                     | Időpontkérés menete, javítható adatbevitel, nyelv, szerződéses határ, lemondás    |
| Süti- és tárhelytájékoztató                     | `content/legal.ts`                     | Helyi tárolás és tényleges külső kapcsolatok                                      |
| Impresszum                                      | `content/legal.ts`, `content/site.ts`  | Üzemeltető, cégadatok és tárhelyadatok                                            |
| Fogyasztói tájékoztató                          | `content/consumer.ts`                  | Panaszkezelés, békéltetés, feltételes elállás/felmondás, javítási jótállás        |
| Panasz- és elállási/felmondási nyilatkozatminta | `content/consumer-forms.ts`            | Letölthető, kitölthető `.txt` fájlok; nem beküldő űrlapok                         |
| Menthető ÁSZF                                   | `app/dokumentumok/[filename]/route.ts` | Az aktuális szövegből generált letöltés, változatszámmal                          |
| Kitöltési ellenőrzés                            | `npm run legal:check`                  | A hiányzó konfigurációt és nyitott felülvizsgálatokat jelzi; nem jogi tanúsítvány |

Az új tájékoztató ugyanazt a világos/sötét felületet használja, és minden láblécből elérhető. A nyilatkozatok letöltése **nem küld be sem panaszt, sem elállást**.

## 2. Szolgáltatói és elektronikus ügyintézési adatok

A 2001. évi CVIII. törvény 4–6. § alapján a tényleges szolgáltató adatait folyamatosan és könnyen elérhetően kell megadni. Cég esetén különösen a név, székhely, rendszeresen használt e-mail, nyilvántartó bíróság/hatóság, nyilvántartási szám, adószám és a tárhelyszolgáltató adatai ellenőrizendők. Engedélyköteles vagy szabályozott tevékenységnél további adatok is szükségesek lehetnek.

Az elektronikus szerződéses folyamatnál szükséges a technikai lépések, az adatbeviteli hibák kijavítása, a nyelv, az írásbeliség/iktatás/hozzáférhetőség és az esetleges magatartási kódex ismertetése. A megrendelés beérkezésének visszaigazolásához a törvény főszabály szerint legfeljebb 48 órás jogkövetkezményt kapcsol; a kézhezvétel és a megrendelés elfogadása külön esemény lehet.

Az alapbeállításban a portál nem küld visszaigazoló e-mailt, és nincs éles szerződéses iktatása. A javítási szerződés létrejöttét a valós működés szerint kell eldönteni: önmagában a gomb felirata vagy egy ÁSZF-mondat nem változtatja meg egy ténylegesen szerződéskötésre működő folyamat jogi természetét.

## 3. Panaszkezelés és békéltetés

Az 1997. évi CLV. törvény 17/A. § alapján:

- A szóbeli panaszt azonnal vizsgálni kell, és szükség szerint orvosolni; az ott előírt esetekben jegyzőkönyv és annak átadása/megküldése szükséges.
- Az írásbeli panaszra főszabály szerint 30 napon belül érdemi, igazolható írásbeli válasz szükséges.
- A panasz és a válasz másolatának megőrzése 3 év.
- Elutasításkor a szükséges hatósági/békéltető testületi elérhetőségeket és az általános alávetési nyilatkozatra vonatkozó tájékoztatást meg kell adni.
- Saját elektronikus panaszűrlap bevezetésekor a beérkezést a megadott e-mail-címen haladéktalanul vissza kell igazolni. **A jelenlegi letöltés nem ilyen űrlap.**

A Fejér Vármegyei Békéltető Testület címét, postacímét, telefonszámát, e-mailjét és illetékességi területét a testület saját kapcsolatoldalán ellenőriztük. A más területen élő fogyasztóknál az illetékes testületet a tényleges személyi és területi szabályok szerint kell meghatározni. A 2026-os fogyasztóvédelmi törvény a békéltetésnél külön személyi kört is meghatároz; egy céges fiók léte alapján nem szabad automatikusan minden jogot kizárni.

A szolgáltató tényleges panaszkezelési levelezési címét és alávetési nyilatkozatára vonatkozó álláspontját még meg kell adni a `site.legal` részben.

## 4. Elállás/felmondás: az időpontkérés és a szerződés különbözik

A 45/2014. (II. 26.) Korm. rendelet szerinti kötelezettségek a rendelet hatálya alá tartozó fogyasztói szerződéshez kapcsolódnak. A jelenlegi, külön egyeztetést megelőző portál időpontkérése nem online javítási megrendelés. Az időpont lemondását ne nevezzük automatikusan törvényes elállásnak.

Ha később online fogyasztói szolgáltatási szerződés jön létre, többek között:

- előzetes szerződéses tájékoztatás, tényleges ár/díj vagy számítási mód és tartós adathordozós visszaigazolás szükséges;
- a főszabály szerinti 14 napos elállási/felmondási tájékoztatást és nyilatkozatmintát hozzá kell igazítani;
- a korai teljesítés külön, kifejezett kérésének és a jogvesztés feltételeinek kezelését nem lehet általános ÁSZF-pipába rejteni;
- a 2026-ban hatályos 22. § online elállási funkcióját, az „elállás a szerződéstől” / „elállás megerősítése” lépéseket és a tartós adathordozón küldött átvételi elismervényt ténylegesen meg kell valósítani. Egy letölthető `.txt`, e-mail-hivatkozás vagy helyi demórekord nem helyettesíti ezt.

Ezt a későbbi szerződéses backendet **nem valósítottuk meg**, és a `legal:check` a más modellre állítást nyitott tételként jelzi.

A régi EU ODR-platform **2025. július 20-án megszűnt**. Nem tettünk be elavult ODR-linket.

## 5. Autójavítási jótállás és szavatosság

A 249/2004. (VIII. 27.) Korm. rendelet mellékletének személygépkocsi- és motorkerékpár-karbantartási, javítási szolgáltatásai esetén, a rendelet feltételeivel, a **20 000 Ft-ot meghaladó**, áfát és anyagköltséget is tartalmazó díjhoz **6 hónapos kötelező jótállás** kapcsolódik. Ez nem minden járműre, nem minden ellenőrzésre és nem a már jótállási/szavatossági igény keretében végzett valamennyi munkára kiterjedő, korlátlan állítás.

A tényleges munkalapnak, átadásnak, jótállási jegynek és igénykezelésnek is meg kell felelnie a rendeletnek. A Ptk. szerinti kötelező jogokat az ÁSZF nem írhatja felül. A portál jelenleg nem kezel munkalapot, számlázást vagy jótállási jegyet; ezek operatív kötelezettségeit nem teljesíti pusztán a tájékoztató.

## 6. Adatvédelem és végberendezési tárolás

A GDPR 5., 6., 12–22., 25., 28. és 32. cikke szerinti tényleges működést kell kialakítani: célhoz kötött, minimális adatkérés; célonként megfelelő jogalap; valós megőrzési idők; érintetti jogok; adatfeldolgozói szerződések és továbbítások; hozzáférési jogosultságok és megfelelő biztonság. A megőrzési időket nem találtuk ki a fiók- és foglalási adatkezeléshez.

Az ÁSZF elfogadása és az adatkezelési tájékoztató rendelkezésre bocsátása nem azonos a marketing-hozzájárulással. Szükséges szerződéses adatkezelést nem kell egy általános „minden adatkezeléshez hozzájárulok” mezőre alapozni. A panaszok törvényi megőrzése más jogalap, mint egy időpontkérés. A szolgáltatási emlékeztető sem automatikusan marketing.

A változtatások:

- A betűkészletek helyi fájlokból töltődnek; a látogató nem kapcsolódik Google Fontshoz.
- A nyilvános kezdőlap és tájékoztató megnyitása nem hoz létre demófiók-adatbázist.
- A témát csak a felhasználó kért beállítása után mentjük.
- Az új regisztráció és időpontkérés a feltételverziót és szerveroldali időbélyeget rögzíti; az időpont az állapotváltozások előzményét is őrzi. Ez **nem bizonyítja a tájékoztató elolvasását, nem marketing-hozzájárulás és nem helyettesíti a korábbi dokumentumverziók változatlan megőrzését**.
- Nincs analitika vagy marketingkövetés. Új hozzájárulásköteles eszközhöz előzetes, célonkénti választás és visszavonás szükséges.

A localStorage-ra is kiterjedhetnek a végberendezési tárolás szabályai; a technológia neve nem mentesség. Eht. 155. § és az alkalmazandó uniós szabályok alapján a tényleges célokat kell értékelni. Az éles backend, tárhelynaplózás, hozzáférések, mentések, adatfeldolgozói szerződések és törlési folyamatok még ellenőrizendők. A szerepkört a PocketBase tárolja; a nyilvános demószerepkör-váltó megszűnt. A vendég-hozzáférés 120 napos időtartama nem adatmegőrzési vagy automatikus törlési határidő.

## 7. Akadálymentesség: hatályvizsgálat szükséges

A 2022. évi XVII. törvény egyes szolgáltatásokra – köztük a törvény szerinti elektronikus kereskedelmi szolgáltatásokra – 2025. június 28-tól tartalmaz követelményeket. A szolgáltatást nyújtó mikrovállalkozásokra mentesség vonatkozik a törvény szerinti körben; ezt a vállalkozás mérete és tényleges szolgáltatása szerint kell vizsgálni.

Nem állítunk nem vizsgált WCAG-megfelelést, és nem teszünk ki közszférára készült, a cégre nem feltétlenül irányadó nyilatkozatot. A billentyűzetes használatot, fókuszt, űrlapcímkéket és mobil elrendezést teszteljük, de az éles hatályvizsgálat és akadálymentességi audit külön feladat. Ha a hatály fennáll, az előírt szolgáltatói tájékoztatást és működést is ki kell alakítani.

## 8. Mit kell még megadni?

`content/site.ts`, `site.legal`:

- hiteles székhely, nyilvántartási/cégjegyzékszám, adószám, nyilvántartó bíróság/hatóság;
- tárhelyszolgáltató neve, címe és e-mailje;
- panaszkezelési levelezési cím;
- alkalmazandó engedélyezési/szabályozott tevékenységi adatok és esetleges magatartási kódex;
- fix bruttó ár, induló ár vagy becslés pontos jelentése, a tartalmazott tételek és a további költségek;
- az általános békéltetési alávetési nyilatkozatra vonatkozó valós álláspont;
- éles adatkezelési célok, jogalapok, adatfeldolgozók, továbbítások és megőrzési idők;
- tényleges szakmai felülvizsgálat után a `reviews` jelölések és a mintaállapot.

```sh
npm run legal:check
```

A parancs jelenleg szándékosan hibakóddal jelzi a ténylegesen hiányzó adatokat és felülvizsgálatokat. Ez nem a prototípus buildhibája. A nyilvános tájékoztatókon nincs „Szerkeszthető minta” jelölés. Ez megjelenítési döntés: a belső `isDraft` és `reviews` állapotok, valamint a `legal:check` továbbra is jelzik a meg nem erősített üzemeltetői tételeket. A cégadatokat az üzemeltető 2026. november 3-án megerősítette. A parancs sikeres eredménye is csak kitöltöttséget jelez, nem jogi megfelelőséget.

## 9. Ellenőrzött források

A Nemzeti Jogszabálytár lekérése ebben a környezetben HTTP 503 hibát adott. A jogszabályszövegeket a Wolters Kluwer Hatályos Jogszabályok Gyűjteményében ellenőriztük, a megjelölt időállapotok szerint; az elsődleges NJT-hivatkozásokat is megadjuk. A jogszabályok változhatnak, élesítéskor újra ellenőrizendők.

- **Eker. tv.**: [2001. évi CVIII. törvény, NJT](https://njt.hu/jogszabaly/2001-108-00-00), [ellenőrzött szöveg](https://net.jogtar.hu/jogszabaly?docid=a0100108.tv), különösen 4–6. §.
- **Fogyasztóvédelem**: [1997. évi CLV. törvény, NJT](https://njt.hu/jogszabaly/1997-155-00-00), [ellenőrzött szöveg](https://net.jogtar.hu/jogszabaly?docid=99700155.tv), 2026. X. 1-től jelzett időállapot; különösen 2. § és 17/A. §.
- **Fogyasztói szerződések**: [45/2014. (II. 26.) Korm. rendelet, NJT](https://njt.hu/jogszabaly/2014-45-20-22), [ellenőrzött szöveg](https://net.jogtar.hu/jogszabaly?docid=a1400045.kor), 2026. IX. 27-től jelzett időállapot; különösen 11–13., 20–29. § és 2. melléklet.
- **Javítási jótállás**: [249/2004. (VIII. 27.) Korm. rendelet, NJT](https://njt.hu/jogszabaly/2004-249-20-22), [ellenőrzött szöveg](https://net.jogtar.hu/jogszabaly?docid=a0400249.kor), különösen 1–3. § és melléklet 4. pont.
- **Végberendezési tárolás**: [2003. évi C. törvény](https://net.jogtar.hu/jogszabaly?docid=a0300100.tv), 155. §.
- **GDPR**: [(EU) 2016/679 rendelet, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj). Az EUR-Lex szöveglekérése ebben a környezetben nem adott tartalmat; az érintetti ügyintézési adatokat a NAIH saját oldalán ellenőriztük.
- **NAIH**: [hivatalos ügyfélszolgálati oldal](https://naih.hu/ugyfelszolgalat-kapcsolat).
- **Békéltetés**: [Fejér Vármegyei Békéltető Testület – kapcsolat](https://www.bekeltetesfejer.hu/kapcsolat/), [országos rendszer](https://bekeltetes.hu/).
- **Megszűnt ODR**: [Európai Bizottság hivatalos tájékoztatója](https://consumer-redress.ec.europa.eu/site-relocation_en).
- **Akadálymentesség**: [2022. évi XVII. törvény](https://net.jogtar.hu/jogszabaly?docid=a2200017.tv), különösen 1., 4. és 10–12. §.

## 2026. november 3-i szövegfrissítés

Az ÁSZF külön `content/terms.ts` fájlban a megvalósított időpontkérési modellt, a partnerfiókokat, a telefonos visszaigazolást, a bruttó árbecslést és a privát szervizdokumentumok feltöltését, letöltését és e-mail-mellékletként küldését írja le. A közös verzió `2026-11-03.1`; a korábbi szövegek a `docs/legal-history/2026-11-01.6-draft/` mappában maradtak meg. A korábbi adatbázisbeli elfogadásokat a frissítés nem írja át. A hiányzó engedélyezési, békéltetési, adatfeldolgozói és megőrzési nyilatkozatokat nem töltöttük ki feltételezéssel.
