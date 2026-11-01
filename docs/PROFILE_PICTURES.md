# Profilképek – a meglévő users.avatar mezővel

**Jelenleg kikapcsolva:** a profilkép kezelőfelülete és megjelenítése kérésre eltávolítva. A portál kezdőbetűket mutat, nem kér avatar-beállítást és nem hívja a képvégpontokat. A meglévő PocketBase-adatokat ez nem törli. Az alábbi útmutató a megmaradt backend referenciája arra az esetre, ha később újra szükség lenne rá; a jelenlegi felület használatához nem kell alkalmazni.

A backend a meglévő `users.avatar` File mezőt használja, annak azonosítóját és meglévő fájljait megőrizve. Új collection nem szükséges. A későbbi feltöltőfelület visszaállításához az alábbi backend-beállítások mellett frontend-módosítás is kell.

A regisztrációs téves hiba javítása ettől függetlenül már működik. A képfeltöltéshez az alábbi egyszeri PocketBase-beállítás szükséges, mert az alap avatar mező képfájljai általában nyilvánosan elérhetők. A feltöltést addig nem engedélyezzük, amíg a fájlmező védelme nincs rendben.

## 1. Telepítendő fájlok

Készíts PocketBase-mentést, majd állítsd le az appot:

```sh
sudo docker stop pocketbase
```

A saját GitHub-fiókodba belépve töltsd le és a CasaOS fájlkezelőjével másold a következőket:

| Fájl a repóban                                                                                                                                      | Helye a CasaOS gépen                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`pocketbase/pb_migrations/1793404800_account_management.js`](../pocketbase/pb_migrations/1793404800_account_management.js) – meglévő fiókszabályok | `/DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js`      |
| [`pocketbase/pb_migrations/1793491200_private_account_avatars.js`](../pocketbase/pb_migrations/1793491200_private_account_avatars.js)               | `/DATA/AppData/pocketbase/pb_migrations/1793491200_private_account_avatars.js` |
| [`pocketbase/pb_hooks/account.pb.js`](../pocketbase/pb_hooks/account.pb.js) – frissített változat                                                   | `/DATA/AppData/pocketbase/pb_hooks/account.pb.js`                              |

A korábbi `1793404800_account_management.js` is legyen a migrációs mappában; ha már alkalmaztad, PocketBase nem futtatja újra. Ez biztosítja a fiókhoz és adminhoz kötött megtekintési szabályt. Privát repóhoz a bejelentkezés nélküli `curl` 404-et adhat; az autentikált terminálos letöltés menete a [CasaOS útmutatóban](./CASAOS_POCKETBASE.md) található.

A CasaOS app kötetkapcsolatai (a tényleges adatkötet célja `/pb_data`; ezt hagyd változatlanul):

| Host                                     | Konténer         |
| ---------------------------------------- | ---------------- |
| `/DATA/AppData/pocketbase/pb_data`       | `/pb_data`       |
| `/DATA/AppData/pocketbase/pb_migrations` | `/pb_migrations` |
| `/DATA/AppData/pocketbase/pb_hooks`      | `/pb_hooks`      |

A kötetek ellenőrzése:

```sh
sudo docker inspect pocketbase --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Ha csak a `/pb_data` látszik, a migrációs parancs sikerétől függetlenül a hook még nem látható a futó konténerben. A CasaOS → PocketBase → Settings → Volumes alatt add hozzá a két hiányzó csatolást, mentsd, majd indítsd újra a PocketBase-t. A `/pocketbase/pb_hooks` helyett itt a **`/pb_hooks`** a helyes cél: PocketBase alapértelmezetten a `pb_data` mellett keresi ezt a mappát.

A hook betöltésének ellenőrzése bejelentkezés és jelszó nélkül:

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  https://pb.fairautoszervizkft.hu/api/fairauto/account/avatar-policy
```

**401**: a hook útvonala létezik és bejelentkezést kér; **404**: a hook útvonala nem érhető el. A migráció önmagában nem telepíti a hookot. A 401 után a weboldalon bejelentkezve ellenőrizhető a fájlmező és a megtekintési szabály készültsége.

A belépés és a regisztráció PocketBase beépített végpontjait használja, ezért működhet hiányzó hook mellett is. A helyes, meglévő `/pb_data` csatolást ilyenkor meg kell őrizni; a hiányzó `/pb_hooks` csatolást kell hozzáadni. A már sikeresen alkalmazott migrációt nem kell újra futtatni pusztán a hook 404-es válasza miatt.

## 2. Bemásolható migrációs parancs

A fájlok másolása és a kötetkapcsolatok ellenőrzése után ezt az egész blokkot futtasd. A meglévő `argonptg/pocketbase:0.26.6` image-et használja:

```sh
sudo test -s /DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js &&
sudo test -s /DATA/AppData/pocketbase/pb_migrations/1793491200_private_account_avatars.js &&
sudo test -s /DATA/AppData/pocketbase/pb_hooks/account.pb.js &&
sudo docker stop pocketbase &&
sudo docker run --rm --pull=never --network none \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_data,dst=/pb_data \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_migrations,dst=/pb_migrations,readonly \
  --entrypoint /pocketbase/pocketbase \
  argonptg/pocketbase:0.26.6 \
  migrate up --dir /pb_data --migrationsDir /pb_migrations &&
sudo docker start pocketbase
```

A migráció nem töröl meglévő képet vagy felhasználót. Az `avatar` beállítása: File, nem kötelező, egy fájl, **Protected = true**, max. 1 MiB tárolt fájl, engedélyezett típusok JPEG/PNG/WebP. A backend a feltöltött legfeljebb 2 MiB-os képet tömöríti, ezért az eredeti feltöltési és tárolási korlát különbözik. Az új hook bejelentkezéshez kötött ellenőrzést ad az alkalmazásnak. Ez a védett mezőt és a fiók/admin megtekintési szabályt is vizsgálja, és kizárólag a készültségi állapotot adja vissza.

Ne kapcsold ki a Protected opciót: a weboldal nem igényel nyilvános képfájlokat. A PocketBase-superuserhez a saját adminfelületén továbbra is teljes hozzáférés tartozik.

## 3. Korábbi felület működése (jelenleg eltávolítva)

A friss frontend telepítése után nyisd meg a Saját fiók oldalt, válassz JPG/PNG/WebP képet, nézd meg az előnézetet, majd kattints a **Kép mentése** gombra. A kép legfeljebb 2 MB és 20 megapixel lehet. A szerver tájoláskorrekció után 512 × 512 pixeles keretbe igazítja, WebP-re alakítja és eltávolítja a metaadatokat. A kiválasztott eredeti fájl nem kerül a böngésző localStorage-jába.

A kép újratöltés és másik eszközön történő belépés után is megmarad. A **Másik kép** választással cserélheted; az **Eltávolítás** gomb törli a jelenlegi profilképet. Az admin jogosult más felhasználók képét megtekinteni a fióklistában, más normál felhasználó nem. Minden képkéréshez a szerver ellenőrzi a munkamenetet és a szükséges jogosultságot. A fájltoken kizárólag a szerveren marad; a böngésző az alkalmazás saját, nem gyorsítótárazható képvégpontját használja.

A korábbi **„profilképkezelés beállítása folyamatban van”** üzenet hiányzó hook vagy eltérő mező-/megtekintési szabály esetén jelent meg. A jelenlegi felületen már nincs képfeltöltő és ilyen üzenet sem. API-kulcs vagy superuser-jelszó továbbra sem szükséges a frontendhez.

Az eredeti fájlméret, a dekódolható képméret és a kimenet mérete szerveroldalon korlátozott; SVG-t és nem képi tartalmat nem fogadunk el. A feltöltés és a képkérés folyamaton belüli korlátozást kap. Ez nem helyettesíti a dokumentált, megosztott/edge és PocketBase korlátozásokat a vállalati üzemeltetésben. A képek a PocketBase mentéseiben is szerepelhetnek; a mentések megőrzését az üzemeltetőnek kell szabályoznia.
