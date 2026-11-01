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
  legal: {
    updatedAt: "2026-11-01",
    version: bookingConfiguration.termsVersion,
    // A jelenlegi folyamat időpontkérés; online javítási szerződést/fizetést nem valósít meg.
    bookingModel: "appointment-request",
    // Maradjon true a tényleges működéshez igazítás és ellenőrzés befejezéséig.
    isDraft: true,
    companyName: "FAIR AUTÓSZERVÍZ FEHÉRVÁR Kft.",
    // Ezeket a saját hiteles cégadataid alapján töltsd ki; a műhely címe nem feltétlenül székhely.
    registeredOffice: "",
    registrationNumber: "",
    taxNumber: "",
    registryAuthority: "",
    representative: "",
    hostingProvider: "",
    hostingAddress: "",
    hostingEmail: "",
    complaintsAddress: "",
    complaintsEmail: "kborsos@fairauto.eu",
    conciliationSubmission: "not-confirmed",
    regulatedServiceDisclosure: "",
    codeOfConduct: "",
    pricingDisclosure: "",
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
];
