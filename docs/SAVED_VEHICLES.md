# Mentett járművek – CasaOS és PocketBase

A Járműveim és Járműpark oldalak valódi PocketBase-adatokat használnak. Mentés, szerkesztés, törlés, keresés, lapozás és alapértelmezett járműválasztás érhető el. A járművek másik eszközről belépve is megmaradnak. Az admin az Összes jármű listában más fiókok autóit is szerkesztheti és törölheti. Új autót a felület mindig az aktuális fiókhoz ad hozzá.

**Nincs szükség hookokra, profilképekre, SMTP-re vagy API-kulcsokra.** A meglévő `/DATA/AppData/pocketbase/pb_data` → `/pb_data` adatkötetet őrizd meg. A migráció az eredeti fiókkezelési migrációra épül; már alkalmazott migrációt nem futtat újra. A régi demó autóit nem importálja valódi fiókokhoz.

## Telepítés

A PocketBase adminfelületén előbb készíts és tölts le mentést. Utána a CasaOS gépen:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793494800_saved_vehicles.js \
  --output /DATA/AppData/pocketbase/pb_migrations/1793494800_saved_vehicles.js
```

A bejelentkezés nélküli curl nyilvánosan hozzáférhető repónál működik. Privát repó 404-es válaszánál a [CasaOS útmutató](./CASAOS_POCKETBASE.md) autentikált letöltési módját használd, az új fájlnévvel. A letöltött JS fájlt ne másold a `pb_data` mappába.

Ha a letöltés sikerült, ezt a teljes blokkot futtasd. A telepített **`argonptg/pocketbase:0.26.6`** image-et használja:

```sh
sudo test -s /DATA/AppData/pocketbase/pb_migrations/1793494800_saved_vehicles.js &&
sudo docker stop pocketbase &&
sudo docker run --rm --pull=never --network none \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_data,dst=/pb_data \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_migrations,dst=/pb_migrations,readonly \
  --entrypoint /pocketbase/pocketbase \
  argonptg/pocketbase:0.26.6 \
  migrate up --dir /pb_data --migrationsDir /pb_migrations &&
sudo docker start pocketbase
```

Ehhez nem kell új kötetet hozzáadni a futó CasaOS apphoz: az egyszer használatos migrációs konténer csatolja a migrációs mappát. A leállított app és a migráció ugyanazt az adatkötetet használja. Ha a migráció hibát jelez, őrizd meg a mentést és a hibaüzenetet; ne töröld a kollekciókat. Már meglévő, más célra létrehozott `vehicles` kollekció esetén a migráció leáll, hogy ne írjon felül ismeretlen adatokat.

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

A járműmentés már éles adatbázisos funkció; az online időpontkérés bekötése még külön lépés. A járműadatok megléte önmagában nem küld időpontkérést vagy e-mailt.
