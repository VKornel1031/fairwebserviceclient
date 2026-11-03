/** A jogi oldalak szerkeszthető szövege. A PocketBase-fiókokat, járműveket és időpontkéréseket írja le.
 * Levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
import { address, site, legalNavigation, contactPhoneLabel } from "./site";
import { termsDocument } from "./terms";
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
  termsDocument,
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
