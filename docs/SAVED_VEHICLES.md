# Mentett járművek – CasaOS és PocketBase

A Járműveim és Járműpark oldalak valódi PocketBase-adatokat használnak. Mentés, szerkesztés, törlés, keresés, lapozás és alapértelmezett járműválasztás érhető el. A járművek másik eszközről belépve is megmaradnak. Az admin az Összes jármű listában más fiókok autóit is szerkesztheti és törölheti. Új autót a felület mindig az aktuális fiókhoz ad hozzá.

**Nincs szükség hookokra, profilképekre, SMTP-re vagy API-kulcsokra.** Az app a jelenlegi konténerben és a jelenlegi adatmappával marad. A migráció az eredeti fiókkezelési migrációra épül; már alkalmazott migrációt nem futtat újra. A régi demó autóit nem importálja valódi fiókokhoz.

**A javított célútvonal `/pocketbase/pb_data`.** Ezt az indítási argumentumok és a bináris `--help` kimenete igazolja. A korábbi útmutatóban szereplő `/pb_data` másik könyvtár volt, ezért az ottani `No new migrations to apply` nem igazolta a működő app adatbázisát. Az alábbi eljárás közvetlenül a jelenlegi konténerben fut; nincs adatmozgatás, kötetcsere vagy új konténer.

## Telepítés

A PocketBase adminfelületén előbb készíts és tölts le mentést. Utána a CasaOS gépen:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793494800_saved_vehicles.js \
  --output /DATA/AppData/pocketbase/pb_migrations/1793494800_saved_vehicles.js
```

A bejelentkezés nélküli curl nyilvánosan hozzáférhető repónál működik. Privát repó 404-es válaszánál a [CasaOS útmutató](./CASAOS_POCKETBASE.md) autentikált letöltési módját használd, az új fájlnévvel. A letöltött JS fájlt ne másold a `pb_data` mappába.

Ha a letöltés sikerült, ezt a teljes blokkot futtasd. Az eredeti `1793404800_account_management.js` is legyen a host migrációs mappában. A már futó **`pocketbase`** konténer saját binárisát használjuk; a konténer maradjon elindítva a parancsokhoz:

```sh
sudo docker exec pocketbase mkdir -p /pocketbase/fairauto_vehicle_migrations &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js \
  pocketbase:/pocketbase/fairauto_vehicle_migrations/1793404800_account_management.js &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_migrations/1793494800_saved_vehicles.js \
  pocketbase:/pocketbase/fairauto_vehicle_migrations/1793494800_saved_vehicles.js &&
sudo docker exec pocketbase /pocketbase/pocketbase migrate up \
  --dev=false \
  --dir /pocketbase/pb_data \
  --migrationsDir /pocketbase/fairauto_vehicle_migrations &&
sudo docker restart pocketbase
```

Az első alkalmazáskor a kimenetben `Applied 1793494800_saved_vehicles.js` várható. A végén az újraindítás frissíti a PocketBase kollekciós gyorsítótárát. Frissítsd a portál Járműveim oldalát. Ha a fájl már szerepel az aktív adatbázis migrációi között, az ismételt futtatás nem módosítja újra az adatokat.

A mappák, kötetek, portok és a Tunnel változatlanok. A migráció tranzakcióban fut; a műveletet rövid karbantartási időben végezd, és a parancs alatt ne szerkessz fiókokat. Ha hibát jelez, az `&&` miatt az újraindítás nem fut le; őrizd meg a kimenetet és ne hozz létre kézzel kollekciókat. Már meglévő, más célra létrehozott `vehicles` kollekciónál a migráció leáll, hogy ne írjon felül ismeretlen adatokat.

Ez az eljárás a meglévő tárolási elrendezést is változatlanul hagyja: az aktív `/pocketbase/pb_data` jelenleg a konténer belső tárhelyén van. Konténer újralétrehozása vagy cseréje előtt mindig tölts le külön PocketBase-mentést.

## Létrejövő adatok és szabályok

- `vehicles`: kötelező `owner` kapcsolat a `users` rekordhoz; `plate`, `make`, `model`, numerikus `year`, valamint `created` és `updated`.
- A rendszám nagybetűs, szóköz és kötőjel nélküli érték. Egy fiókon belül az adatbázis egyedi indexe tiltja az ismétlést; más fiókhoz ugyanaz a rendszám elmenthető, mert itt nem jogi tulajdonjogot ellenőrzünk.
- `users.defaultVehicle`: opcionális, egyetlen saját járműre mutató kapcsolat. Kiválasztás hiányában a legrégebben mentett autó az alapértelmezett. Törlés után a következő megmaradt autó lép a helyére.
- A PocketBase saját API-szabályai és az alkalmazás szervere is ellenőrzik a hozzáférést. A munkafelvevő és a vezető jelenleg a saját mentett listáját kezeli. Más fiók járműveit az admin kezelheti. Jármű tulajdonos fiókja szerkesztéssel nem cserélhető.
- Más fiók autója alapértelmezettként nem állítható be; a felhasználói rekord szabálya a közvetlen PocketBase-kéréseket is ellenőrzi.
- A fiók törlése a hozzá tartozó autókat is törli. A korábbi mentésekre az üzemeltető megőrzési szabálya vonatkozik.

A listák 24 autót mutatnak oldalanként, a keresés szerveroldali. A webes gyártásiév-ellenőrzés 1886-tól a következő évig fogad el egész számot; a PocketBase numerikus mezőjén további 1886–2100 tartománykorlát van. A mentett adatok nem kerülnek a böngésző localStorage-jába. A műveletek folyamaton belüli próbálkozáskorlátot kapnak; a vállalati üzemeltetéshez továbbra is szükségesek a dokumentált PocketBase/edge korlátozások és mentések.

## Ellenőrzés

Frissítsd a weboldalt a Vercel telepítése és a migráció után. Jelentkezz be, nyisd meg a Járműveim oldalt, és ments el egy autót. Újratöltés után is látszania kell; másik fiókból a saját listában nem jelenhet meg. Az alapértelmezett autó a saját áttekintésben is megjelenik. A partner Járműpark lapja ugyanennek a fióknak az autóit és valódi darabszámát mutatja.

A járműmentés adatbázisos funkció. Az alapértelmezett autó a foglalóban kitöltődik; az időpontkérések backendjének külön telepítése: [APPOINTMENTS.md](./APPOINTMENTS.md). A járműadatok megléte önmagában nem küld időpontkérést vagy e-mailt.
