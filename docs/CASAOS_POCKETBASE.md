# A te CasaOS PocketBase-telepítésed

Konténernév: **`pocketbase`**. Telepített image: **`argonptg/pocketbase:0.26.6`**. Meglévő host adatmappa: **`/DATA/AppData/pocketbase/pb_data`**.

A futó app indítása `WorkingDir=/pocketbase`, `serve --http=0.0.0.0:8090`, külön adatkönyvtár-paraméter nélkül. A `--help` alapján a tényleges adatmappa **`/pocketbase/pb_data`**. A `/pb_data` csatolásból korábban tévesen következtettünk az aktív adatbázisra. A járművekhez a [közvetlenül a jelenlegi konténerben végrehajtott telepítést](./SAVED_VEHICLES.md) használd: az nem változtatja meg az appot vagy a köteteket. A bináris továbbra is `/pocketbase/pocketbase`.

## 1. Mentés

A PocketBase kezelőjében készíts és tölts le mentést. A jelenlegi konténeren belüli migrációs parancsokhoz az app maradjon elindítva. A műveletet rövid karbantartási időben végezd; közben ne szerkessz fiókokat. A mentés és a lentiek nem módosítják a Vercel-projektet.

## 2. Fájlok a CasaOS gépére

A CasaOS gép terminálján hozd létre a két kiegészítő könyvtárat:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations
sudo mkdir -p /DATA/AppData/pocketbase/pb_hooks
```

A repó **privát**. A bejelentkezés nélküli `raw.githubusercontent.com` letöltés ezért 404-et adhat akkor is, ha a fájl létezik. A korábbi `curl` parancsokhoz GitHub-hitelesítés kellett volna; a repót nem szükséges nyilvánossá tenni.

A legegyszerűbb böngészős lehetőség: saját GitHub-fiókodba belépve töltsd le a `pocketbase/pb_migrations/1793404800_account_management.js` és a `pocketbase/pb_hooks/account.pb.js` fájlt, majd a CasaOS fájlkezelőjével másold őket a megfelelő host mappákba.

Terminálból használhatod a hivatalos GitHub CLI-t. Debianon:

```sh
sudo apt update
sudo apt install gh

gh auth login --hostname github.com --git-protocol https --web
```

A böngészős bejelentkezést a saját gépeden fejezd be a terminálon megjelenő útmutatóval. A `gh` parancsot **kodi felhasználóként, sudo nélkül** futtasd; a `sudo gh` másik felhasználó hitelesítését használná. Jelszót, belépési kódot vagy tokent ne küldj csevegésben. Ez GitHub-hozzáférés a privát fájlokhoz; a webalkalmazáshoz továbbra sem kell PocketBase API-kulcs.

Ezután töltsd le előbb a saját felhasználói mappádba. Csak akkor telepítjük őket, ha mindkét letöltés sikeres:

```sh
mkdir -p ~/fairauto-pb-setup

gh api -H 'Accept: application/vnd.github.raw+json' \
  'repos/VKornel1031/fairwebserviceclient/contents/pocketbase/pb_migrations/1793404800_account_management.js?ref=main' \
  > ~/fairauto-pb-setup/1793404800_account_management.js &&
gh api -H 'Accept: application/vnd.github.raw+json' \
  'repos/VKornel1031/fairwebserviceclient/contents/pocketbase/pb_hooks/account.pb.js?ref=main' \
  > ~/fairauto-pb-setup/account.pb.js &&
sudo install -m 0644 ~/fairauto-pb-setup/1793404800_account_management.js \
  /DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js &&
sudo install -m 0644 ~/fairauto-pb-setup/account.pb.js \
  /DATA/AppData/pocketbase/pb_hooks/account.pb.js
```

Ha valamelyik lépés hibát jelez, állj meg az újraindítás előtt. Siker esetén az `install` nem feltétlenül ír ki semmit. A mappák létrehozása és a sikertelen korábbi 404-es letöltés önmagában nem módosította az adatbázist. Ne másold a `scripts/test-pocketbase.py` tesztadat-generátort a homelabra.

## 3. Migráció a jelenlegi konténerben

A fiók- és járműkezeléshez kövesd a [SAVED_VEHICLES.md bemásolható parancsait](./SAVED_VEHICLES.md). A migrációs JS fájlokat a host mappából a jelenlegi konténerbe másoljuk, a migráció explicit módon az aktív `/pocketbase/pb_data` könyvtárat célozza, majd ugyanaz a konténer újraindul. Nem kell új image, átirányítás, új adatmappa vagy új kötet.

Az opcionális e-mail-cím-módosító hook külön funkció; a járműkezeléshez nem szükséges. A hostra letöltött `account.pb.js` fájl a jelenlegi indításnál a konténer `/pocketbase/pb_hooks/account.pb.js` útvonalára kerül, majd az appot újra kell indítani. A profilképes felület továbbra is ki van kapcsolva. A jelenlegi adatcsatolás megváltoztatása nem része ennek az eljárásnak.

A futó app aktív adatmappája jelenleg a konténer belső tárhelyén van. Konténercseréhez vagy újralétrehozáshoz mindig legyen külön letöltött mentés.

## 4. Admin és Vercel

A [fiókkezelési útmutató](./POCKETBASE_SETUP.md) 3–5. lépése szerint hozz létre normál `users` admint (`role=admin`, `active=true`, `protectedRoot=true`), állítsd be a Vercel-változókat, majd telepítsd újra a frontendet. A PocketBase-superuser belépését ne használd a weboldalon.

Az [image leírása](https://hub.docker.com/r/argonptg/pocketbase) szerint előre beállított adminbelépést tartalmaz. A PocketBase superuserlistájában ellenőrizd, hogy minden megmaradó superuser a saját, erős hitelesítő adataidat használja; ne maradjon gyári belépés. Nem szükséges semmilyen jelszót megosztanod ehhez. A korábbi PocketBase-verzió frissítése és az üzemeltetési védelem külön, a mentések után ellenőrzendő: lásd az általános útmutató biztonsági részét.
