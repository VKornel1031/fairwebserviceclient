# Szervizdokumentum az ár mellett

A meglévő CasaOS rendszeren először a [teljes, bemásolható frissítési blokkot](./SECURITY_UPDATE.md#copy-paste-installation-on-the-casaos-host) futtasd. A frissítő offline mentést készít, telepíti az új hookot és a `1793721600_appointment_documents.js` migrációt, majd ellenőrzi a dokumentumtár készenlétét. A már telepített migrációkat kihagyja. Az SMTP- és helyi Sendmail-beállításokat megőrzi; külön API-kulcs nem szükséges.

A weboldal új változata a meglévő GitHub/Vercel telepítési folyamaton kerül ki. Az automatikus listafrissítés és a gyorsabb hitelesítési hívások a weboldal kódjában vannak; a feltöltéshez és az új közös feltételverzióhoz a backend frissítése is szükséges.

## Használat

1. Munkafelvevőként, adminisztrátorként vagy tulajdonos/vezetőként nyisd meg a telefonon visszaigazolt, folyamatban lévő vagy elkészült időpont részleteit.
2. Válaszd az **Ár hozzáadása / Ár módosítása** gombot. A bruttó ár vagy a tételes bontás mellett választhatsz **egy PDF, JPG vagy PNG dokumentumot, legfeljebb 3 MB méretben**.
3. Az **Ár mentése** egyszerre menti az árváltozást és a mellékletet. Másik munkatárs közben végzett módosításakor frissíteni kell a részleteket; az elavult kérés nem írhatja felül azt.
4. A jogosult ügyfél a saját időpont részleteiből töltheti le a fájlt. Bekapcsolt időpontértesítéseknél az árfrissítési levélhez is mellékeljük. A címzett az időpont kapcsolattartási e-mail-címe, céges foglalásnál is. Az engedélyezett belső értesítési címzettek külön levelet kapnak.

Új fájl a jelenlegi ár mellékletét váltja fel. A jelölőnégyzettel a jelenlegi melléklet új feltöltés nélkül is eltávolítható az aktuális árnézetből. Eltávolítás nem törli a korábbi változástörténetet vagy egy már elküldött levelet. A portál nem állít ki számlát: a feltöltött dokumentumot a szerviz külön állítja elő.

## Hozzáférés, e-mail és megőrzés

A fájlokat az `appointment_documents` kollekció védetten tárolja. Normál fiókkal a natív listázás, olvasás és írás tiltott, a natív fájl-URL egy tulajdonosi fájltokennel sem biztosít hozzáférést. A portál letöltési végpontja minden alkalommal ellenőrzi az időpont aktuális jogosultságait; vendégnél az érvényes vendéghozzáférés is kell. A válasz privát, nem gyorsítótárazható, letöltésre kényszerített, `nosniff` és sandbox fejléceket kap. A feltöltés mérete, kiterjesztése és fájlazonosító fejléce a webes szerveren és PocketBase-ben is ellenőrzött; ez nem vírusellenőrzés.

Minden feltöltés változatlan dokumentumrekordot hoz létre. A levélsor az adott árhoz tartozó dokumentum azonosítóját őrzi, ezért újrapróbáláskor sem egy később lecserélt fájlt küld. Ha a fájl nem olvasható, a dolgozó nem küld sikeresnek jelölt, melléklet nélküli árlevelet; a szokásos újrapróbálási folyamat érvényesül. A sikeres szerveroldali átadás nem postaládai kézbesítési igazolás.

Az időpont törlése a kapcsolódó dokumentumrekordokat és fájlokat is törli. A meglévő vendégadat-megőrzés erre is kiterjed. A fiókos és munkatárs által felvett ügyek megőrzése, a bizonylatok számviteli megőrzése, a mentések és külső postaládák kezelése üzemeltetői feladat. A portál nem helyettesíti a számviteli archiválást.

## Ellenőrzés

A tesztek kizárólag ideiglenes helyi PocketBase-adatbázist és elkapott leveleket használnak. Ellenőrzik a jogosultságokat, a hibás és túl nagy fájlok elutasítását, az elavult ár mentésének tiltását, a tulajdonosi és vendégletöltést, a natív fájlvédelmet, a böngészős feltöltést, a törlési kaszkádot és a korábbi levél mellékletének változatlanságát.
