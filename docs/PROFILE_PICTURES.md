# Profilképek – a meglévő users.avatar mezővel

A profilkép feltöltése, előnézete, cseréje és eltávolítása a Saját fiók oldalon érhető el. A kép a fejlécben és a profilban jelenik meg; az admin a fióklistában is láthatja. Új collection nem szükséges: a meglévő `users.avatar` File mezőt használjuk, annak azonosítóját és meglévő fájljait megőrizve.

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

A CasaOS app kötetkapcsolatai:

| Host                                     | Konténer                    |
| ---------------------------------------- | --------------------------- |
| `/DATA/AppData/pocketbase/pb_data`       | `/pocketbase/pb_data`       |
| `/DATA/AppData/pocketbase/pb_migrations` | `/pocketbase/pb_migrations` |
| `/DATA/AppData/pocketbase/pb_hooks`      | `/pocketbase/pb_hooks`      |

A kötetek ellenőrzése:

```sh
sudo docker inspect pocketbase --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

## 2. Bemásolható migrációs parancs

A fájlok másolása és a kötetkapcsolatok ellenőrzése után ezt az egész blokkot futtasd. A meglévő `argonptg/pocketbase:0.26.6` image-et használja:

```sh
sudo test -s /DATA/AppData/pocketbase/pb_migrations/1793404800_account_management.js &&
sudo test -s /DATA/AppData/pocketbase/pb_migrations/1793491200_private_account_avatars.js &&
sudo test -s /DATA/AppData/pocketbase/pb_hooks/account.pb.js &&
sudo docker stop pocketbase &&
sudo docker run --rm --pull=never --network none \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_data,dst=/pocketbase/pb_data \
  --mount type=bind,src=/DATA/AppData/pocketbase/pb_migrations,dst=/pocketbase/pb_migrations,readonly \
  --entrypoint /pocketbase/pocketbase \
  argonptg/pocketbase:0.26.6 \
  migrate up --dir /pocketbase/pb_data --migrationsDir /pocketbase/pb_migrations &&
sudo docker start pocketbase
```

A migráció nem töröl meglévő képet vagy felhasználót. Az `avatar` beállítása: File, nem kötelező, egy fájl, **Protected = true**, max. 1 MiB tárolt fájl, engedélyezett típusok JPEG/PNG/WebP. A backend a feltöltött legfeljebb 2 MiB-os képet tömöríti, ezért az eredeti feltöltési és tárolási korlát különbözik. Az új hook bejelentkezéshez kötött ellenőrzést ad az alkalmazásnak. Ez a védett mezőt és a fiók/admin megtekintési szabályt is vizsgálja, és kizárólag a készültségi állapotot adja vissza.

Ne kapcsold ki a Protected opciót: a weboldal nem igényel nyilvános képfájlokat. A PocketBase-superuserhez a saját adminfelületén továbbra is teljes hozzáférés tartozik.

## 3. Használat és ellenőrzés

A friss frontend telepítése után nyisd meg a Saját fiók oldalt, válassz JPG/PNG/WebP képet, nézd meg az előnézetet, majd kattints a **Kép mentése** gombra. A kép legfeljebb 2 MB és 20 megapixel lehet. A szerver tájoláskorrekció után 512 × 512 pixeles keretbe igazítja, WebP-re alakítja és eltávolítja a metaadatokat. A kiválasztott eredeti fájl nem kerül a böngésző localStorage-jába.

A kép újratöltés és másik eszközön történő belépés után is megmarad. A **Másik kép** választással cserélheted; az **Eltávolítás** gomb törli a jelenlegi profilképet. Az admin jogosult más felhasználók képét megtekinteni a fióklistában, más normál felhasználó nem. Minden képkéréshez a szerver ellenőrzi a munkamenetet és a szükséges jogosultságot. A fájltoken kizárólag a szerveren marad; a böngésző az alkalmazás saját, nem gyorsítótárazható képvégpontját használja.

A **„profilképkezelés beállítása folyamatban van”** szövegnél ellenőrizd, hogy a migráció lefutott, az új hook valóban a konténerbe van csatolva, és a PocketBase újraindult. A többi fiókfunkció ettől tovább használható. API-kulcs vagy superuser-jelszó nem szükséges a frontendhez.

Az eredeti fájlméret, a dekódolható képméret és a kimenet mérete szerveroldalon korlátozott; SVG-t és nem képi tartalmat nem fogadunk el. A feltöltés és a képkérés folyamaton belüli korlátozást kap. Ez nem helyettesíti a dokumentált, megosztott/edge és PocketBase korlátozásokat a vállalati üzemeltetésben. A képek a PocketBase mentéseiben is szerepelhetnek; a mentések megőrzését az üzemeltetőnek kell szabályoznia.
