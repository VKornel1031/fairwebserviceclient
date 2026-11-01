import { site } from "../content/site";

/** Completeness check, not a legal compliance certificate. */
export function legalSetupIssues(legal = site.legal) {
  const required: [string, string][] = [
    ["Dokumentumverzió", legal.version],
    ["Cégnév", legal.companyName],
    ["Székhely", legal.registeredOffice],
    ["Cégjegyzékszám", legal.registrationNumber],
    ["Adószám", legal.taxNumber],
    ["Nyilvántartó hatóság", legal.registryAuthority],
    ["Tárhelyszolgáltató", legal.hostingProvider],
    ["Tárhelyszolgáltató címe", legal.hostingAddress],
    ["Tárhelyszolgáltató e-mail", legal.hostingEmail],
    ["Panaszkezelési levelezési cím", legal.complaintsAddress],
    ["Panaszkezelési e-mail", legal.complaintsEmail],
    [
      "Éles célok, jogalapok és adatfeldolgozók",
      legal.productionDataProcessing,
    ],
    ["Éles megőrzési idők", legal.productionRetention],
    ["Magatartási kódex / alkalmazhatóság", legal.codeOfConduct],
    ["Árfeltüntetés és árképzés tájékoztatása", legal.pricingDisclosure],
  ];
  required.push([
    "Engedély / szabályozott tevékenység tájékoztatása",
    legal.regulatedServiceDisclosure,
  ]);
  const issues = required
    .filter(([, value]) => !value.trim())
    .map(([label]) => `Kitöltendő: ${label}`);
  const reviewNames: Record<keyof typeof legal.reviews, string> = {
    companyDetails: "hiteles cégadatok",
    businessModelAndTerms: "üzleti modell és szerződési feltételek",
    privacyAndProcessors: "adatkezelés és adatfeldolgozók",
    accessibilityScope: "akadálymentességi hatály és vizsgálat",
  };
  for (const key of Object.keys(
    legal.reviews,
  ) as (keyof typeof legal.reviews)[])
    if (!legal.reviews[key]) issues.push(`Ellenőrizendő: ${reviewNames[key]}`);
  if (legal.conciliationSubmission === "not-confirmed")
    issues.push("Ellenőrizendő: általános békéltetési alávetési nyilatkozat");
  if (legal.bookingModel !== "appointment-request")
    issues.push(
      "Az online javítási szerződéshez külön szerződéskötési és elállási folyamat szükséges; a jelenlegi prototípus ezt nem valósítja meg.",
    );
  if (legal.isDraft)
    issues.push("A dokumentumok szerkeszthető minta állapotúak.");
  return issues;
}
export type LegalAcknowledgement = {
  termsVersion: string;
  privacyNoticeVersion: string;
  acceptedAt: string;
  mode: "demo" | "live";
};
export function legalAcknowledgement(): LegalAcknowledgement {
  return {
    termsVersion: site.legal.version,
    privacyNoticeVersion: site.legal.version,
    acceptedAt: new Date().toISOString(),
    mode: "demo",
  };
}
