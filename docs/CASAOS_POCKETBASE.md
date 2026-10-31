# A te CasaOS PocketBase-telepítésed

Megadott image: **`argonptg/pocketbase`**. Meglévő host adatmappa: **`/DATA/AppData/pocketbase/pb_data`**.

Az image közzétett konfigurációjában a munkakönyvtár `/pocketbase`, a bináris `/pocketbase/pocketbase`. Ebből következnek az alábbi alapértelmezett célmappák; a meglévő CasaOS-beállításban ellenőrizd, hogy nem írtad-e felül őket egyedi indítási paraméterrel. A `pb_data` meglévő kötetét ne töröld és ne cseréld le.

## 1. Mentés, majd leállítás

A PocketBase kezelőjében készíts és tölts le mentést. Ezután CasaOS-ban állítsd le a PocketBase appot. A mentés és a lentiek alkalmazása nem módosítja a Vercel-projektet.

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

## 3. Kötetmappák a CasaOS app beállításaiban

A PocketBase app **Settings → Volumes / Folder mappings** részében:

| A CasaOS gépen                           | A konténerben                               |
| ---------------------------------------- | ------------------------------------------- |
| `/DATA/AppData/pocketbase/pb_data`       | `/pocketbase/pb_data` – a meglévő adatkötet |
| `/DATA/AppData/pocketbase/pb_migrations` | `/pocketbase/pb_migrations` – új kötet      |
| `/DATA/AppData/pocketbase/pb_hooks`      | `/pocketbase/pb_hooks` – új kötet           |

Az új kötetek legyenek olvashatók a konténernek. Őrizd meg a meglévő portokat, hálózati és Tunnel-beállításokat. **Ne frissíts most véletlenül másik image-verzióra**, és ne töröld az appot vagy a `pb_data` mappát. Mentsd a beállításokat, majd indítsd el az appot.

A normál PocketBase `serve` indítás automatikusan alkalmazza az új migrációkat. Ellenőrizd a naplót és a `users` collectiont: az `active`, `protectedRoot`, céges és feltétel-elfogadási mezőknek meg kell jelenniük. Az Auth rule ezután `active = true`.

Ha kifejezetten kikapcsoltad az automigrációt, a saját telepítésed indítási beállításai szerint, leállított kiszolgáló mellett futtasd a migrációt; ne indíts párhuzamos PocketBase-példányt ugyanazon adatmappával. A migráció hibánál nem töröl rekordot; ellenőrizd például a meglévő fiókok nevét és szerepkörét, és mentés után javítsd a nem megfelelő adatokat, mielőtt újrapróbálod.

A konténer nevét így találod meg:

```sh
sudo docker ps --filter ancestor=argonptg/pocketbase --format '{{.Names}}'
```

A kötetek ellenőrzéséhez, a kapott konténernevet behelyettesítve:

```sh
sudo docker inspect CONTAINER_NAME --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

## 4. Admin és Vercel

A [fiókkezelési útmutató](./POCKETBASE_SETUP.md) 3–5. lépése szerint hozz létre normál `users` admint (`role=admin`, `active=true`, `protectedRoot=true`), állítsd be a Vercel-változókat, majd telepítsd újra a frontendet. A PocketBase-superuser belépését ne használd a weboldalon.

Az [image leírása](https://hub.docker.com/r/argonptg/pocketbase) szerint előre beállított adminbelépést tartalmaz. A PocketBase superuserlistájában ellenőrizd, hogy minden megmaradó superuser a saját, erős hitelesítő adataidat használja; ne maradjon gyári belépés. Nem szükséges semmilyen jelszót megosztanod ehhez. A korábbi PocketBase-verzió frissítése és az üzemeltetési védelem külön, a mentések után ellenőrzendő: lásd az általános útmutató biztonsági részét.
