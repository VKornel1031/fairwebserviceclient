/** Szerkeszthető fogyasztói tájékoztató. Az időpontkérés és a javítási szerződés különbözik. */
import type { LegalDocument } from "./legal";
import { legalNavigation, site } from "./site";
const required = (value: string) =>
  value || "Kitöltés szükséges az éles használat előtt";
export const consumerDocument: LegalDocument = {
  ...legalNavigation[4],
  title: "Kérdések, panaszok és fogyasztói jogok.",
  description:
    "Panaszkezelés, békéltetés, javítási jótállás és az elállás feltételes szabályai.",
  sections: [
    {
      id: "alkalmazasi-kor",
      title: "Mire vonatkozik ez a tájékoztató?",
      paragraphs: [
        "A portál a szerviz adatbázisában rögzíti az időpontkérést; a kiválasztott időpontot a szerviz telefonon igazolja vissza. A portál nem köt javítási szerződést és nem fogad fizetést. Az időpont lemondása és egy létrejött szerződéstől való elállás külön jognyilatkozat.",
        "Az alábbi fogyasztói szabályok a tényleges szolgáltatásra a törvényi feltételeik szerint alkalmazandók. A céges felhasználói szerep önmagában nem dönti el valamennyi jog alkalmazhatóságát; a békéltetés külön törvényi személyi körét is vizsgálni kell.",
      ],
    },
    {
      id: "panasz",
      title: "Panasz benyújtása",
      facts: [
        { label: "Vállalkozás", value: site.legal.companyName },
        {
          label: "Levelezési / panaszügyintézési cím",
          value: required(site.legal.complaintsAddress),
        },
        { label: "E-mail", value: site.legal.complaintsEmail },
        { label: "Telefon", value: site.contact.phone },
      ],
      paragraphs: [
        "Panaszodat szóban, e-mailben vagy postai levélben is közölheted a feltüntetett elérhetőségeken. A panaszhoz add meg a kapcsolattartáshoz szükséges adatokat, az érintett szolgáltatást vagy azonosítót és a kifogásod lényegét. A saját szövegű panasz is elfogadható; az alábbi minta használata nem kötelező.",
        "A letölthető dokumentum nem küld be panaszt, és ez a weboldal jelenleg nem biztosít panaszbeküldő űrlapot. A kitöltött nyilatkozatot a vállalkozáshoz kell eljuttatni.",
      ],
      links: [
        {
          label: "Panaszbejelentő minta letöltése (.txt)",
          href: "/dokumentumok/panaszbejelento.txt",
          download: true,
        },
      ],
    },
    {
      id: "panaszkezeles",
      title: "A panasz kivizsgálása",
      paragraphs: [
        "A fogyasztóvédelmi törvény 17/A. § alapján a szóbeli panaszt azonnal meg kell vizsgálni, és szükség szerint orvosolni kell. Ha a fogyasztó nem ért egyet a kezeléssel, vagy az azonnali kivizsgálás nem lehetséges, a vállalkozás jegyzőkönyvet vesz fel, és a jogszabály szerinti módon átadja vagy megküldi annak másolatát.",
        "Az írásbeli panaszt a beérkezését követő 30 napon belül írásban, érdemben, igazolható módon meg kell válaszolni, ha az alkalmazandó szabály eltérő határidőt nem állapít meg. Az elutasítást indokolni kell. A panasz és az érdemi válasz másolatát 3 évig meg kell őrizni.",
        "Elutasításkor a válaszban meg kell adni az ügy jellegének megfelelő hatóság vagy a fogyasztó lakóhelye, tartózkodási helye vagy székhelye szerint illetékes békéltető testület elérhetőségeit, valamint a vállalkozás általános alávetési nyilatkozatára vonatkozó tájékoztatást. Ha később elektronikus panaszűrlap készül, a beérkezést a megadott e-mail-címen haladéktalanul vissza kell igazolni.",
      ],
    },
    {
      id: "bekeltetes",
      title: "Békéltető testület és további jogorvoslat",
      paragraphs: [
        "Fogyasztói jogvita esetén először a vállalkozással szükséges megkísérelni a közvetlen rendezést. A békéltető testületi eljárás díjmentes; az illetékességet és az eljárás személyi feltételeit a hatályos fogyasztóvédelmi törvény alapján kell megállapítani. A vállalkozást az eljárásban együttműködési kötelezettség terheli.",
        "A Fejér, Komárom-Esztergom és Veszprém vármegyei ügyfelek területileg illetékes testületének ellenőrzött elérhetőségei:",
      ],
      facts: [
        { label: "Testület", value: site.legal.conciliation.name },
        { label: "Székhely", value: site.legal.conciliation.address },
        {
          label: "Levelezési cím",
          value: site.legal.conciliation.postalAddress,
        },
        { label: "Telefon", value: site.legal.conciliation.phone },
        { label: "E-mail", value: site.legal.conciliation.email },
        {
          label: "Általános alávetési nyilatkozat",
          value:
            site.legal.conciliationSubmission === "not-confirmed"
              ? "A vállalkozás nyilatkozatát élesítés előtt meg kell adni."
              : site.legal.conciliationSubmission,
        },
      ],
      links: [
        {
          label:
            "A Fejér Vármegyei Békéltető Testület hivatalos kapcsolatoldala",
          href: site.legal.conciliation.website,
        },
        {
          label: "Országos békéltető testületi ügyintézés és illetékesség",
          href: "https://bekeltetes.hu/",
        },
        {
          label: "Fogyasztóvédelmi hatósági tájékoztatás",
          href: "https://nkfh.gov.hu/",
        },
      ],
    },
    {
      id: "elallas",
      title: "Elállás és felmondás – mikor alkalmazható?",
      paragraphs: [
        "A 45/2014. (II. 26.) Korm. rendelet hatálya alá tartozó, üzlethelyiségen kívül vagy távollévők között kötött fogyasztói szolgáltatási szerződésnél főszabály szerint a szerződés megkötésétől számított 14 napos indokolás nélküli elállási jog áll fenn; megkezdett szolgáltatás esetén felmondásról lehet szó. A portál időpontkérése önmagában nem ilyen javítási szerződés.",
        "A jog egyértelmű nyilatkozattal is gyakorolható, nem csak formanyomtatványon. Az erre irányuló nyilatkozatot a vállalkozáshoz kell eljuttatni. A határidőn belüli elküldést a fogyasztónak kell tudnia igazolni. Az elállásra vagy felmondásra vonatkozó kötelező jogokat az ÁSZF nem zárhatja ki általánosan.",
        "Ha a fogyasztó kifejezetten kéri a szolgáltatás megkezdését a határidő lejárta előtt, azt külön kell rögzíteni, és a jogszabály szerinti tájékoztatást is meg kell adni. A teljesítés megkezdése önmagában nem jelenti minden elállási/felmondási jog elvesztését. Teljes teljesítésnél a jog elvesztésének feltételeit, illetve részleges teljesítésnél az arányos díj feltételeit a rendelet 13., 19., 26. és 29. § alapján kell vizsgálni.",
        "Jogos elállás esetén a vállalkozás a jogszabály szerinti összeget főszabály szerint az elállásról való tudomásszerzéstől számított 14 napon belül téríti vissza. A feltételek és kivételek az adott szerződéshez igazítandók; ez a prototípus nem kezel fizetést vagy visszatérítést.",
        "A 2026-ban hatályos szabályok a távollévők közötti szerződésekre online elállási funkciót és tartós adathordozón küldött átvételi elismervényt is előírnak. Ha a portál később ilyen szerződést köt, a letölthető minta önmagában nem elegendő: a 22. § szerinti „elállás a szerződéstől” és „elállás megerősítése” folyamatot ténylegesen meg kell valósítani. Az időpontkérő portál nem valósít meg ilyen szerződéskötési vagy elállási folyamatot.",
      ],
      links: [
        {
          label: "Elállási / felmondási nyilatkozatminta letöltése (.txt)",
          href: "/dokumentumok/elallasi-felmondasi-nyilatkozat.txt",
          download: true,
        },
      ],
    },
    {
      id: "szavatossag",
      title: "Javítási jótállás és szavatosság",
      paragraphs: [
        "A kellékszavatossági és jótállási igények nem azonosak a foglalás lemondásával. Hibás teljesítésnél a Polgári Törvénykönyv és az alkalmazandó különös szabályok szerint érvényesíthetők igények; az ÁSZF a kötelező fogyasztói jogokat nem korlátozhatja.",
        "A 249/2004. (VIII. 27.) Korm. rendelet feltételei esetén a mellékletében felsorolt személygépkocsi- és motorkerékpár-javítási, karbantartási szolgáltatásnál, ha a díj az áfával és anyagköltséggel együtt meghaladja a 20 000 Ft-ot, 6 hónap kötelező jótállás terheli a vállalkozást. A rendelet feltételeit és kivételeit külön ellenőrizni kell; például nem vonatkozik a már szavatossági vagy jótállási igény teljesítéseként elvégzett szolgáltatásra.",
        "Az alkalmazandó esetben a vállalkozás jótállási jegyet bocsát a fogyasztó rendelkezésére, és a javítási igények kezelésénél követi a rendelet nyilvántartási, tájékoztatási és teljesítési szabályait. A 6 hónapos jótállás nem szünteti meg a törvény alapján fennálló egyéb szavatossági jogokat. A tényleges munkalap, számlázás és jótállási dokumentáció nincs megvalósítva ebben a foglalási prototípusban.",
      ],
    },
    {
      id: "jogforrasok",
      title: "Kapcsolódó jogforrások",
      paragraphs: [
        "Az EU korábbi ODR online vitarendezési platformja 2025. július 20-án megszűnt. Ezért nem hivatkozunk rá működő panaszkezelési csatornaként. A békéltetés és az egyéb jogorvoslatok továbbra is a hatályos feltételekkel vehetők igénybe.",
      ],
      links: [
        {
          label: "1997. évi CLV. törvény – fogyasztóvédelem, különösen 17/A. §",
          href: "https://njt.hu/jogszabaly/1997-155-00-00",
        },
        {
          label: "45/2014. (II. 26.) Korm. rendelet – fogyasztói szerződések",
          href: "https://njt.hu/jogszabaly/2014-45-20-22",
        },
        {
          label: "249/2004. (VIII. 27.) Korm. rendelet – javítási jótállás",
          href: "https://njt.hu/jogszabaly/2004-249-20-22",
        },
        {
          label: "2013. évi V. törvény – Polgári Törvénykönyv",
          href: "https://njt.hu/jogszabaly/2013-5-00-00",
        },
        {
          label: "Az Európai Bizottság tájékoztatása az ODR megszűnéséről",
          href: "https://consumer-redress.ec.europa.eu/site-relocation_en",
        },
      ],
    },
  ],
};
