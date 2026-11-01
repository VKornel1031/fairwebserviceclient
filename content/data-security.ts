/** Adapted from the supplied internal policy; operational duties are not claims of completed infrastructure work. */
import type { LegalDocument } from "./legal";
import { site, legalNavigation } from "./site";

export const dataSecurityDocument: LegalDocument = {
  ...legalNavigation[5],
  title: "Az adatok védelmének rendje.",
  description:
    "A társaság adatkezelési, hozzáférési és incidenskezelési szabályainak nyilvános változata.",
  download: {
    filename: "adatvedelmi-es-adatbiztonsagi-szabalyzat.txt",
    label: "Adatvédelmi és adatbiztonsági szabályzat letöltése (.txt)",
  },
  sections: [
    {
      id: "hataly",
      title: "Cél, hatály és felelősök",
      facts: [
        { label: "Kiadó", value: site.legal.companyName },
        { label: "Székhely", value: site.legal.registeredOffice },
        { label: "Ügyvezető", value: site.legal.representative },
        { label: "Belső IT-felelős", value: site.legal.itContact },
        { label: "Kapcsolattartás", value: site.legal.privacyEmail },
      ],
      paragraphs: [
        "A szabályzat a társaság vezetőire, munkatársaira és megbízott technikai közreműködőire vonatkozik. Célja a személyes adatok jogszerű kezelése, a szükséges hozzáférések korlátozása és a GDPR, illetve az Infotv. szerinti adatbiztonsági feladatok rögzítése. Ez a nyilvános leírás nem helyettesíti az érintetteknek szóló adatkezelési tájékoztatót.",
        "Az alábbi üzemeltetési előírásokat az adatkezelőnek ténylegesen végre kell hajtania és ellenőriznie. A dokumentum közzététele önmagában nem igazolja például a fizikai szervervédelem, a mentési rend vagy egy külső szolgáltatói szerződés teljesülését.",
      ],
    },
    {
      id: "jogosultsagok",
      title: "Ki mihez férhet hozzá?",
      items: [
        "Céges partner: a saját fiókadatait, mentett járműveit és időpontjait kezeli. Új nyilvános regisztráció automatikusan csak ezt a szerepet kapja. Az e-mail-cím igazolása nem ad munkatársi jogosultságot.",
        "Munkafelvevő: a beérkezett kéréseket és szükséges kapcsolattartási, jármű- és időpontadatokat kezeli, telefonos egyeztetést rögzít, visszaigazol, módosít, lemond és jogosult árbecslést megadni.",
        "Vezető: az időpontkezelés mellett a munkák állapotát, műhelykapacitást és összesített kimutatásokat kezeli. Fiókkezelési adminjogot a vezetői szerep önmagában nem ad.",
        "Adminisztrátor: a fiókok, szerepkörök, aktiválás, mentett járművek és üzemi műveletek kezelését végzi. A munkafelvevői, vezetői és adminisztrátori szerepet kizárólag adminisztrátor oszthatja ki; nyilvános regisztráció vagy e-mail-megerősítés nem adhatja meg.",
        "A technikai IT-hozzáférés kizárólag a rábízott üzemeltetési és dokumentált hibaelhárítási feladatra használható. Ügyféladat üzleti módosítása az adatkezelő felhatalmazásával történhet.",
        "A szerelők, diagnoszták és vizsgabiztosok nem kapnak külön webes szerelői vagy műhelyfiókot. A szükséges munkalapadatok átadását és a telephelyi rendszerekhez való hozzáférést az adatkezelő külön szabályozza.",
      ],
    },
    {
      id: "alkalmazasvedelem",
      title: "Az alkalmazás adatvédelmi megoldásai",
      paragraphs: [
        "A fiók- és adatkezelő végpontok a szerveren és a PocketBase-ben ellenőrzik a jogosultságot. Az ügyfél böngészőjében állított szerep nem ad hozzáférést. A publikus regisztrációhoz cégnév és adószám kell; új fióknál az e-mail-cím megerősítése szükséges. A korábbi fiókok hozzáférését az átállás megőrzi, ez nem jelenti korábbi címük automatikus igazolását.",
        "A jelszavak jelszólenyomatként tárolódnak. Az éles webes kapcsolat HTTPS-t használ; a munkamenet- és vendég-hozzáférési sütik HttpOnly, Secure és SameSite=Lax beállításúak. Valódi fiók- és időpontadatot az alkalmazás nem tárol a böngésző localStorage-jában.",
        "Az időpontokhoz és értesítési sorokhoz tartozó közvetlen rekordírás nem nyilvános. A mentés, telefonos megerősítés és árképzés szerveroldali ellenőrzésen keresztül történik. A jogosult munkatársaknak szükséges adatokat tartalmazó e-mailek külön címzettenként készülnek, ügyfelek nem látják más címzettek címét.",
        "A küldési sor és a biztonsági naplók hozzáférését korlátozni kell. Jelszó, hitelesítési token és levéltörzs nem kerülhet nyilvános diagnosztikába. A Cloudflare- és PocketBase-védelmeket az üzemeltetőnek a tényleges telepítésen kell beállítania.",
      ],
    },
    {
      id: "uzemeltetes",
      title: "Fizikai védelem, mentések és karbantartás",
      items: [
        "A saját szervert illetéktelen hozzáféréstől védett, megfelelő környezeti feltételeket biztosító helyen kell üzemeltetni. A papíralapú számlák, munkalapok és vizsgairatok hozzáférését is a munkakörhöz kell kötni.",
        "A rendszergazda előírt feladata rendszeres, legalább heti, titkosított és elkülönített biztonsági mentés készítése, a megőrzési rotáció dokumentálása és a visszaállítás kipróbálása. A mentések és frissítések sikerét külön ellenőrizni kell.",
        "Minden munkatárs egyedi hozzáférést használjon. A jogosultságot belépéskor, munkakörváltáskor és kilépéskor felül kell vizsgálni; a már nem szükséges hozzáférést meg kell szüntetni. A technikai és üzleti adminisztrációra csak az arra felhatalmazott személy jogosult.",
        "A függőségek, PocketBase és a szerver frissítéseit, a hozzáférési szabályokat, naplómegőrzést és külső védelmeket az üzemeltető tartja karban. A mentés nem helyettesíti az aktív rendszer adatmegőrzési és törlési rendjét.",
      ],
    },
    {
      id: "torles",
      title: "Automatikus vendégadat-törlés",
      paragraphs: [
        `A vendég által indított, befejezett vagy lemondott kérés aktív webes adatait a lezárástól számított ${site.guestRetentionDays} nap elteltével időzített feladat törli. A kapcsolódó állapotelőzmények és címzettenkénti értesítési másolatok is törlődnek. A függő, visszaigazolt és folyamatban lévő kéréseket, fiókos kéréseket, illetve a munkatárs által külön felvett ügyeket a vendégtörlés nem érinti.`,
        "A határidő alapja a befejezés vagy lemondás rögzített ideje; későbbi ármódosítás nem indítja újra. Régi, lezárási előzmény nélküli vendégadatnál a bevezetéstől számított türelmi idő alkalmazandó. Üzemszünet után az időzített feldolgozás folytatódik.",
        "Az éppen átadás alatt álló e-mail rövid idejű feldolgozási zárolása alatt a törlés későbbi futásra maradhat. A külső postaládák és biztonsági mentések törlését ez a feladat nem végzi; azokhoz külön megőrzési és helyreállítási eljárás szükséges.",
      ],
    },
    {
      id: "vizsgairatok",
      title: "Szerviziratok és műszaki vizsgáztatás",
      paragraphs: [
        "Az időpontkérő portál nem számlázóprogram és nem a hatósági vizsgadokumentáció teljes archívuma. A műszaki vizsga időpontja telefonon egyeztethető; a vizsgáztatás és honosítás szakmai folyamatát a vizsgabázis alkalmazandó technológiai eljárásrendje szabályozza.",
        "A számviteli bizonylatokra a számviteli törvény szerinti, jellemzően nyolcéves megőrzés vonatkozik. A hatósági vizsgairatok konkrét megőrzési idejét a vonatkozó szakmai jogszabály és engedély alapján kell meghatározni; az eredeti dokumentumban szereplő ötéves időtartam alkalmazhatóságát az üzemeltetőnek kell ellenőriznie. Ebből nem következik minden webes ügyféladat azonos idejű megőrzése.",
        "A szakmai eljárásrend és az adatvédelmi szabályzat rendszeres felülvizsgálata az üzemeltető feladata, különösen jogszabály-, technológia- vagy szolgáltatóváltáskor. A vizsgabázis auditkötelezettségét annak tényleges engedélyezési rendje alapján kell teljesíteni.",
      ],
    },
    {
      id: "incidens",
      title: "Eljárás adatvédelmi incidens esetén",
      items: [
        `Az észlelő munkatárs indokolatlan késedelem nélkül értesíti ${site.legal.itContact} IT-felelőst és ${site.legal.representative} ügyvezetőt.`,
        "Az illetékes közreműködők megállítják a jogosulatlan hozzáférést, szükség szerint elkülönítik az érintett rendszert, megőrzik a vizsgálathoz szükséges bizonyítékokat és felmérik az érintett adatok, személyek, körülmények és kockázatok körét.",
        "Az adatkezelő minden adatvédelmi incidenst dokumentál, a tényekkel, hatásokkal és megtett intézkedésekkel együtt.",
        "A felügyeleti hatóságot indokolatlan késedelem nélkül, lehetőség szerint legkésőbb a tudomásszerzéstől számított 72 órán belül értesíteni kell, kivéve, ha az incidens valószínűsíthetően nem jár kockázattal a természetes személyek jogaira és szabadságaira nézve. Késedelmes bejelentésnél az okot is közölni kell; a bejelentés szükség esetén a GDPR feltételei szerint szakaszosan kiegészíthető.",
        "Valószínűsíthetően magas kockázatnál az érintetteket is indokolatlan késedelem nélkül, közérthetően tájékoztatni kell, az alkalmazandó kivételek figyelembevételével. Az alkalmazás nem végez automatikus hatósági bejelentést.",
      ],
      links: [
        {
          label: "GDPR 33–34. cikk – incidensek bejelentése",
          href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
        },
      ],
    },
    {
      id: "kerelmek",
      title: "Érintetti kérelmek és anonimizálás",
      paragraphs: [
        `A kérelmeket a ${site.legal.privacyEmail} címen fogadjuk. Belső ügyintézési cél a 15 napon belüli érdemi feldolgozás; a GDPR szerinti válaszadási határidő főszabály szerint egy hónap, a jogszerű hosszabbítás feltételeivel. A kérelemről és teljesítéséről az adatkezelő nyilvántartást vezet.`,
        "A törlési kérelmet azonosítás és az alkalmazandó megőrzési kötelezettségek vizsgálata után kell teljesíteni. A saját jármű a felületen törölhető; a fiók és külön időpontmásolatainak törlését jogosult adminisztrátor intézi. A kapcsolattartó törlése után megmaradó rendszám, VIN, szabad szöveg vagy más kapcsolat továbbra is lehet személyes adat; a kapcsolat megszüntetése önmagában nem bizonyít anonimizálást.",
        "Jogszerűen kötelező megőrzés esetén a törlés korlátozásáról és annak indokáról tájékoztatni kell az érintettet. Statisztikai célra csak ténylegesen anonimizált vagy megfelelő más jogalappal kezelt adat használható.",
      ],
      links: [
        {
          label: "Adatkezelési Tájékoztató",
          href: "/adatkezelesi-tajekoztato",
        },
      ],
    },
  ],
};
