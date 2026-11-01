/** A jogi oldalak szerkeszthető szövege. A PocketBase-fiókokat, járműveket és időpontkéréseket írja le.
 * Levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
import { address, site, legalNavigation } from "./site";
import { consumerDocument } from "./consumer";
export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  facts?: { label: string; value: string }[];
  links?: { label: string; href: string; download?: boolean }[];
};
export type LegalDocument = {
  slug: string;
  label: string;
  title: string;
  description: string;
  sections: LegalSection[];
};
const missing = (value: string) =>
  value || "Kitöltés szükséges az éles használat előtt";
export const legalDocuments: LegalDocument[] = [
  {
    ...legalNavigation[0],
    title: "Az adataidról, érthetően.",
    description:
      "Milyen adatokat kér a portál, mire használja őket, és hogyan kezelheted a mentéseidet.",
    sections: [
      {
        id: "adatkezelo",
        title: "Az üzemeltető és az elérhetőségek",
        facts: [
          { label: "Cégnév", value: site.legal.companyName },
          { label: "Székhely", value: missing(site.legal.registeredOffice) },
          { label: "Műhely", value: address },
          {
            label: "Adatkezelési kapcsolattartás",
            value: site.legal.privacyEmail,
          },
        ],
      },
      {
        id: "jelenlegi-mukodes",
        title: "A portál jelenlegi működése",
        paragraphs: [
          "A regisztráció, bejelentkezés, profilmódosítás, mentett járművek és adminisztrátori fiókkezelés a szerviz PocketBase-adatbázisával működik, a szükséges migrációk telepítése után. Az adatokat a webhely szervere továbbítja a homelabon működő PocketBase felé, HTTPS-kapcsolaton keresztül.",
          "A vendégként, ügyfélként vagy partnerként leadott időpontkérés a szerviz adatbázisába kerül. A kérés a munkafelvevő, vezető vagy adminisztrátor telefonos visszaigazolásával foglal műhelykapacitást. Jelenleg nincs automatikus e-mail-küldés, címellenőrzés vagy e-mailes jelszó-visszaállítás.",
        ],
      },
      {
        id: "adatok",
        title: "Milyen adatokat kezel a portál?",
        items: [
          "Fiók: név, e-mail-cím, opcionális mobiltelefonszám és település, szerepkör, aktív/letiltott állapot és fiókazonosító. Az ÁSZF elfogadott verzióját és időpontját a szerver rögzíti.",
          "Mentett jármű: rendszám, márka, modell, gyártási év, tulajdonos fiókazonosítója, létrehozási és módosítási időpont, valamint az alapértelmezett jármű kiválasztása. A listát a saját fiókod és az adminisztrátor kezelheti; más ügyfél, partner, munkafelvevő vagy vezető a saját fiókjához tartozó járműveket kezeli.",
          "Időpontkérés: szolgáltatás és annak mentett neve, becsült időtartam és esetleges árjelzés, nap, időpont, megjegyzés és állapot; kapcsolattartási és járműadatok másolata; partnernél cégnév. A szerver rögzíti az elfogadott feltételverziót, időpontot, módosítási sorszámot és állapotelőzményeket. A telefonos visszaigazoláshoz a művelet ideje és a jogosult munkatárs azonosítása tartozik; ezt az ügyfélnek adott nézet nem mutatja.",
          "Korábban feltöltött opcionális profilkép: a users.avatar fájlmezőben tárolt, védett kép. A képfeltöltő backend 512 × 512 pixeles keretbe igazítja, WebP formátumra alakítja és eltávolítja a fotó metaadatait, például az EXIF-helyadatokat. A jelenlegi webes felület kezdőbetűket jelenít meg, profilképet nem kér és nem tölt be.",
          "Céges profiladatok: opcionális cégnév, adószám és céges település. A partnerfiókhoz saját mentett járműlista tartozik; több külön fiók közös flottakezelése még nem érhető el.",
          "Hitelesítés: a jelszó lenyomatát PocketBase tárolja, a jelszó TLS-kapcsolaton jut el a kiszolgálókhoz. A böngésző HttpOnly munkamenetsütit kap; az alkalmazás nem tárol valódi jelszót vagy hitelesítési tokent a localStorage-ban.",
        ],
      },
      {
        id: "celok",
        title: "Mire használjuk ezeket?",
        paragraphs: [
          "A vendég hozzáférési azonosító a saját kéréseid megnyitását védi. Visszaélésvédelemhez a PocketBase rövid ideig, jellemzően két percig őriz lenyomatból képzett kéréskorlátozási számlálókat; a technikai szolgáltatók naplóinak megőrzése ettől külön üzemeltetési beállítás.",
          "A fiókadatok a belépést, profilkezelést és jogosultságkezelést szolgálják. A fiók, céges profil, járművek és időpontkérések PocketBase-ben tárolódnak. A valódi személyes és foglalási adatok nem kerülnek a böngésző localStorage-jába. A témabeállítás ettől elkülönülten használ helyi tárhelyet.",
          "Minden új fiók magánügyfélként indul. Partner-, munkafelvevői, vezetői vagy adminisztrátori hozzáférést adminisztrátor adhat. A nyilvános demószerepkör-váltó megszűnt.",
        ],
      },
      {
        id: "tarolas",
        title: "Tárolás és megőrzés",
        paragraphs: [
          "A mentett jármű adatait a Járműveim vagy Járműpark oldalon módosíthatod és törölheted. A fiók törlése a hozzá tartozó mentett járműveket is törli. Korábbi biztonsági mentésekben az adatok a meghatározott megőrzési ideig még szerepelhetnek. A mentett jármű törlése nem töröl már külön rögzített időpontkérési másolatot.",
          "A korábban feltöltött profilkép eltávolítását az üzemeltetőtől kérheted; a jelenlegi webes felületen nincs képfeltöltő. A PocketBase a korábbi aktuális képfájlt csere vagy törlés után eltávolítja; korábbi biztonsági mentésekben a beállított megőrzési ideig még szerepelhet. A mentések megőrzését az üzemeltetőnek kell meghatároznia.",
          "A fiókok az üzemeltető PocketBase-adatbázisában tárolódnak, másik eszközről is elérhetők. A fiók-, technikai napló- és biztonságimentés-megőrzési időket az alábbi megőrzési adatmezőben az üzemeltetőnek kell meghatároznia. A munkamenetsüti legfeljebb 8 órás; kijelentkezéskor a jelen böngésző sütijét töröljük.",
          "Az időpontkérések és állapotelőzményeik a szerviz adatbázisában maradnak. Fióktörléskor a fiókhoz mutató kapcsolat megszűnik, az időpontkérésben mentett kapcsolattartási és járműmásolatot nem töröljük automatikusan; annak célját, jogalapját és megőrzését az üzemeltetőnek kell meghatároznia. A vendégoldali hozzáférés a kérés vagy új időpontkérés után legfeljebb 120 napig tart. Korábbi demóverzióból maradt helyi adatok nem kerülnek az adatbázisba, és a webhelyadatok törlésével távolíthatók el.",
        ],
      },
      {
        id: "kulso-szolgaltatasok",
        title: "Külső kapcsolatok",
        paragraphs: [
          "Az Inter és Outfit betűkészleteket ez a webhely helyben szolgálja ki. A megjelenítéshez nem küldünk betűkészlet-lekérést a Google Fonts vagy más külső betűkészlet-szolgáltató felé.",
          "A fő weboldalra, térképre, telefonra vagy e-mailre mutató külső linkek a megfelelő szolgáltatáshoz vezetnek. A tárhely és a homelab tényleges szolgáltatóit az élesítéskor az impresszumban és az adatkezelési dokumentációban is meg kell nevezni.",
        ],
      },
      {
        id: "keresek",
        title: "Kérdések és érintetti kérelmek",
        paragraphs: [
          `Adatkezelési kérdéssel a ${site.legal.privacyEmail} címen kereshetsz minket. A hozzáférés, helyesbítés, törlés, korlátozás, adathordozhatóság és tiltakozás lehetőségeit az alkalmazandó feltételek szerint kell biztosítani.`,
          `A helyi demóadatokat az üzemeltető távolról nem tudja törölni a saját böngésződből. Ezek eltávolítását a böngésződ webhelyadat-kezelőjében végezheted el. Panasz esetén a Nemzeti Adatvédelmi és Információszabadság Hatóság elérhetőségei a naih.hu oldalon találhatók.`,
        ],
      },
      {
        id: "jogalapok",
        title: "Az éles adatkezelés céljai és jogalapjai",
        paragraphs: [
          "Az adatkezelési tájékoztató megismerése nem általános hozzájárulás minden adatkezeléshez. Az ÁSZF elfogadása, az érintett tájékoztatása és az esetleges marketing-hozzájárulás külön kérdés.",
          "Éles, természetes személy ügyfelek fiókjánál és időpontkérésénél a szolgáltatáshoz szükséges adatok kezelésének alapja tipikusan a GDPR 6. cikk (1) b) pontja, a szerződés vagy az érintett kérésére tett szerződéskötést megelőző lépések. Céges kapcsolattartóknál és biztonsági naplózásnál az adott célhoz megfelelő jogalapot külön kell meghatározni, jogos érdek esetén érdekmérlegeléssel. A panaszkezelés és a kötelező megőrzés jogi kötelezettségen is alapulhat. A marketing nem része az időpontfoglaláshoz szükséges adatkezelésnek.",
          "Az éles célokat, adatfeldolgozókat, naplózást, megőrzési időket és az esetleges EU-n kívüli adattovábbítás garanciáit a tényleges telepítés szerint kell kitölteni. Ennek hiányában a dokumentum minta állapotú marad.",
        ],
        facts: [
          {
            label: "Éles célok, jogalapok, szolgáltatók és továbbítások",
            value: missing(site.legal.productionDataProcessing),
          },
          {
            label: "Éles fiók-, foglalási és naplómegőrzés",
            value: missing(site.legal.productionRetention),
          },
        ],
      },
      {
        id: "jogok-reszletesen",
        title: "Az érintetti jogok gyakorlása",
        paragraphs: [
          "A GDPR feltételei szerint tájékoztatást és hozzáférést, helyesbítést, törlést vagy korlátozást kérhetsz; megfelelő esetben adathordozhatósági vagy tiltakozási jogod is van. Hozzájáruláson alapuló kezelésnél a hozzájárulást a jövőre nézve visszavonhatod. A törlés nem feltétlenül terjed ki a jogszabály alapján kötelezően megőrzött adatokra.",
          "A kérelmeket indokolatlan késedelem nélkül, főszabály szerint egy hónapon belül kell megválaszolni. Összetett vagy nagyszámú kérelmeknél a GDPR feltételeivel legfeljebb további két hónap hosszabbítás lehetséges; erről és az okokról az első hónapon belül tájékoztatást kell adni. Személyazonosításhoz csak az indokolt, szükséges adat kérhető.",
          "A saját profiladatok a Saját fiók oldalon helyesbíthetők. Fióktörléshez és egyéb érintetti kérelmekhez keresd az adatkezelőt a fent megadott címen. A kérelmek azonosítását, teljesítését és dokumentálását az üzemeltető végzi. A böngészőben maradó demóadatokat a webhelyadatok törlésével távolíthatod el. Panasz a NAIH-nál tehető, és a GDPR szerint bírósági jogorvoslat is rendelkezésre áll.",
          "A NAIH székhelye: 1055 Budapest, Falk Miksa utca 9–11.; levelezési címe: 1363 Budapest, Pf. 9.; telefon: +36 (1) 391-1400. Hatósági eljárás indításához a Hatóság hivatalos ügyintézési csatornáit kell követni.",
        ],
        links: [
          {
            label: "NAIH – hivatalos ügyfélszolgálat és kapcsolattartás",
            href: "https://naih.hu/ugyfelszolgalat-kapcsolat",
          },
          {
            label: "GDPR – az (EU) 2016/679 rendelet",
            href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
          },
        ],
      },
      {
        id: "elesites",
        title: "Az éles változat előtt pontosítandó",
        paragraphs: [
          "Az éles rendszerhez rögzíteni kell a célonkénti jogalapokat, megőrzési időket, címzetteket és adatfeldolgozókat, az esetleges harmadik országbeli továbbításokat, az érintetti kérelmek folyamatát és a tényleges technikai védelmet. A hozzájárulás nem helyettesíti minden adatkezelés megfelelő jogalapjának meghatározását.",
        ],
      },
    ],
  },
  {
    ...legalNavigation[1],
    title: "Tiszta feltételek, az első lépéstől.",
    description:
      "A portál használatának és az online időpontkérésnek az alapvető feltételei.",
    sections: [
      {
        id: "szolgaltato",
        title: "A szolgáltató",
        facts: [
          { label: "Cégnév", value: site.legal.companyName },
          { label: "Műhely", value: address },
          { label: "Telefon", value: site.contact.phone },
          { label: "E-mail", value: site.contact.email },
        ],
      },
      {
        id: "hataly",
        title: "A dokumentum hatálya",
        paragraphs: [
          "Ez a szerkeszthető minta a portál időpontkérő működését írja le. A fiók létrehozása és az időpontkérés nem hoz létre javítási megrendelést. A kérés a szerviz adatbázisába kerül, a kiválasztott időpontot telefonos visszaigazolás biztosítja. A szolgáltatás feltételeit a tényleges működéshez és a kötelező jogszabályokhoz kell igazítani.",
        ],
      },
      {
        id: "idopontkeres",
        title: "Az időpontkérés menete",
        items: [
          "Válaszd ki a szolgáltatást és egy elérhető napot, illetve érkezési időpontot.",
          "Add meg a kapcsolattartási és járműadatokat, majd ellenőrizd az összesítést.",
          "Az elküldött kérés a szerviz rendszerében telefonos egyeztetésre vár. A kért időpontot a telefonos visszaigazolás biztosítja; az elküldés önmagában nem foglal műhelykapacitást és nem hoz létre javítási megrendelést.",
        ],
      },
      {
        id: "elektronikus-ugyintezes",
        title: "Elektronikus ügyintézés és a szerződés határa",
        facts: [
          {
            label: "Magatartási kódex / alkalmazhatóság",
            value: missing(site.legal.codeOfConduct),
          },
        ],
        paragraphs: [
          "A portál nyelve magyar. A szolgáltatás és időpont kiválasztását adatmegadás és áttekintés követi. Az adatbeviteli hibák a végleges elküldés előtt a visszalépési és módosítási lehetőségekkel javíthatók.",
          "A jelenlegi modellben időpontkérés történik; a javítás tartalmát és végleges árát külön kell egyeztetni. A portál nem köt és nem iktat írásbeli javítási szerződést. A sikeres beérkezést az oldalon megjelenő azonosító és összesítés jelzi; a kérés a Foglalásaim oldalon visszaidézhető. Jelenleg nem küldünk automatikus e-mailt.",
          "Éles elektronikus megrendelés esetén a 2001. évi CVIII. törvény szerinti beérkezési visszaigazolást és a szerződéses folyamatot ténylegesen biztosítani kell; az automatikus átvételi visszaigazolás és a megrendelés elfogadása nem feltétlenül ugyanaz. Az elküldött megrendelés visszaigazolásának elmaradásához a törvény főszabály szerint legfeljebb 48 órán belüli jogkövetkezményt kapcsol. A pontos alkalmazhatóságot a megvalósított üzleti modell szerint kell ellenőrizni.",
          "A feltételek megismerhetők és az oldalról szöveges fájlként letölthetők. A regisztrációnál és az időpontkérésnél a szerver PocketBase-ben rögzíti az elfogadott feltételverziót és időpontot. A korábbi hatályos dokumentumváltozatok megőrzését az üzemeltetőnek biztosítania kell.",
        ],
      },
      {
        id: "arak",
        title: "Munka, időtartam és ár",
        facts: [
          {
            label: "Árfeltüntetés és árképzés",
            value: missing(site.legal.pricingDisclosure),
          },
        ],
        paragraphs: [
          site.booking.requestNotice,
          "A szolgáltatás mellett esetleg feltüntetett ár nem válik az időpontkérés elküldésével elfogadott javítási árajánlattá. A kijelzett összegnél egyértelműen jelezni kell, hogy meghatározott tartalmú fix bruttó díj, induló (–tól) ár vagy becslés, mit tartalmaz, és milyen további költség merülhet fel. Fogyasztói árnál az áfát és az elkerülhetetlen díjakat tartalmazó összeget kell világosan feltüntetni. A tényleges árképzési tájékoztatást a fenti adatmezőben, a konkrét szolgáltatásokhoz igazítva kell kitölteni.",
          "A felületen megadott időtartamok tájékoztató becslések. A javítási megrendelés és az esetleges többletmunka feltételeit külön kell egyeztetni. A prototípus nem kezel fizetést, számlázást vagy árajánlat-elfogadást.",
        ],
      },
      {
        id: "modositas",
        title: "Módosítás és lemondás",
        paragraphs: [
          "A jövőbeni, telefonos egyeztetésre váró vagy visszaigazolt időpontkérés a Foglalásaim oldalon módosítható vagy lemondható. A módosítás új telefonos visszaigazolást igényel, a korábban visszaigazolt kapacitás felszabadul. Folyamatban lévő vagy elkészült munka online már nem mondható le. Vendégként ehhez az adott böngésző hozzáférési sütije szükséges; ennek hiányában telefonon keresd a szervizt.",
          "Az éles rendszer lemondási határidejét, az esetleges díjakat, a fogyasztói jogokat és a szerződés létrejöttét a tényleges szolgáltatás alapján kell meghatározni; ez a minta nem állapít meg ilyen díjakat vagy jogkorlátozásokat.",
        ],
      },
      {
        id: "fiok",
        title: "Fiók és céges használat",
        paragraphs: [
          "Regisztráció után e-mail-címmel és jelszóval azonnal bejelentkezhetsz, e-mail-ellenőrzés nélkül. A saját kapcsolattartási és céges profiladatok, valamint a mentett járművek PocketBase-ben tárolhatók. Az e-mail-cím és jelszó módosításához a jelenlegi jelszó szükséges. Elfelejtett jelszóval az üzemeltetőhöz kell fordulni. Az időpontkérések és visszaigazolások a Foglalásaim oldalon követhetők.",
          "A céges és munkatársi nézetek elérését a PocketBase-ben tárolt szerepkör szabályozza. Új fiókhoz az adminisztrátor adhat bővebb hozzáférést. Az admin kezelheti mások fiókjait és hozzáférését; a saját és a védett alapadmin-fiók törlése vagy lefokozása az alkalmazásban nem engedélyezett.",
        ],
      },
      {
        id: "kapcsolat",
        title: "Kapcsolat és panaszkezelés",
        paragraphs: [
          `Kérdéssel vagy panasszal a ${site.contact.email} címen vagy a ${site.contact.phone} telefonszámon keresheted a szervizt. A részletes panaszkezelési, békéltetési, elállási és javítási jótállási szabályokat a lábléc Fogyasztói tájékoztató oldala ismerteti.`,
        ],
      },
    ],
  },
  {
    ...legalNavigation[2],
    title: "Mi marad a böngésződben?",
    description:
      "Áttekintés a helyi mentésekről, a témabeállításról és a külső betűkészletekről.",
    sections: [
      {
        id: "helyi-tarhely",
        title: "Sütik és localStorage",
        paragraphs: [
          "A bejelentkezéshez és a kért vendégfoglalás kezeléséhez szükséges hozzáférési adatok HttpOnly sütikben tárolódnak. A valódi fiók- és foglalási adatokat PocketBase tárolja, nem a localStorage. A témabeállítás a localStorage-ot használja. Nincs beépített hirdetési vagy analitikai követés. A tárolási célok Eht. 155. § és alkalmazandó uniós szabályok szerinti besorolását az üzemeltetőnek a tényleges működés alapján kell ellenőriznie.",
        ],
      },
      {
        id: "tarolok",
        title: "A jelenlegi mentések",
        facts: [
          {
            label: "fairauto-prototype-v1",
            value:
              "Korábbi prototípusból visszamaradt helyi mintaadatok. Az új portál nem olvassa és nem importálja őket; a webhelyadatok törléséig maradhatnak meg. Nem biztosítanak bejelentkezést vagy hozzáférést valódi időpontokhoz.",
          },
          {
            label: "__Host-fairauto_session (fejlesztéskor: fairauto_session)",
            value:
              "Belépéskor létrejövő, a kért hitelesítési szolgáltatáshoz szükséges munkamenetsüti. HttpOnly; éles környezetben Secure és SameSite=Lax, legfeljebb 8 óráig érvényes. Kijelentkezés törli a jelen böngészőből. Nem marketingcélú.",
          },
          {
            label: "__Host-fairauto_guest (fejlesztéskor: fairauto_guest)",
            value:
              "A kért vendégfoglalási funkcióhoz létrejövő, véletlen hozzáférési azonosító. HttpOnly, éles környezetben Secure és SameSite=Lax. Legfeljebb 120 napig él, a vendégfoglaló újbóli megnyitása megújíthatja. Nem tartalmaz nevet, e-mailt vagy foglalási adatokat; a szerver csak az azonosító kriptográfiai lenyomatát tárolja. Nem marketingcélú.",
          },
          {
            label: "fairauto-theme",
            value:
              "A választott világos vagy sötét téma. Megmarad a webhelyadatok törléséig.",
          },
        ],
      },
      {
        id: "beallitasok",
        title: "A mentések kezelése",
        paragraphs: [
          "A főoldal és a tájékoztató oldalak nem hoznak létre helyi demóadatbázist. A vendégfoglaló megnyitásakor a kért foglalási funkcióhoz hozzáférési süti jön létre; a témaválasztást a gombbal kért beállítás után jegyezzük meg. Opcionális követést jelenleg nem használunk.",
          "A böngésző webhelyadatainak törlése eltávolítja a témaválasztást, a régi helyi demóadatokat és a sütiket. Ez nem törli a szerviz adatbázisában lévő kéréseket. A vendégkérésekhez való böngészős hozzáférés ilyenkor elveszik; a szerviz telefonon segíthet. A fiókhoz tartozó kérések új bejelentkezés után ismét elérhetők.",
          "Privát böngészési módban vagy letiltott sütik mellett a vendégkérésekhez való hozzáférés megőrzése korlátozott lehet. A foglalási azonosítót érdemes elmenteni; önmagában ez nem ad online hozzáférést a személyes adatokhoz.",
        ],
      },
      {
        id: "betukeszletek",
        title: "Külső betűkészletek és későbbi bővítések",
        paragraphs: [
          "A betűkészletek a webhely saját fájljai közül töltődnek be, külső Google Fonts-kapcsolat nélkül. A tárhelyszolgáltatóhoz a weboldal kiszolgálásával járó technikai kérések természetesen eljutnak.",
          "Az alkalmazásban nincs analitika, beágyazott térkép vagy hirdetési követés. A tárhely és a Cloudflare Tunnel a fiókszolgáltatás technikai kéréseit is kezeli. Új külső szolgáltatásnál a tájékoztatót és a szükséges hozzájárulás-kezelést a tényleges működéshez kell igazítani.",
        ],
      },
    ],
  },
  {
    ...legalNavigation[3],
    title: "Kik állnak a szerviz mögött?",
    description:
      "Az üzemeltető, a kapcsolattartás és az élesítéshez kitöltendő cégadatok.",
    sections: [
      {
        id: "cegadatok",
        title: "Üzemeltetői adatok",
        facts: [
          { label: "Cégnév", value: site.legal.companyName },
          { label: "Székhely", value: missing(site.legal.registeredOffice) },
          {
            label: "Cégjegyzékszám",
            value: missing(site.legal.registrationNumber),
          },
          { label: "Adószám", value: missing(site.legal.taxNumber) },
          {
            label: "Nyilvántartó hatóság",
            value: missing(site.legal.registryAuthority),
          },
          { label: "Képviselő", value: missing(site.legal.representative) },
          {
            label: "Engedélyezés / szabályozott tevékenység",
            value: missing(site.legal.regulatedServiceDisclosure),
          },
        ],
      },
      {
        id: "elerhetosegek",
        title: "Kapcsolat",
        facts: [
          { label: "Műhely címe", value: address },
          { label: "Telefon", value: site.contact.phone },
          { label: "E-mail", value: site.contact.email },
          { label: "Nyitvatartás", value: site.hours.long },
        ],
      },
      {
        id: "tarhely",
        title: "Tárhely és technikai szolgáltatók",
        facts: [
          {
            label: "Tárhelyszolgáltató",
            value: missing(site.legal.hostingProvider),
          },
          {
            label: "Szolgáltató címe / elérhetősége",
            value: missing(site.legal.hostingAddress),
          },
          {
            label: "Tárhelyszolgáltató e-mail",
            value: missing(site.legal.hostingEmail),
          },
        ],
        paragraphs: [
          "A frontend Vercelen, a PocketBase az üzemeltető homelabján, Cloudflare Tunnel közvetítésével működik. A szolgáltatók pontos jogi adatait, adatfeldolgozói szerepeit, földrajzi helyét és továbbítási garanciáit az üzemeltetőnek a tényleges telepítés szerint ki kell töltenie. Jelenleg nincs e-mail-küldő szolgáltatás.",
        ],
      },
    ],
  },
  consumerDocument,
];
