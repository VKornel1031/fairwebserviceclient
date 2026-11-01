/** A jogi oldalak szerkeszthető szövege. A PocketBase-fiókokat, járműveket és időpontkéréseket írja le.
 * Levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
import { address, site, legalNavigation, contactPhoneLabel } from "./site";
import { consumerDocument } from "./consumer";
import { privacyDocument } from "./privacy";
import { dataSecurityDocument } from "./data-security";
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
  download?: { filename: string; label: string };
};
const missing = (value: string) =>
  value || "Kitöltés szükséges az éles használat előtt";
export const legalDocuments: LegalDocument[] = [
  privacyDocument,
  {
    ...legalNavigation[1],
    download: {
      filename: "aszf.txt",
      label: "ÁSZF letöltése szöveges fájlként",
    },
    title: "Tiszta feltételek, az első lépéstől.",
    description:
      "A portál használatának és az online időpontkérésnek az alapvető feltételei.",
    sections: [
      {
        id: "szolgaltato",
        title: "A szolgáltató",
        facts: [
          { label: "Cégnév", value: site.legal.companyName },
          { label: "Székhely", value: site.legal.registeredOffice },
          { label: "Cégjegyzékszám", value: site.legal.registrationNumber },
          { label: "Adószám", value: site.legal.taxNumber },
          { label: "Képviselő", value: site.legal.representative },
          { label: "Műhely", value: address },
          { label: "Telefon", value: contactPhoneLabel },
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
          `Műszaki vizsgára kizárólag telefonon, a ${contactPhoneLabel} telefonszámokon egyeztethető időpont. A többi, onlineként megjelenő szolgáltatás a foglalóban választható.`,
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
          "A jelenlegi modellben időpontkérés történik; a javítás tartalmát és végleges árát külön kell egyeztetni. A portál nem köt és nem iktat írásbeli javítási szerződést. A sikeres beérkezést az oldalon megjelenő azonosító és összesítés jelzi; a kérés a Foglalásaim oldalon visszaidézhető. Ha az üzemeltető bekapcsolja a levelezést, az időpontkérésről, telefonos visszaigazolásról, átütemezésről, lemondásról, árváltozásról és elkészült munkáról külön szolgáltatási értesítés küldhető. A webes mentés sikere nem igazolja a levél kézbesítését.",
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
          "Telefonos visszaigazolás után a munkafelvevő, vezető vagy adminisztrátor bruttó forintban árbecslést rögzíthet, egy összegben vagy alkatrész-, munkadíj- és egyéb tételekre bontva. A saját időpont részleteiben az ügyfél is látja. Átütemezéskor a korábbi becslés érvényét veszti. Ez nem számla, elfogadott javítási ajánlat vagy fizetési kötelezettséget létrehozó megrendelés.",
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
          "Nyilvános regisztrációhoz cégnév, magyar adószám és kapcsolattartó szükséges. Az új fiók automatikusan csak céges partner szerepet kap. Vezetői, munkafelvevői és adminisztrátori hozzáférést kizárólag adminisztrátor oszthat ki; az e-mail-cím igazolása nem módosít szerepkört. A Partnerközpontban saját mentett járműpark és a saját időpontok kezelhetők.",
          "Új céges fiók regisztrációja után a levélben kapott hivatkozással meg kell erősíteni az e-mail-címet; ezután e-mail-címmel és jelszóval lehet belépni. A korábbi fiókok hozzáférése megmarad; az átállás nem minősíti automatikusan igazoltnak címüket. A saját kapcsolattartási és céges profiladatok, valamint a mentett járművek PocketBase-ben tárolhatók. Az e-mail-cím módosításához a jelenlegi jelszó és az új címre küldött hivatkozás megerősítése szükséges. Jelszó módosítása jelenlegi jelszóval, elfelejtett jelszó helyett új jelszó beállítása pedig az e-mailben kapott, időben korlátozott hivatkozással lehetséges. Az időpontkérések és visszaigazolások a Foglalásaim oldalon követhetők.",
          "A céges és munkatársi nézetek elérését a PocketBase-ben tárolt szerepkör szabályozza. Új fiókhoz az adminisztrátor adhat bővebb hozzáférést. Az admin kezelheti mások fiókjait és hozzáférését; a saját és a védett alapadmin-fiók törlése vagy lefokozása az alkalmazásban nem engedélyezett.",
        ],
      },
      {
        id: "adatkezeles-es-biztonsag",
        title: "Adatkezelés és adatbiztonság",
        paragraphs: [
          `A vendég által indított kérés aktív webes adatait és kapcsolódó előzményeit, értesítési másolatait a befejezés vagy lemondás rögzítése után ${site.guestRetentionDays} nap elteltével időzített feladat törli. A még nyitott ügyeket és a fiókos foglalásokat ez a törlés nem érinti. A további megőrzési köröket, jogosultságokat és érintetti jogokat az adatkezelési tájékoztató részletezi.`,
          "Az adatvédelmi és adatbiztonsági szabályzat a társaság belső hozzáférési, üzemeltetési és incidenskezelési rendjének nyilvános leírása. Megismerése nem általános adatkezelési hozzájárulás, és nem helyettesíti az adatkezelési tájékoztatót.",
        ],
        links: [
          {
            label: "Adatkezelési Tájékoztató",
            href: "/adatkezelesi-tajekoztato",
          },
          {
            label: "Adatvédelmi és adatbiztonsági szabályzat",
            href: "/adatvedelmi-es-adatbiztonsagi-szabalyzat",
          },
        ],
      },
      {
        id: "kapcsolat",
        title: "Kapcsolat és panaszkezelés",
        paragraphs: [
          `Kérdéssel vagy panasszal a ${site.contact.email} címen vagy a ${contactPhoneLabel} telefonszámokon keresheted a szervizt. A részletes panaszkezelési, békéltetési, elállási és javítási jótállási szabályokat a lábléc Fogyasztói tájékoztató oldala ismerteti.`,
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
          { label: "Telefon", value: contactPhoneLabel },
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
          "A frontend Vercelen, a PocketBase az üzemeltető homelabján, Cloudflare Tunnel közvetítésével működik. A szolgáltatók pontos jogi adatait, adatfeldolgozói szerepeit, földrajzi helyét és továbbítási garanciáit az üzemeltetőnek a tényleges telepítés szerint ki kell töltenie. Az opcionális levelezés az üzemeltető által beállított PocketBase-levélklienst és saját vagy választott levelezőkiszolgálót használja; a tényleges szolgáltatót és adatkezelést az üzemeltetőnek meg kell neveznie.",
        ],
      },
    ],
  },
  consumerDocument,
  dataSecurityDocument,
];
