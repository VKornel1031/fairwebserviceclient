import { address, contactPhoneLabel, site } from "./site";
import type { LegalDocument } from "./legal";

export const termsDocument: LegalDocument = {
  slug: "aszf",
  label: "ÁSZF",
  title: "Az ügyfélportál és az időpontkérés feltételei",
  description:
    "Általános szerződési feltételek a Fair Autószerviz ügyfélportáljának használatához és a szervizidőpontok egyeztetéséhez.",
  download: { filename: "aszf.txt", label: "ÁSZF letöltése szöveges fájlként" },
  sections: [
    {
      id: "szolgaltato",
      title: "A szolgáltató és elérhetőségei",
      facts: [
        { label: "Cégnév", value: site.legal.companyName },
        { label: "Székhely", value: site.legal.registeredOffice },
        { label: "Cégjegyzékszám", value: site.legal.registrationNumber },
        { label: "Adószám", value: site.legal.taxNumber },
        { label: "Képviselő", value: site.legal.representative },
        { label: "Műhely és panaszkezelési cím", value: address },
        { label: "Telefon", value: contactPhoneLabel },
        { label: "E-mail", value: site.contact.email },
      ],
    },
    {
      id: "hataly",
      title: "Hatály és a portál rendeltetése",
      paragraphs: [
        "Jelen ÁSZF a szolgáltató ügyfélportáljának használatára, a céges partnerfiókokra és az online szervizidőpont-kérések kezelésére vonatkozik. A portál használata és az időpontkérés díjmentes. A portál magyar nyelvű; céges partnerek és fiók nélküli ügyfelek is kérhetnek időpontot.",
        "Az időpontkérés elküldése, a fiók létrehozása és az időpont telefonos visszaigazolása önmagában nem jelent javítási megrendelést vagy a javítási árajánlat elfogadását. A javítás műszaki tartalmáról, megrendeléséről, feltételeiről és végleges díjáról a műhellyel külön kell megállapodni. Online fizetés és a javítás online megrendelése a portálon nincs.",
        "Az ÁSZF a vállalkozások és a fogyasztók portálhasználatára egyaránt vonatkozik. A fogyasztót megillető kötelező törvényi jogokat e feltételek nem korlátozzák. A javításra vonatkozó külön megállapodás és a kötelező jogszabályok elsőbbséget élveznek a javítás teljesítési feltételeiben.",
      ],
    },
    {
      id: "fiok",
      title: "Partnerfiók és biztonság",
      paragraphs: [
        "Nyilvános regisztrációkor valós cégnév, magyar adószám, kapcsolattartói név, e-mail-cím és jelszó szükséges. A regisztráló felel azért, hogy jogosult a cég nevében eljárni és megadni az érintett adatokat. A partnerfiók a hozzá tartozó járműpark és saját időpontok kezelését biztosítja; más partner adataihoz nem ad hozzáférést.",
        "Az új fiók e-mail-címét a megerősítő levél hivatkozásával igazolni kell. Munkafelvevői, tulajdonosi/vezetői és adminisztrátori jogosultságot csak adminisztrátor oszthat ki. A korábban létrehozott fiókok a beállított jogosultságukkal használhatók.",
        "A felhasználó köteles kapcsolattartási és céges adatait naprakészen tartani, jelszavát bizalmasan kezelni és az észlelt jogosulatlan hozzáférést haladéktalanul jelezni a szerviznek. A közös vagy nyilvános eszközön a használat után ki kell jelentkezni. Más fiókjával visszaélni, adatokat jogosulatlanul elérni és a működést akadályozni tilos. A szolgáltató a veszélyeztetett vagy visszaélésre használt fiók hozzáférését korlátozhatja.",
      ],
    },
    {
      id: "idopontkeres",
      title: "Az időpontkérés és a visszaigazolás menete",
      items: [
        `Műszaki vizsgára kizárólag telefonon, a ${contactPhoneLabel} telefonszámokon egyeztethető időpont. Más, online foglalhatóként jelzett szolgáltatásnál válaszd ki a szolgáltatást, az elérhető napot és érkezési időt.`,
        "Add meg a kapcsolattartási és járműadatokat, szükség esetén a szervizigény leírását. Saját fiókban mentett jármű is kiválasztható. Csak a szervizeléshez szükséges, pontos adatokat add meg.",
        "Elküldés előtt az összesítésben ellenőrizheted és a korábbi lépésekre visszatérve javíthatod az adatokat. Az elküldéshez meg kell ismerned és el kell fogadnod az ÁSZF-et; az adatkezelésről külön tájékoztató olvasható.",
        "A sikeres rögzítést a portál azonosítóval és összesítéssel jelzi. A kérés ekkor telefonos egyeztetésre vár. A kért időpontot a szerviz telefonos visszaigazolása biztosítja; az automatikus átvételi értesítés nem jelent telefonos visszaigazolást vagy javítási megrendelést.",
        "A megjelenő érkezési idő és becsült időtartam a szervezést segíti; nem garantálja a javítás befejezésének pontos idejét. A szükséges diagnosztika, alkatrészellátás és egyeztetett munkák befolyásolhatják a teljesítést.",
      ],
    },
    {
      id: "arak",
      title: "Árbecslés, dokumentumok és fizetés",
      paragraphs: [
        "Telefonos visszaigazolás után a munkafelvevő, tulajdonos/vezető vagy adminisztrátor egy összegben vagy tételesen bruttó, forintban megadott árbecslést rögzíthet. A tételes bontás alkatrészt, munkadíjat és egyéb egyeztetett tételeket tartalmazhat. Az ügyfél a saját időpont részleteiben látja az árat és annak frissítési idejét.",
        "A portálon rögzített árbecslés önmagában nem számla, nem elfogadott javítási ajánlat és nem hoz létre fizetési kötelezettséget. A munka tartalmát, végleges díját, a felmerülő többletmunkát, a fizetés módját és határidejét külön kell egyeztetni. A portál nem végez számlakiállítást vagy fizetésfeldolgozást.",
        "A szerviz az árhoz külön kiállított számlát vagy más szervizdokumentumot mellékelhet PDF, JPG vagy PNG formátumban, legfeljebb 3 MB méretben. A melléklet a jogosult felhasználóknak a portálon letölthető, és bekapcsolt értesítéseknél az árfrissítés e-mailjéhez csatolva is megérkezik a megadott kapcsolattartási címre. A dokumentum tartalmáért a feltöltő szolgáltató felel; a feltöltés nem változtatja meg az árbecslés jogi jellegét.",
        "Árhoz kapcsolódó új melléklet feltöltése vagy eltávolítása módosítja az időpont részleteit. A korábbi árértesítés a hozzá tartozó dokumentumváltozatot tartalmazza. Az új dokumentum nem vonja vissza és nem módosítja automatikusan a korábban kiállított számlát; hibás bizonylat esetén keresd a szervizt.",
      ],
    },
    {
      id: "modositas",
      title: "Módosítás és lemondás",
      paragraphs: [
        "A jövőbeni, telefonos egyeztetésre váró vagy visszaigazolt időpontkérés a Foglalásaim oldalon átütemezhető vagy lemondható. Átütemezés után új telefonos visszaigazolás szükséges, a korábbi kapacitás felszabadul és a korábbi árbecslés érvényét veszti. Folyamatban lévő vagy elkészült munka online már nem mondható le; ilyenkor telefonon egyeztess a szervizzel.",
        "Az online időpontkérés módosításáért és lemondásáért a portál nem számít fel díjat. Ha külön javítási megrendelést kötöttetek, annak módosítási és megszüntetési feltételei az adott megállapodástól és a kötelező jogszabályoktól függnek. Az időpont lemondása nem szüntet meg automatikusan külön megrendelt és már teljesített munkát vagy más fennálló kötelezettséget.",
        "Ha nem tudsz megjelenni, kérjük, mielőbb jelezd. Eltérő egyeztetés, hibás adat vagy a felületen már nem végezhető módosítás esetén telefonon keresd a szervizt.",
      ],
    },
    {
      id: "ertesitesek",
      title: "Hozzáférés és e-mail-értesítések",
      paragraphs: [
        "A saját fiókhoz tartozó időpontok bejelentkezés után érhetők el. Vendégként a hozzáférést az időpontkéréshez használt böngészőben tárolt szükséges süti biztosítja. A süti törlése, lejárata vagy másik eszköz használata esetén telefonon kérj segítséget; önmagában a foglalási azonosító ismerete nem biztosít hozzáférést.",
        "A bekapcsolt szolgáltatási értesítések a kérésről, telefonos visszaigazolásról, átütemezésről, lemondásról, árfrissítésről és elkészült munkáról a megadott e-mail-címre mennek. Céges ügyfél esetén is az időpont kapcsolattartási e-mail-címe a címzett. Ellenőrizd ennek helyességét és a levélszemét mappát. A webes mentés sikere és a levelezőszervernek történő átadás nem igazolja a postaládai kézbesítést; elmaradt értesítés esetén a portálon vagy telefonon tájékozódj.",
        "Az e-mailben kapott dokumentumot a címzett saját postafiókja is tárolhatja. Ne továbbíts más személy adatait vagy bizalmas dokumentumot illetéktelennek. A portál adatkezelésének részleteit az Adatkezelési Tájékoztató tartalmazza.",
      ],
    },
    {
      id: "elerhetoseg",
      title: "Működés és felelősség",
      paragraphs: [
        "A szolgáltató törekszik a portál biztonságos és folyamatos működésére. Karbantartás, hálózati hiba vagy más technikai akadály esetén az online ügyintézés átmenetileg szünetelhet. Ha az elküldésről nem kapsz sikeres visszajelzést, ellenőrizd a Foglalásaim oldalt vagy telefonon érdeklődj, mielőtt új kérést küldesz.",
        "A felhasználó felel az általa megadott adatok és az eljárási jogosultsága helyességéért. A szolgáltató felelősségére a vonatkozó jogszabályok irányadók. E feltételek nem zárják ki a szándékos károkozásért vagy az életet, testi épséget, egészséget károsító szerződésszegésért fennálló felelősséget, és nem korlátozzák a fogyasztó kötelező jogait.",
      ],
    },
    {
      id: "panasz",
      title: "Panaszkezelés és jogviták",
      paragraphs: [
        `Kérdésedet vagy panaszodat a ${site.legal.complaintsEmail} e-mail-címen, a ${site.legal.complaintsAddress} címen vagy telefonon jelezheted. Írásbeli panaszodra a jogszabály szerinti, főszabály szerint 30 napon belül indokolt választ adunk. A panaszkezelés és a fogyasztói jogok részletes tájékoztatója külön oldalon érhető el.`,
        `Fogyasztói jogvita esetén békéltető testülethez fordulhatsz. A szerviz elérhetőségeihez kapcsolódó testület: ${site.legal.conciliation.name}, ${site.legal.conciliation.address}; e-mail: ${site.legal.conciliation.email}. A fogyasztó lakóhelye vagy tartózkodási helye szerinti illetékes testület és a bírósági jogérvényesítés lehetősége is rendelkezésre áll a hatályos szabályok szerint. A vállalkozást a békéltető testületi eljárásban jogszabály szerinti együttműködési kötelezettség terheli.`,
        "Az ÁSZF-re a magyar jog irányadó. A fogyasztó kötelező jogszabályon alapuló jogait és jogorvoslati lehetőségeit az ÁSZF nem vonja el.",
      ],
      links: [
        {
          label: "Fogyasztói tájékoztató és panaszbejelentő nyomtatvány",
          href: "/fogyasztoi-tajekoztato",
        },
        {
          label: "Fejér Vármegyei Békéltető Testület",
          href: site.legal.conciliation.website,
        },
      ],
    },
    {
      id: "valtozat",
      title: "Megismerés, elfogadás és változatok",
      paragraphs: [
        `Az ÁSZF az oldalról letölthető és a böngészőből kinyomtatható. E változat azonosítója: ${site.legal.version}; frissítésének napja: ${site.legal.updatedAt}. A regisztráció és az időpontkérés során a szerver az elfogadott változat azonosítóját és az elfogadás idejét rögzíti.`,
        "A feltételek változása esetén az új szöveg és változata a portálon jelenik meg. Az új időpontkérésre az elküldéskor megismert és elfogadott feltételek irányadók; a frissítés nem írja át visszamenőleg a korábbi elfogadásokat vagy külön javítási megállapodásokat. Az időpontkérés nyilvántartása nem jelent a portálon létrehozott és iktatott írásbeli javítási szerződést.",
      ],
      links: [
        {
          label: "Adatkezelési Tájékoztató",
          href: "/adatkezelesi-tajekoztato",
        },
        { label: "Süti- és tárhelytájékoztató", href: "/suti-tajekoztato" },
        { label: "Impresszum", href: "/impresszum" },
      ],
    },
  ],
};
