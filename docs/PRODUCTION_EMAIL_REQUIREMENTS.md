# Értesítések az éles változathoz – rögzített igények

Ez a dokumentum a későbbi levelezés követelményeit rögzíti. A jelenlegi portál valódi PocketBase-fiókokat és időpontkéréseket kezel, de **nem küld e-mailt, nem készít e-mail-előnézeteket, és nem tartalmaz levelezési szolgáltatást**. Az alábbi értesítések még megvalósítandók.

## Időpontkérés beérkezése

- Az ügyfél vagy céges kapcsolattartó egy áttekintő levelet kap a kérés megadott e-mail-címére. Egyértelmű, hogy ez a kérés átvétele, és az időpont még telefonos egyeztetésre vár.
- Az ügyvezető és a munkafelvevő is értesítést kap a kérés részleteivel.
- Tartalom: foglalási azonosító, kért dátum és érkezési idő, szolgáltatás, becsült időtartam, név, telefonszám, e-mail, település, rendszám, márka/modell, gyártási év, megjegyzés; céges foglalásnál a cég és a kapcsolattartó adatai.
- A belső címzettek és az ügyfél külön levelet kapnak. Az ügyfél levelében ne jelenjenek meg a munkatársak e-mail-címei.

## Telefonos egyeztetés és visszaigazolás

- A munkafelvevő, a tulajdonos/vezető és az adminisztrátor visszaigazolhatja az időpontot a telefonos egyeztetés után.
- A rendszer rögzíti a visszaigazolás időpontját és az eljáró felhasználót.
- A sikeres visszaigazolás után az ügyfél vagy a cég megadott kapcsolattartója egy új levelet kap a végleges időponttal, a szolgáltatás és jármű adataival, a műhely címével és az érkezéshez szükséges tudnivalókkal.
- A munkáról és a végleges árról továbbra is külön megállapodás szükséges; az időpont-visszaigazolás nem válhat automatikusan javítási megrendeléssé.
- Az időpont módosítása új egyeztetést igényel; a módosított adatokkal friss értesítés és az új visszaigazolás után új visszaigazoló levél szükséges. A korábbi visszaigazolás ne maradjon érvényben az új időpontra.

## A valódi bekötésnél szükséges

- Szerveroldali hitelesítés és jogosultságvizsgálat: a böngésző által küldött szerepkör nem elegendő.
- Valós feladói cím, ügyvezetői és munkafelvevői címzettek, szerveren kezelt SMTP-beállítások; titkok ne kerüljenek a frontendbe vagy a repóba.
- Tartós értesítési feladatsor: a foglalási esemény és a kiküldendő üzenet rögzítése együtt történjen. Egy foglalás/verzió/esemény/címzett csak egyszer kapjon levelet; ismételt kattintás vagy újrapróbálkozás ne duplázzon.
- A küldési hiba ne állítsa vissza vagy tüntesse el a sikeresen mentett foglalást. Legyen újrapróbálkozás és a munkatársak számára látható kézbesítési állapot. Az alkalmazás ne jelezzen sikeres kézbesítést pusztán a feladat létrehozásakor.
- HTML és szöveges levélváltozat, magyar dátumformátum és Europe/Budapest időzóna, változatlanul megőrzött értesítési adatok. A felhasználói szöveg HTML-ként ne hajtódhasson végre.
- Az értesítések szolgáltatási üzenetek; marketing-hozzájárulást ne kapcsoljunk hozzájuk. A valódi levelezési adatfeldolgozót és megőrzést az adatkezelési tájékoztatóban kell pontosítani.
- Az adatbázis és a levelezés bevezetésekor a tesztpostafiókokon ellenőrizni kell a vendég, a magánügyfél és a cég teljes folyamatát, a módosítást, az ismételt eseményeket és a sikertelen küldést is.
