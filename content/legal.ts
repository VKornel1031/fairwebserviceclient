/** A jogi oldalak szerkeszthető szövege. A jelenlegi, helyben tároló demót írja le.
 * PocketBase, levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
import { address, site, legalNavigation } from "./site";
export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  facts?: { label: string; value: string }[];
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
          "Az Inter és Outfit betűkészleteket az oldal a Google Fonts szolgáltatásából tölti be (fonts.googleapis.com és fonts.gstatic.com). A betűkészlet lekérésekor hálózati adatok, például IP-cím és böngészőadatok juthatnak a szolgáltatóhoz.",
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
        id: "arak",
        title: "Munka, időtartam és ár",
        paragraphs: [
          "A felületen megadott időtartamok tájékoztató becslések. A pontos javítási igényt, munkát, árat és vállalási feltételeket a szervizzel külön kell egyeztetni. A prototípus nem kezel fizetést, számlázást vagy árajánlat-elfogadást.",
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
          `Kérdéssel vagy panasszal a ${site.contact.email} címen vagy a ${site.contact.phone} telefonszámon keresheted a szervizt. Az éles ÁSZF-ben ki kell egészíteni az írásbeli panaszkezelés szabályait, az illetékes békéltető testület elérhetőségét és az alkalmazandó fogyasztóvédelmi tájékoztatást.`,
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
          "A prototípus a saját fiók-, jármű- és foglalási adatait a böngésző localStorage-tárhelyén menti. Ezek nem automatikusan, minden kéréshez elküldött HTTP-sütik. A jelen alkalmazáskódban nincs beépített hirdetési vagy analitikai követés.",
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
          "A teljes demóadatállományt a böngésző webhelyadat- vagy tárhelybeállításainál törölheted. Ezzel a helyi fiókok és foglalások is elvesznek; a következő látogatás újra létrehozza az alap mintaadatokat.",
          "Privát böngészési módban vagy letiltott helyi tárhely mellett az adatok megőrzése korlátozott lehet. A helyi fájl nem helyettesít biztonsági mentést vagy éles ügyfélfiókot.",
        ],
      },
      {
        id: "betukeszletek",
        title: "Külső betűkészletek és későbbi bővítések",
        paragraphs: [
          "Az oldal a megjelenéshez Google Fonts betűkészleteket kér le. Ezt a kapcsolatot az Adatkezelési Tájékoztató is ismerteti.",
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
        ],
        paragraphs: [
          "A tényleges frontendtárhelyet, a homelab üzemeltetőjét, az e-mail-szolgáltatót és az adatfeldolgozói szerepeket az éles telepítés alapján kell megadni. A PocketBase jelenleg nincs bekötve ebbe a prototípusba.",
        ],
      },
    ],
  },
];
