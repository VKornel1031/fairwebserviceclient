/** Adapted from the operator's ADATKEZELÉSI TÁJÉKOZTATÓ.docx.
 * Editable public text; source documents and changes are recorded under docs/legal-sources. */
import type { LegalDocument } from "./legal";
import { site, address, contactPhoneLabel, legalNavigation } from "./site";
const pending = (value: string) =>
  value || "Üzemeltetői véglegesítés szükséges az éles használat előtt.";

export const privacyDocument: LegalDocument = {
  ...legalNavigation[0],
  title: "Az adataidról, érthetően.",
  description:
    "A vendégként kért időpontok, a céges fiókok, a mentett járművek és a szolgáltatási értesítések adatkezelése.",
  download: {
    filename: "adatkezelesi-tajekoztato.txt",
    label: "Adatkezelési Tájékoztató letöltése (.txt)",
  },
  sections: [
    {
      id: "adatkezelo",
      title: "Az adatkezelő és az elérhetőségek",
      facts: [
        { label: "Adatkezelő", value: site.legal.companyName },
        { label: "Székhely", value: site.legal.registeredOffice },
        { label: "Telephely / műhely", value: address },
        { label: "Cégjegyzékszám", value: site.legal.registrationNumber },
        { label: "Adószám", value: site.legal.taxNumber },
        { label: "Képviselő / ügyvezető", value: site.legal.representative },
        {
          label: "Adatkezelési kapcsolattartás",
          value: site.legal.privacyEmail,
        },
        { label: "Telefon", value: contactPhoneLabel },
      ],
    },
    {
      id: "vendegfoglalas",
      title: "Vendégként történő időpontkérés",
      paragraphs: [
        "Magánszemélyek regisztráció nélkül kérhetnek időpontot. Kezelt adatok: teljes név, e-mail-cím, mobiltelefonszám, település, rendszám, gépjárműmárka és -modell, gyártási év, alvázszám (VIN), választott szolgáltatás, kért időpont, megjegyzés és állapot. A kérés azonosítója, az elfogadott feltételverzió és az elfogadás időpontja, valamint a későbbi módosítások előzménye is tárolódik.",
        "Az adatkezelés célja a kérés kezelése, kapcsolatfelvétel, telefonos egyeztetés, visszaigazolás és a kapcsolódó ügyintézés. Természetes személy saját kérésénél a jogalap a GDPR 6. cikk (1) bekezdés b) pontja: az érintett kérésére szerződéskötést megelőző lépések megtétele. Az egyes külön célokhoz, például jogi igények kezeléséhez önálló jogalap és szükséges megőrzés tartozhat.",
        "Az online kérés nem hoz létre javítási megrendelést és nem jelent online fizetést. Műhelykapacitást a munkatárs telefonos visszaigazolása biztosít. A műszaki vizsga időpontját kizárólag telefonon lehet egyeztetni.",
        `A vendég által indított időpontkérés és a hozzá kapcsolódó webes előzmények, illetve értesítési adatmásolatok a befejezés vagy lemondás rögzítését követő ${site.guestRetentionDays} nap elteltével automatikusan törlődnek az aktív webes adatbázisból. A működő rendszer percenként ellenőrzi a lejárt tételeket; üzemszünet után a következő futás folytatja a törlést. A még függő, visszaigazolt vagy folyamatban lévő kéréseket ez az időzített törlés nem érinti.`,
        "A munkatárs által telefonon felvett, vendég-hozzáférési azonosító nélküli ügyfélkérés, valamint a korábban fiókhoz tartozó kérés megőrzését az üzemeltető külön kezeli. A webes törlés nem törli a már kézbesített levelet a címzett postaládájából, a jogszerűen megőrzött külön szerviziratokat vagy a korábbi biztonsági mentéseket.",
      ],
    },
    {
      id: "ceges-fiok",
      title: "Céges ügyfélportál és mentett járművek",
      paragraphs: [
        "Nyilvános regisztrációhoz cégnév és magyar adószám szükséges. A kapcsolattartó neve és e-mail-címe kötelező, telefonszáma, települése és a cég települése a profilban megadható. A rendszer tárolja a fiókazonosítót, szerepkört, aktív vagy letiltott állapotot és az elfogadott feltételek verzióját, időpontját. Az adószám formátumellenőrzése nem igazolja a cég létezését vagy a regisztráló képviseleti jogát.",
        "A mentett gépjármű adatai: rendszám, márka, modell, gyártási év, opcionális VIN, a fiókhoz tartozás és az alapértelmezett jármű kiválasztása. Új időpontkéréshez a VIN kötelező. A céges portál saját járműlistát, időpontokat, rögzített állapotokat és esetleges tételes árbecslést mutat; nem teljes körű munkalap-, számlázási vagy hatósági nyilvántartás, és jelenleg nem biztosít több külön fióknak közös flottát.",
        "A jelszót PocketBase jelszólenyomatként tárolja. A belépési adatok titkosított HTTPS-kapcsolaton jutnak el a webhely kiszolgálóihoz. A böngésző nem kap olvasható hitelesítési tokent, és a valódi fiók- vagy foglalási adatok nem kerülnek a localStorage-ba. Új fióknál a bejelentkezéshez az e-mail-cím megerősítése szükséges. A korábbi fiókok hozzáférése megmarad, de címük ettől nem válik automatikusan igazolttá. Új megerősítő levél és e-mailes jelszó-visszaállítás kérhető; az e-mail-cím módosítása az új címre küldött hivatkozás és a jelenlegi jelszó megadásával véglegesíthető.",
        "A céges kapcsolattartói adatok kezelésének célja a partnerkapcsolat, a fiók és a szervizügyintézés kezelése. Alkalmazandó jogalap lehet az adatkezelő dokumentált jogos érdeke a GDPR 6. cikk (1) bekezdés f) pontja szerint; ennek érdekmérlegelését az üzemeltetőnek kell rögzítenie. Az érintettel közvetlenül fennálló vagy előkészített szerződésnél a b) pont lehet alkalmazandó. Az ÁSZF elfogadása és a tájékoztató megismerése nem általános hozzájárulás minden adatkezeléshez.",
        "A profil és a mentett járművek a felületen módosíthatók; a saját járművek törölhetők. A fiók törlését az adatkezelőnél lehet kérni, a végrehajtást jogosult adminisztrátor végzi. A fiók törlése törli a hozzá tartozó mentett járműveket, de az időpontban külön mentett kapcsolattartási és járműmásolatot nem törli automatikusan. A fiókos időpontokra nem vonatkozik a vendégadatok időzített törlése; ezek megőrzését és a törlési kérelmek teljesítését külön kell rendezni.",
        "Korábbi magánügyfél-fiókok adataik megőrzésével partner szerepkörbe kerültek. Korábbi profilképet a jelenlegi webes felület nem kér és nem jelenít meg; a meglévő kép eltávolítását az üzemeltetőtől lehet kérni.",
      ],
    },
    {
      id: "ertesitesek",
      title: "Szolgáltatási e-mailek",
      paragraphs: [
        "A fiók megerősítéséhez, jelszó-visszaállításhoz és e-mail-cím módosításához egyszer használatos vagy időben korlátozott megerősítő hivatkozást küldünk. A címigazolási link 24 órás, a jelszó-visszaállítási és címváltoztatási link 30 perces. A hivatkozás megnyitása önmagában nem hajt végre módosítást. A link titkos részét a weboldal URL-töredékből olvassa ki és csak a megerősítéskor, titkosított POST-kérésben továbbítja; nem tárolja helyi tárhelyen. Bekapcsolt időpontértesítéseknél a kérés átvételéről, telefonos visszaigazolásról, módosításról, lemondásról, árbecslésről és a munka elkészültéről küldhető értesítés. A levél tartalmazhatja a kapcsolattartó nevét, e-mail-címét, telefonszámát, települését, az időpont és szolgáltatás adatait, a cég nevét, a gépjármű és VIN adatait, a megjegyzést és a rögzített árbecslés tételeit. Ezek ügyintézési üzenetek; a portál nem küld marketinghírlevelet.",
        "A kapcsolattartó és a jogosult aktív munkafelvevői, illetve vezetői fiókok külön levelet kapnak. Az adminisztrátor akkor címzett, ha az üzemeltető a belső értesítési körbe bevonta. Az ügyfél levele nem mutatja a többi címzett címét. A küldési sor címzettenkénti másolatot, próbálkozásszámot és technikai állapotot tárol; a sikeres kiszolgálói átadás nem postaládai kézbesítési igazolás.",
        "Az értesítés az adott időpontkezelési célhoz tartozik, és annak megfelelő jogalapon történik. A Gmail SMTP használata esetén a levelek a Google levelezési szolgáltatásán is áthaladnak. A kézbesített levél és a külső levelezési napló további megőrzése a tényleges szolgáltatás beállításaitól is függ.",
      ],
    },
    {
      id: "szervizdokumentumok",
      title: "Az árhoz mellékelt szervizdokumentumok",
      paragraphs: [
        "A munkafelvevő, tulajdonos/vezető vagy adminisztrátor az időpont árbecsléséhez külön kiállított számlát vagy más szervizdokumentumot tölthet fel. A dokumentum neve, típusa, mérete, feltöltési ideje és az időponthoz rendelése is tárolódik. A dokumentum tartalma az ügyintézéshez, a szolgáltatás egyeztetéséhez és az ahhoz kapcsolódó kötelezettségek teljesítéséhez szükséges adatokat tartalmazhatja; szükségtelen személyes vagy különleges adatot ne tölts fel.",
        "A melléklethez a kapcsolódó időpontot elérő jogosult ügyfél, annak partnerfiókja és az aktív jogosult munkatárs fér hozzá. Vendégként a hozzáférést az adott böngésző érvényes vendégsütije biztosítja. A fájlok nem nyilvános letöltések. Bekapcsolt levelezésnél az árfrissítéshez tartozó dokumentum a kapcsolattartó és a beállított belső címzettek külön értesítéseinek melléklete is lehet; így a dokumentum a levelezési szolgáltatón és a címzett postafiókján is áthalad.",
        "Az új melléklet a portál aktuális árnézetében a korábbit váltja fel. A korábbi árértesítések és az időpont változástörténete a hozzájuk tartozó dokumentumot őrzik, hogy egy késleltetett vagy újrapróbált értesítés a megfelelő változatot küldje. Az időpont törlése a hozzá tartozó dokumentumokat is törli az aktív tárhelyről. A saját vendégkérés lezárását követő automatikus megőrzési szabály a dokumentumokra is kiterjed. A fiókos és munkatárs által rögzített ügyek megőrzését, a jogszabályi bizonylatmegőrzést, a biztonsági mentések és a külső postafiókok törlését a szolgáltató külön kezeli; a portál nem helyettesíti a számviteli archiválást.",
      ],
    },
    {
      id: "adatfeldolgozok",
      title: "Tárolás, hozzáférők és külső szolgáltatók",
      paragraphs: [
        `A központi PocketBase-adatbázist a társaság saját szerverén üzemelteti. A megadott telepítési hely: ${site.legal.registeredOffice} Az üzemeltetésért az adatkezelő, technikai közreműködéséért a belső IT-felelős felel.`,
        "A céges partner a saját fiókjához tartozó járművekhez és időpontokhoz fér hozzá. A munkafelvevő, vezető és adminisztrátor a feladatához szükséges időpontadatokat kezeli. Az adminisztrátor más fiókokat és a mentett járműveket is kezelheti. Szerelői vagy külön műhelyszerepkör nincs a webportálon.",
        "Vercel Inc.: a webes felület és a szerveroldali alkalmazás kiszolgálása. A fiók- és foglalási kérések az alkalmazás szerverén is áthaladnak, ezért a szolgáltatás nem kizárólag statikus fájlok tárhelye. A Vercel által közzétett kapcsolattartási cím: 440 N Barranca Avenue #4133, Covina, CA 91723, USA; privacy@vercel.com.",
        "Cloudflare, Inc.: hálózati közvetítés, Cloudflare Tunnel, forgalomvédelem és az üzemeltető által beállított védelmi funkciók. Az átmenő kérések és technikai naplók a szolgáltatás beállításai szerint kezelhetők. A dokumentumban megadott cím: 101 Townsend St, San Francisco, CA 94107, USA.",
        "Google Gmail / Google Workspace: a beállított SMTP-levélküldés szolgáltatója. Az alkalmazandó szerződő fél, a postafiók típusa, megőrzése és adattovábbítási feltételei a ténylegesen használt fióktól függenek; ezeket az adatkezelőnek kell véglegesítenie.",
        "A szolgáltatók földrajzi régióját, szerződéses adatfeldolgozói szerepét és az esetleges EGT-n kívüli adattovábbítás GDPR V. fejezet szerinti jogalapját, garanciáit az üzemeltetőnek a tényleges fiókok és szerződések alapján kell dokumentálnia. A székhely feltüntetése önmagában nem igazolja az adattárolás helyét vagy a továbbítás jogszerűségét.",
        "A betűkészleteket a webhely helyben szolgálja ki; Google Fonts-kérés nem történik. Automatikus profilalkotás, kizárólag automatizált joghatású döntés, beépített analitika és hirdetési követés nincs.",
      ],
      links: [
        {
          label: "Vercel adatvédelmi tájékoztató",
          href: "https://vercel.com/legal/privacy-policy",
        },
        {
          label: "Cloudflare adatvédelmi tájékoztató",
          href: "https://www.cloudflare.com/privacypolicy/",
        },
        {
          label: "Google adatvédelmi tájékoztató",
          href: "https://policies.google.com/privacy?hl=hu",
        },
      ],
    },
    {
      id: "megorzes",
      title: "Megőrzés, törlés és biztonsági mentések",
      paragraphs: [
        "A vendégkérés időzített törlése az aktív webes adatbázisra, a hozzá tartozó állapotelőzményekre és értesítési sorokra vonatkozik. A korábban lezárt, hiteles lezárási előzmény nélküli vendégkérésnél a törlési határidő bevezetésétől számított türelmi időt alkalmazunk; nem következtetünk a lezárásra a létrehozás dátumából.",
        "A hozzáférési süti lejárata és az adatok megőrzése különböző fogalom. A munkamenetsüti legfeljebb 8 órás; a vendég hozzáférési sütije legfeljebb 120 napos, a foglaló használata megújíthatja. A lezárt vendégkérés adatai ettől függetlenül a rövidebb törlési szabály szerint szűnnek meg.",
        "A biztonsági mentésekben az adatok a mentési rotáció végéig szerepelhetnek. A mentések hozzáférését, megőrzését és visszaállításkor az időközben esedékessé vált törlések ismételt végrehajtását az üzemeltetőnek kell biztosítania. A fiókos kérések, függő ügyek, naplók és mentések pontos megőrzési idejét az alábbi adatmezőben kell véglegesíteni.",
        "A külön szervizprogramban, számlázásban és hatósági vizsgáztatásban keletkező iratok nem azonosak a webes időpontkéréssel. A jogszabály alapján megőrzendő számviteli bizonylatokra, illetve vizsgairatokra a rájuk irányadó szabályok vonatkoznak; ez nem ad általános jogalapot minden portáladat korlátlan tárolására.",
      ],
      facts: [
        {
          label: "További megőrzési idők",
          value: pending(site.legal.productionRetention),
        },
        {
          label: "Véglegesített jogalapok és szolgáltatói feltételek",
          value: pending(site.legal.productionDataProcessing),
        },
      ],
    },
    {
      id: "sutik",
      title: "Sütik és helyi beállítások",
      paragraphs: [
        "A bejelentkezéshez és a kért vendégfoglalási funkcióhoz szükséges, HttpOnly hozzáférési sütiket használunk. A világos vagy sötét téma a felhasználó választása után helyi tárhelyen marad meg. Opcionális analitikai vagy marketingkövetést a portál nem használ; ilyen célú hozzájárulást jelenleg nem kér.",
        "A szükséges funkcionális tárolásra nem kérünk általános elfogadó hozzájárulást. A Cloudflare által ténylegesen alkalmazott biztonsági sütik célját és időtartamát az üzemeltetőnek a bekapcsolt szolgáltatások alapján kell nyilvántartania. Új, hozzájárulást igénylő követés csak annak külön kezelése után vezethető be.",
      ],
      links: [
        {
          label: "Részletes süti- és tárhelytájékoztató",
          href: "/suti-tajekoztato",
        },
      ],
    },
    {
      id: "jogok",
      title: "Az érintettek jogai és kérelmeik",
      paragraphs: [
        `Kérelmet a ${site.legal.privacyEmail} címen vagy a székhelyre küldött levélben lehet benyújtani. Az alkalmazandó feltételek szerint hozzáférést, helyesbítést, törlést és korlátozást kérhetsz; megfelelő esetben adathordozhatósági jogod van. Jogos érdeken alapuló adatkezelés ellen tiltakozhatsz. Hozzájáruláson alapuló kezelésnél a hozzájárulást a jövőre nézve visszavonhatod.`,
        "A kérelmeket indokolatlan késedelem nélkül, főszabály szerint egy hónapon belül kell megválaszolni. A GDPR feltételeivel legfeljebb további két hónap hosszabbítás lehetséges; az okokról és a hosszabbításról az első hónapon belül tájékoztatást kell adni. Csak indokolt és szükséges azonosítási adat kérhető. A törlés jogszabályi megőrzés vagy más alkalmazandó kivétel miatt korlátozható, erről az adatkezelő tájékoztatást ad.",
        "A saját profiladatok és járművek a felületen kezelhetők. Fióktörléshez és a már külön rögzített időpontmásolatok törléséhez az adatkezelő segítsége szükséges; a fiókhoz tartozó kapcsolat megszüntetése önmagában nem jelenti minden másolat anonimizálását.",
      ],
    },
    {
      id: "jogorvoslat",
      title: "Jogorvoslati lehetőségek",
      facts: [
        {
          label: "Felügyeleti hatóság",
          value: "Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)",
        },
        { label: "Cím", value: "1055 Budapest, Falk Miksa utca 9–11." },
        { label: "Levelezési cím", value: "1363 Budapest, Pf. 9." },
        { label: "E-mail", value: "ugyfelszolgalat@naih.hu" },
      ],
      paragraphs: [
        "Panaszt tehetsz a felügyeleti hatóságnál, és a GDPR szerint bírósági jogorvoslattal is élhetsz, többek között a szokásos tartózkodási helyed szerinti tagállam illetékes bírósága előtt.",
      ],
      links: [
        {
          label: "NAIH – hivatalos ügyfélszolgálat",
          href: "https://naih.hu/ugyfelszolgalat-kapcsolat",
        },
        {
          label: "GDPR – az (EU) 2016/679 rendelet",
          href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
        },
      ],
    },
  ],
};
