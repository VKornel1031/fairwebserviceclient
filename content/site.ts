import bookingConfiguration from "./booking.json" with { type: "json" };
/** Nyilvános alapadatok. Itt szerkeszd a márkát és az elérhetőségeket; a foglalás szabályai a booking.json fájlban vannak.
 * Titkos kulcsot, jelszót vagy PocketBase-superuser tokent soha ne írj ebbe a fájlba. */
export const site = {
  name: "Fair Autószerviz Fehérvár",
  shortName: "Fair Autószerviz",
  city: "Székesfehérvár",
  logo: "/images/fair-logo.png",
  mainWebsite: "https://fairautoweb.vercel.app/",
  contact: {
    phone: bookingConfiguration.phoneContacts[0].label,
    phoneHref: bookingConfiguration.phoneContacts[0].href,
    email: "kborsos@fairauto.eu",
    postalCode: "8000",
    street: "Balatoni út 8.",
  },
  // A nyitvatartási feliratokat is igazítsd a foglalási értékekhez.
  hours: { short: "H–P 06:00–17:00", long: "Hétfő–péntek · 06:00–17:00" },
  booking: bookingConfiguration.schedule,
  guestRetentionDays: bookingConfiguration.guestRetentionDays,
  legal: {
    updatedAt: "2026-11-01",
    version: bookingConfiguration.termsVersion,
    // A jelenlegi folyamat időpontkérés; online javítási szerződést/fizetést nem valósít meg.
    bookingModel: "appointment-request",
    // Maradjon true a tényleges működéshez igazítás és ellenőrzés befejezéséig.
    isDraft: true,
    companyName: "Fair Autószerviz Fehérvár Kft.",
    // Ezeket a saját hiteles cégadataid alapján töltsd ki; a műhely címe nem feltétlenül székhely.
    registeredOffice: "8105 Pétfürdő, Fazekas M. utca 8/b.",
    registrationNumber: "19-09-520902",
    taxNumber: "27277777-2-19",
    registryAuthority: "",
    representative: "Vida Zoltán",
    itContact: "Vida Kornél",
    hostingProvider: "Vercel Inc.",
    hostingAddress: "440 N Barranca Avenue #4133, Covina, CA 91723, USA",
    hostingEmail: "privacy@vercel.com",
    complaintsAddress: "8000 Székesfehérvár, Balatoni út 8.",
    complaintsEmail: "kborsos@fairauto.eu",
    conciliationSubmission: "not-confirmed",
    regulatedServiceDisclosure: "",
    codeOfConduct: "",
    pricingDisclosure:
      "Az időpontkérés nem hoz létre javítási megrendelést. Telefonos visszaigazolás után a szerviz egy összegben vagy tételesen bruttó, forintban megadott árbecslést rögzíthet; ez nem számla vagy automatikusan elfogadott ajánlat. A munka tartalmát és a végleges díjat külön kell egyeztetni. Online fizetés nincs.",
    // Szolgáltatónkénti adatkezelési célok, jogalapok, megőrzés és továbbítás élesítéskor.
    productionDataProcessing: "",
    productionRetention: "",
    reviews: {
      companyDetails: false,
      businessModelAndTerms: false,
      privacyAndProcessors: false,
      accessibilityScope: false,
    },
    // Ellenőrizve a testület saját kapcsolatoldalán: 2026-10-30.
    conciliation: {
      name: "Fejér Vármegyei Békéltető Testület",
      address: "8000 Székesfehérvár, Hosszúsétatér 4–6.",
      postalAddress: "8050 Székesfehérvár, Pf. 357.",
      phone: "+36 22 510-310",
      email: "bekeltetes@fmkik.hu",
      website: "https://www.bekeltetesfejer.hu/kapcsolat/",
    },
    privacyEmail: "kborsos@fairauto.eu",
  },
};
export const address = `${site.contact.postalCode} ${site.city}, ${site.contact.street}`;
export const contactPhones = bookingConfiguration.phoneContacts;
export const contactPhoneLabel = contactPhones
  .map((phone) => phone.label)
  .join(" / ");
export const locationLabel = `${site.city}, ${site.contact.street}`;

/** Szolgáltatásnevek és becsült időtartamok; az elérhetőség ezeket az időtartamokat használja. */
export const serviceOptions = bookingConfiguration.services;

export const legalNavigation = [
  { slug: "adatkezelesi-tajekoztato", label: "Adatkezelési Tájékoztató" },
  { slug: "aszf", label: "ÁSZF" },
  { slug: "suti-tajekoztato", label: "Süti- és tárhelytájékoztató" },
  { slug: "impresszum", label: "Impresszum" },
  { slug: "fogyasztoi-tajekoztato", label: "Fogyasztói tájékoztató" },
  {
    slug: "adatvedelmi-es-adatbiztonsagi-szabalyzat",
    label: "Adatvédelmi és adatbiztonsági szabályzat",
  },
];
