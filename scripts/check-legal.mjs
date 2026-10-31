// Node.js 22/24 with --experimental-strip-types. This checks supplied data, not the lawfulness of a live service.
import { site } from "../content/site.ts";
const required = [
  "version",
  "companyName",
  "registeredOffice",
  "registrationNumber",
  "taxNumber",
  "registryAuthority",
  "hostingProvider",
  "hostingAddress",
  "hostingEmail",
  "complaintsAddress",
  "complaintsEmail",
  "productionDataProcessing",
  "productionRetention",
  "regulatedServiceDisclosure",
  "codeOfConduct",
  "pricingDisclosure",
];
const issues = required
  .filter((key) => !site.legal[key]?.trim())
  .map((key) => `Kitöltendő: site.legal.${key}`);
for (const [key, reviewed] of Object.entries(site.legal.reviews))
  if (!reviewed) issues.push(`Ellenőrizendő: site.legal.reviews.${key}`);
if (site.legal.conciliationSubmission === "not-confirmed")
  issues.push("Ellenőrizendő: általános békéltetési alávetési nyilatkozat");
if (site.legal.bookingModel !== "appointment-request")
  issues.push(
    "A beállított online szerződéses modellhez nincs megvalósított szerződéskötési/elállási backend.",
  );
if (site.legal.isDraft)
  issues.push("A jogi dokumentumok még szerkeszthető minták.");
if (issues.length) {
  console.log(
    "Jogi előkészítés: vannak nyitott tételek.\n" +
      issues.map((issue) => "• " + issue).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "A megadandó adatok és ellenőrzési jelölések ki vannak töltve. Ez nem jogi megfelelőségi tanúsítvány; a tényleges működést külön kell ellenőrizni.",
  );
