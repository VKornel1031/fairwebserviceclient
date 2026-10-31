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

A repóban lévő két fájlt másold ide, vagy töltsd le közvetlenül a saját GitHub-repódból:

```sh
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793404800_account_management.js \
  -o /DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js

sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/account.pb.js \
  -o /DATA/AppData/pocketbase/pb_hooks/account.pb.js
```

Ha valamelyik letöltés hibát jelez, az újraindítás előtt javítsd; ne használj hiányos fájlt. Ezek saját repóból származó, felülvizsgálható szöveges fájlok, nem jelszavak vagy API-kulcsok. Ne másold a `scripts/test-pocketbase.py` tesztadat-generátort a homelabra.

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
