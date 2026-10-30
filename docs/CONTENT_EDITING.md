# Mit hol tudsz átírni?

## `content/site.ts` – nyilvános alapadatok

- Név, város, logó, fő weboldal.
- Telefon és a hozzá tartozó `tel:` hivatkozás, e-mail, műhelycím.
- Nyitvatartási feliratok.
- A demó foglalási paraméterei: nyitás/zárás, idősávköz, zárt hétköznapok, párhuzamos kapacitás, foglalási horizont és időzóna.
- A szolgáltatások neve, leírása és becsült időtartama (`serviceOptions`).
- Cégadatok és a jogi dokumentumok állapota, frissítési dátuma.
- A lábléc jogi linkjeinek felirata és útvonala (`legalNavigation`).

Ez TypeScript-forrásfájl: módosítás után újra kell buildelni/telepíteni a weboldalt. A beleírt értékek nyilvánosak; titkos kulcsokat ne tárolj itt.

A nyitvatartási feliratokat kézzel igazítsd a foglalási órákhoz. A `closedWeekdays` számozása 0 = vasárnap, 6 = szombat; legalább egy nyitott nap maradjon. A kapacitás és az idősávköz pozitív szám legyen, és a zárás essen a nyitás után. A jelenlegi demó azonos nyitvatartással számol minden nyitott napon. Az éles rendszerben a szerveroldali PocketBase-logikának is ugyanezeket a szabályokat kell alkalmaznia.

## `content/legal.ts` – a jogi oldalak szövege

A négy dokumentum minden bekezdése, felsorolása és adatblokkja itt található. A szöveget a jelenlegi helyi demóhoz igazítottuk; az éles PocketBase-fiókkezelést még nem állítja működőnek.

Útvonalak:

- `/adatkezelesi-tajekoztato`
- `/aszf`
- `/suti-tajekoztato`
- `/impresszum`

A közös megjelenés az `app/(legal)/[document]/page.tsx` és `app/(legal)/legal.css` fájlokban van. A `components/legal-links.tsx` kezeli a közös lábléclinkeket; ezek a főoldalon és minden portáloldalon megjelennek. A regisztráció és foglalás áttekintése is hivatkozik az adatkezelési és ÁSZF-oldalakra.

## Élesítés előtt kitöltendő

A `site.legal` üres mezőibe a saját hiteles cégadatokat írd: székhely, cégjegyzékszám, adószám, nyilvántartó hatóság, képviselő és a tényleges tárhelyszolgáltató. A műhely címe nem automatikusan a cég székhelye.

A jogi szöveghez a tényleges adatfolyamokat, célonkénti jogalapokat, megőrzést, szolgáltatókat, fogyasztói feltételeket és panaszkezelést is pontosítani kell. A `site.legal.isDraft` csak az ellenőrzés után legyen `false`; ez a kapcsoló a mintajelölést rejti el, önmagában nem teszi élessé vagy jogilag kész állapotúvá a szolgáltatást. Frissítéskor a `updatedAt` dátumot is módosítsd.

A jelenlegi Google Fonts-kapcsolat szerepel a tájékoztatóban. Analitika, marketingeszköz, beágyazás vagy új auth-tárolás bevezetésekor az érintett dokumentumot is frissítsd. A prototípushoz nem adtunk általános, nem működő sütibannert.

PocketBase-fiókkezelés előkészítése: [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md).
