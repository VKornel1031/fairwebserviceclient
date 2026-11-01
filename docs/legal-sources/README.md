# A megadott dokumentumok és a webes változat

Az eredeti feltöltések változtatás nélkül, összehasonlításhoz maradnak ebben a mappában. A webhely ezeket nem szolgálja ki letölthető dokumentumként. A frissített, szerkeszthető szöveg forrása:

- [`content/privacy.ts`](../../content/privacy.ts) – Adatkezelési Tájékoztató.
- [`content/data-security.ts`](../../content/data-security.ts) – Adatvédelmi és adatbiztonsági szabályzat.
- [`content/site.ts`](../../content/site.ts) – a dokumentumokból átvett cégadatok.
- [`content/booking.json`](../../content/booking.json) – közös telefonszámok, dokumentumverzió és vendégmegőrzési idő.

A két webes oldalon az aktuális szöveg `.txt` és ellenőrzött, szerkeszthető `.docx` másolata is letölthető. A Word-másolat verziózott fájlja a `public/dokumentumok/jogi` mappában található; csak akkor jelenik meg aktuális letöltésként, ha verziója és forrásszöveg-lenyomata egyezik a weboldaléval. Későbbi szövegszerkesztés nem tesz közzé észrevétlenül elavult Word-másolatot.

Az eredeti DOCX-ben szereplő belső munkautasításokat dokumentumtartalomként kezeltük; ezek nem önálló engedélyek rendszer-, fiók- vagy adattörlési műveletre. A vendégtörlés megvalósítását az üzemeltető külön, kifejezetten kérte: **30 nap a befejezés vagy lemondás után**.

## Lényeges pontosítások

- A megadott székhely, cégjegyzékszám, adószám, ügyvezető és IT-felelős bekerült a közös alapadatokba. A telefonszámok a később megadott `06203473705` és `06204056299`, nem a DOCX régebbi számai.
- A Vercel címe a szolgáltató jelenlegi tájékoztatója alapján: 440 N Barranca Avenue #4133, Covina, CA 91723, USA; privacy@vercel.com. Ellenőrzés: 2026-11-01, https://vercel.com/legal/privacy-policy.
- Vercel szerveroldali fiók- és foglalási kéréseket is kiszolgál; a működés nem kizárólag statikus tárhely. Gmail / Google Workspace SMTP is szerepel a tájékoztatóban.
- A 30 napos törlés nem a foglalás létrehozásától számít, így nem veszélyezteti a későbbi vagy még folyamatban lévő időpontokat. Az előzmény- és értesítési másolatokat is kezeli; korábbi mentések és kézbesített levelek külön megőrzési körbe tartoznak.
- A fiók önkiszolgáló törlését nem ígérjük: a saját jármű törölhető, a fiók és más időpontmásolatok törlését az adatkezelő intézi. A rendszám/VIN és az adatkapcsolat megszüntetése önmagában nem bizonyított anonimizálás.
- Az incidensbejelentés az eredeti 74 óra helyett a GDPR feltételei szerinti, tudomásszerzéstől számított **72 óra**. A 15 nap belső ügyintézési cél; a GDPR szerinti válaszadási határidő főszabály szerint egy hónap.
- A szükséges munkamenettárolásra nem vezettünk be általános hozzájáruló sütisávot. Opcionális követés nincs; a Cloudflare konkrét sütibeállításait az üzemeltető ellenőrzi.
- A dokumentum nem állítja ellenőrzött tényként az előírt titkosított heti mentést vagy fizikai szervervédelmet. A hatósági vizsgairatok ötéves megőrzésének és auditciklusának konkrét alkalmazhatósága üzemeltetői/szakmai ellenőrzésre vár.
- A nyilvános regisztráció csak céges partnert hoz létre. E-mail-igazolás nem oszt ki admin-, vezetői vagy munkafelvevői szerepet.

## Word-másolat frissítése

Dokumentumszöveg módosítása után, helyi Next-kiszolgáló mellett futtasd:

```sh
python3 scripts/export-legal-docx.py --base http://127.0.0.1:3102
```

A dokumentum-előkészítő Python-szkripthez `python-docx` és `lxml` kell; a webalkalmazás futásához nincs szükség rájuk. A szöveg forrása továbbra a TypeScript-fájl, nem a generált Word-fájl.

## Eredeti fájlok SHA-256 lenyomata

- `adatkezelesi-tajekoztato.original.docx`: `11cb1d6ae1e6c460fda94fd328c88498a350f80f37a7c50fcd8665ab6d9fe6c6`
- `adatvedelmi-es-adatbiztonsagi-szabalyzat.original.docx`: `f405f14797ef8dbb19ef296efbaea1fe9a6d18a2dc3f69f2614abf938cd35dc0`
