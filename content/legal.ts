/** A jogi oldalak szerkeszthető szövege. A jelenlegi, helyben tároló demót írja le.
 * PocketBase, levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
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
          "Ez a változat egy helyi adatokat használó bemutató. Nem kapcsolódik a szerviz ügyféladatbázisához, nem küld valódi időpontkérést vagy e-mailt. Kérjük, csak mintaadatokat és máshol nem használt demójelszót adj meg.",
          "A PocketBase-alapú fiókkezelés későbbi bekötése külön fejlesztés. A jelen tájékoztató nem ír le még nem létező adatkezelést.",
        ],
      },
      {
        id: "adatok",
        title: "Milyen adatokat kezel a demó?",
        items: [
          "Fiók: név, e-mail-cím, mobiltelefonszám, település és értesítési preferencia.",
          "Jármű: rendszám, márka, modell és gyártási év.",
          "Időpontkérés: szolgáltatás, nap, időpont, megjegyzés és állapot, valamint a megadott kapcsolattartási és járműadatok másolata.",
          "Céges fiók: cégnév, adószám, település és a fiókhoz mentett flotta.",
          "Helyi bejelentkezés: az aktív demófiók azonosítója és a regisztrált demójelszó sózott lenyomata. Ez nem éles hitelesítési rendszer.",
        ],
      },
      {
        id: "celok",
        title: "Mire használjuk ezeket?",
        paragraphs: [
          "Az adatok a foglalási és fiókkezelési felület kipróbálását, az automatikus adatkitöltést, valamint a szerepkörök és helyi riportok bemutatását szolgálják. A mentések a böngésző localStorage-tárolójába kerülnek.",
          "A bemutatóban a szerepkörök szabadon válthatók; az ugyanabban a böngészőben tárolt adatok így nem tekinthetők egymástól biztonságosan elkülönített ügyféladatoknak.",
        ],
      },
      {
        id: "tarolas",
        title: "Tárolás és megőrzés",
        paragraphs: [
          "A demómentések a böngészőben maradnak a webhelyadatok törléséig. Nincs automatikus lejárat. Másik böngészőben vagy eszközön ezek a mentések nem érhetők el.",
          "A járműadatok későbbi módosítása nem írja át a korábbi foglalásokban tárolt másolatot. A teljes helyi demóadatállományt a böngésződ webhelyadat-kezelésében törölheted.",
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
          "A helyi demóadatokhoz az üzemeltetőnek nincs távoli hozzáférése. Az élesítés előtt működő folyamat szükséges a kérelmek befogadására, azonosítására, teljesítésére és dokumentálására. Panasz a NAIH-nál tehető, és a GDPR szerint bírósági jogorvoslat is rendelkezésre áll.",
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
          "Ez a szerkeszthető minta a portál bemutató változatát írja le. A demóban létrehozott fiók vagy időpont nem hoz létre tényleges szervizmegrendelést. Az éles szolgáltatás feltételeit a tényleges működéshez és a kötelező jogszabályokhoz kell igazítani.",
        ],
      },
      {
        id: "idopontkeres",
        title: "Az időpontkérés menete",
        items: [
          "Válaszd ki a szolgáltatást és egy elérhető napot, illetve érkezési időpontot.",
          "Add meg a kapcsolattartási és járműadatokat, majd ellenőrizd az összesítést.",
          "Az éles működés tervezett menete szerint az időpont a műhely visszaigazolása után válik véglegessé. A jelen demó nem továbbít kérést a szerviznek.",
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
          "A jelenlegi modellben időpontkérés történik; a javítás tartalmát és árát külön kell egyeztetni. A demó nem hoz létre írásba foglalt javítási szerződést, nem iktat ilyen szerződést, és nem küld szerződéses visszaigazolást. A helyi foglalási adatokat a Foglalásaim oldal mutatja, amíg a böngésző megőrzi őket.",
          "Éles elektronikus megrendelés esetén a 2001. évi CVIII. törvény szerinti beérkezési visszaigazolást és a szerződéses folyamatot ténylegesen biztosítani kell; az automatikus átvételi visszaigazolás és a megrendelés elfogadása nem feltétlenül ugyanaz. Az elküldött megrendelés visszaigazolásának elmaradásához a törvény főszabály szerint legfeljebb 48 órán belüli jogkövetkezményt kapcsol. A pontos alkalmazhatóságot a megvalósított üzleti modell szerint kell ellenőrizni.",
          "A feltételek megismerését, menthetőségét és visszaidézhetőségét biztosítani kell. A dokumentum lent szöveges fájlként letölthető. A demó az új fiókoknál és időpontkéréseknél rögzíti az elfogadott feltételverziót és a helyi elfogadási időt; éles környezetben ehhez megbízható szerveroldali nyilvántartás szükséges.",
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
          "A még el nem kezdett demófoglalások a Foglalásaim oldalon módosíthatók vagy lemondhatók. Az új időpontkérés ismét visszaigazolásra vár. A lemondás a helyi demónaptárban felszabadítja az időpontot.",
          "Az éles rendszer lemondási határidejét, az esetleges díjakat, a fogyasztói jogokat és a szerződés létrejöttét a tényleges szolgáltatás alapján kell meghatározni; ez a minta nem állapít meg ilyen díjakat vagy jogkorlátozásokat.",
        ],
      },
      {
        id: "fiok",
        title: "Fiók és céges használat",
        paragraphs: [
          "Vendégként is megadhatók a foglalási adatok. Saját fiókkal a kapcsolattartási adatok és járművek elmenthetők. A demófiók csak az adott böngészőben működik.",
          "A céges felület flottakezelési és exportálási lehetőségeket mutat be. A demóban az üzemeltetői szerepkörök is kipróbálhatók; ezek nem jelentenek éles hozzáférési jogosultságot.",
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
          "A prototípus a saját fiók-, jármű- és foglalási adatait a böngésző localStorage-tárhelyén menti. Ezek nem automatikusan, minden kéréshez elküldött HTTP-sütik. A jelen alkalmazáskódban nincs beépített hirdetési vagy analitikai követés. A localStorage használata sem mentesül automatikusan az adatvédelmi és végberendezési tárolásra vonatkozó szabályok alól: az Eht. 155. § és az alkalmazandó uniós előírások szerinti vizsgálat ezekre is kiterjed.",
        ],
      },
      {
        id: "tarolok",
        title: "A jelenlegi mentések",
        facts: [
          {
            label: "fairauto-prototype-v1",
            value:
              "Demófiókok, sózott jelszólenyomatok, járművek, foglalások, céges adatok és lezárt napok. Megmaradnak a webhelyadatok törléséig.",
          },
          {
            label: "fairauto-session-v1",
            value:
              "Az aktív demófiók azonosítója. Kijelentkezéskor vagy a webhelyadatok törlésekor eltávolítható.",
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
          "A főoldal és a tájékoztató oldalak puszta megnyitása nem hoz létre demófiók-adatbázist a böngészőben. A demóportál használatakor a kért funkciókhoz szükséges helyi mentések jönnek létre. A témaválasztást csak a gombbal kért beállítás után jegyezzük meg. Új, hozzájárulásköteles célhoz előzetes, célonkénti választás és egyszerű visszavonás szükséges; az oldal ilyen opcionális követést jelenleg nem valósít meg.",
          "A teljes demóadatállományt a böngésző webhelyadat- vagy tárhelybeállításainál törölheted. Ezzel a helyi fiókok és foglalások is elvesznek; a következő látogatás újra létrehozza az alap mintaadatokat.",
          "Privát böngészési módban vagy letiltott helyi tárhely mellett az adatok megőrzése korlátozott lehet. A helyi fájl nem helyettesít biztonsági mentést vagy éles ügyfélfiókot.",
        ],
      },
      {
        id: "betukeszletek",
        title: "Külső betűkészletek és későbbi bővítések",
        paragraphs: [
          "A betűkészletek a webhely saját fájljai közül töltődnek be, külső Google Fonts-kapcsolat nélkül. A tárhelyszolgáltatóhoz a weboldal kiszolgálásával járó technikai kérések természetesen eljutnak.",
          "PocketBase-hitelesítés, analitika, beágyazott térkép vagy más külső szolgáltatás bevezetésekor a listát és az esetleg szükséges hozzájárulás-kezelést a tényleges működéshez kell igazítani. Ez az oldal önmagában nem vezet be ilyen szolgáltatást.",
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
          "A tényleges frontendtárhelyet, a homelab üzemeltetőjét, az e-mail-szolgáltatót és az adatfeldolgozói szerepeket az éles telepítés alapján kell megadni. A PocketBase jelenleg nincs bekötve ebbe a prototípusba.",
        ],
      },
    ],
  },
  consumerDocument,
];
