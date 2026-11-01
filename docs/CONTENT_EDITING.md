# Mit hol tudsz átírni?

## `content/site.ts` – nyilvános alapadatok

- Név, város, logó, fő weboldal.
- Telefon és a hozzá tartozó `tel:` hivatkozás, e-mail, műhelycím.
- Nyitvatartási feliratok.
- Cégadatok és a jogi dokumentumok állapota, frissítési dátuma.
- A lábléc jogi linkjeinek felirata és útvonala (`legalNavigation`).

Ez TypeScript-forrásfájl: módosítás után újra kell buildelni/telepíteni a weboldalt. A beleírt értékek nyilvánosak; titkos kulcsokat ne tárolj itt.

## `content/booking.json` – szolgáltatások és szerveroldali foglalási szabályok

- Szolgáltatásnév, leírás, becsült időtartam és opcionális `priceLabel` árfelirat. Üres árfeliratnál nem jelenik meg ár.
- Nyitás/zárás, idősávköz, zárt hétköznapok, párhuzamos kapacitás és foglalási horizont.
- A `termsVersion` a webes és PocketBase-oldali feltételverzió közös forrása.
- Vendég-hozzáférési idő és függő kérések korlátja.

Módosítás után telepítsd újra a weboldalt, és **ugyanezt a fájlt** másold a PocketBase hookmappájába `fairauto-booking.json` néven, majd indítsd újra a PocketBase-t. A pontos, meglévő CasaOS konténerhez készült parancsok: [APPOINTMENTS.md](./APPOINTMENTS.md). A webes forrás önmagában nem írja át a homelab beállítását. Ne tárolj titkot ebben a nyilvános fájlban.

A nyitvatartási feliratokat a `site.ts` fájlban is igazítsd a foglalási órákhoz. A `closedWeekdays` számozása 0 = vasárnap, 6 = szombat; legalább egy nyitott nap maradjon. A kapacitás és az idősávköz pozitív szám legyen, és a zárás essen a nyitás után. Minden nyitott nap azonos nyitvatartást használ; külön zárt napokat a vezető/admin a felületen állíthat be. A `reservationPolicy` maradjon `phone-confirmation`, az időzóna `Europe/Budapest`. Függő kérés nem foglal kapacitást; a telefonos megerősítés biztosítja azt.

## `content/legal.ts` – a jogi oldalak szövege

Az alapdokumentumok minden bekezdése, felsorolása és adatblokkja itt található. A fogyasztói tájékoztató külön a `content/consumer.ts`, a letölthető nyilatkozatok szövege a `content/consumer-forms.ts` fájlban szerkeszthető. A szöveg a PocketBase-fiókkezelést, mentett autókat, időpontkéréseket, telefonos megerősítést és vendég-hozzáférési sütit írja le. A levelezés még nincs bekötve.

Útvonalak:

- `/adatkezelesi-tajekoztato`
- `/aszf`
- `/suti-tajekoztato`
- `/impresszum`
- `/fogyasztoi-tajekoztato`

A közös megjelenés az `app/(legal)/[document]/page.tsx` és `app/(legal)/legal.css` fájlokban van. A `components/legal-links.tsx` kezeli a közös lábléclinkeket; ezek a főoldalon és minden portáloldalon megjelennek. A regisztráció és foglalás áttekintése is hivatkozik az adatkezelési és ÁSZF-oldalakra.

## Élesítés előtt kitöltendő

A `site.legal` üres mezőibe a saját hiteles cégadatokat írd: székhely, cégjegyzékszám, adószám, nyilvántartó hatóság, képviselő és a tényleges tárhelyszolgáltató. A műhely címe nem automatikusan a cég székhelye.

A jogi szöveghez a tényleges adatfolyamokat, célonkénti jogalapokat, megőrzést, szolgáltatókat, fogyasztói feltételeket és panaszkezelést is pontosítani kell. A `site.legal.isDraft` csak az ellenőrzés után legyen `false`; a mintajelölés csak a hiányzó adatok és felülvizsgálatok rendezése után tűnhet el. A kapcsoló nem teszi élessé vagy jogilag kész állapotúvá a szolgáltatást. Érdemi szövegváltoztatáskor a `booking.json` fájl `termsVersion` értékét és a `site.legal.updatedAt` dátumot is módosítsd. A korábbi éles verziókat változatlanul meg kell őrizni; a portál letöltése mindig az aktuális szöveget mutatja.

A betűkészleteket helyben szolgáljuk ki; nincs Google Fonts-lekérés a látogató böngészőjéből. Analitika, marketingeszköz, beágyazás vagy új auth-tárolás bevezetésekor az érintett dokumentumot is frissítsd. A jelenlegi szükséges tároláshoz nem adtunk általános sütibannert; új eszköz bevezetésekor a tényleges hozzájárulási követelményt újra kell értékelni.

PocketBase-fiókkezelés előkészítése: [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md).

Magyar jogi felkészülési útmutató és források: [HUNGARIAN_LEGAL_READINESS.md](./HUNGARIAN_LEGAL_READINESS.md). Kitöltési ellenőrzés: `npm run legal:check`.
