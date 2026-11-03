/** A jogi oldalak szerkeszthető szövege. A PocketBase-fiókokat, járműveket és időpontkéréseket írja le.
 * Levelezés vagy analitika bekötésekor a tényleges adatfolyamokkal együtt frissítsd. */
import { address, site, legalNavigation, contactPhoneLabel } from "./site";
import { termsDocument } from "./terms";
import { cookieDocument } from "./cookies";
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
  cookieDocument,
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
