/** Nyilvános alapadatok. Itt szerkeszd a márkát, elérhetőségeket és a demó foglalási alapértékeit.
 * Titkos kulcsot, jelszót vagy PocketBase-superuser tokent soha ne írj ebbe a fájlba. */
export const site = {
  name: "Fair Autószerviz Fehérvár",
  shortName: "Fair Autószerviz",
  city: "Székesfehérvár",
  logo: "/images/fair-logo.png",
  mainWebsite: "https://fairautoweb.vercel.app/",
  contact: {
    phone: "+36 20 405 5958",
    phoneHref: "tel:+36204055958",
    email: "kborsos@fairauto.eu",
    postalCode: "8000",
    street: "Balatoni út 8.",
  },
  // A nyitvatartási feliratokat is igazítsd a foglalási értékekhez.
  hours: { short: "H–P 06:00–17:00", long: "Hétfő–péntek · 06:00–17:00" },
  booking: {
    opensAt: "06:00",
    closesAt: "17:00",
    slotMinutes: 60,
    closedWeekdays: [0, 6], // 0 = vasárnap, 6 = szombat; legalább egy nyitott nap maradjon.
    capacity: 2,
    horizonDays: 90,
    timeZone: "Europe/Budapest",
  },
  legal: {
    updatedAt: "2026-10-30",
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
    privacyEmail: "kborsos@fairauto.eu",
  },
};
export const address = `${site.contact.postalCode} ${site.city}, ${site.contact.street}`;
export const locationLabel = `${site.city}, ${site.contact.street}`;

/** Szolgáltatásnevek és becsült időtartamok; az elérhetőség ezeket az időtartamokat használja. */
export const serviceOptions = [
  {
    id: "maintenance",
    name: "Karbantartás és javítás",
    short: "Karbantartás",
    description: "Olajcsere, időszakos szerviz, megelőző gondoskodás.",
    duration: 90,
    icon: "wrench",
    tag: "A mindennapok biztonsága",
  },
  {
    id: "inspection",
    name: "Műszaki vizsga",
    short: "Műszaki vizsga",
    description: "Felkészítés és helyszíni vizsgáztatás, egy helyen.",
    duration: 60,
    icon: "shield",
    tag: "Nyugodtan tovább",
  },
  {
    id: "diagnostics",
    name: "Diagnosztika",
    short: "Diagnosztika",
    description: "Pontos hibafeltárás korszerű diagnosztikai eszközökkel.",
    duration: 60,
    icon: "scan",
    tag: "Tisztán látni",
  },
  {
    id: "tyres",
    name: "Gumi- és futóműszerviz",
    short: "Gumi és futómű",
    description: "Szezonális gumicsere, centrírozás és futóműellenőrzés.",
    duration: 60,
    icon: "wheel",
    tag: "Biztos úttartás",
  },
  {
    id: "other",
    name: "Egyéb szervizigény",
    short: "Egyéb szerviz",
    description: "Mondd el, miben segíthetünk az autóddal kapcsolatban.",
    duration: 60,
    icon: "wrench",
    tag: "Beszéljük meg",
  },
];

export const legalNavigation = [
  { slug: "adatkezelesi-tajekoztato", label: "Adatkezelési Tájékoztató" },
  { slug: "aszf", label: "ÁSZF" },
  { slug: "suti-tajekoztato", label: "Süti- és tárhelytájékoztató" },
  { slug: "impresszum", label: "Impresszum" },
];
