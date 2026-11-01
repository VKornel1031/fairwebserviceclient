# Időpontkérések – a meglévő CasaOS PocketBase bekötése

A műszaki vizsga kizárólag telefonon egyeztethető, gumiszerviz nincs a kínálatban. A jelenlegi szolgáltatáslista és a már működő backend háromfájlos frissítése: [SERVICE_BOOKING.md](./SERVICE_BOOKING.md).

A foglaló a PocketBase-ben menti a vendég-, magánügyfél- és partnerkéréseket. A fiókadatok kitöltődnek; egy mentett autó automatikusan kitöltődik, több autó esetén választani kell. A vendég új foglalási űrlapja üres. A munkafelvevő, vezető és admin telefonos visszaigazolást rögzíthet. **A kapacitást csak a telefonos visszaigazolás foglalja le.** Több függő kérés érkezhet ugyanarra az időre, de a megerősítés tranzakcióban újraellenőrzi a férőhelyet.

**Új frissítés:** automatikus kitöltés és járműválasztás, mentett és foglaláskor kötelező alvázszám (VIN), megerősítés utáni bruttó ár és tételes alkatrész/munkadíj, opcionális e-mail-feladatsor. Részletek és bekapcsolás: [APPOINTMENT_PRICES_AND_MAIL.md](./APPOINTMENT_PRICES_AND_MAIL.md). Korábbi időponttelepítés után is futtatható az alábbi két blokk: a régi migrációt kihagyja, az új `1793512800_prices_vin_and_mail.js` fájlt alkalmazza.

Ez a telepítés a már működő fiók- és járműmigrációra épül. Nem kell kézzel kollekciót létrehozni, új API-kulcsot megadni vagy Vercel-környezeti változót módosítani. Az opcionális levélküldés alapértelmezetten ki van kapcsolva, amíg a saját levelezés tesztelése és bekapcsolása meg nem történik.

## 1. Fájlok letöltése

Előbb készíts és tölts le mentést a PocketBase adminfelületéről. A CasaOS gépen másold be ezt a teljes blokkot:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations /DATA/AppData/pocketbase/pb_hooks &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793502000_appointments.js \
  --output /DATA/AppData/pocketbase/pb_migrations/1793502000_appointments.js &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/content/booking.json \
  --output /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-appointments.js \
  --output /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/appointments.pb.js \
  --output /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793512800_prices_vin_and_mail.js \
  --output /DATA/AppData/pocketbase/pb_migrations/1793512800_prices_vin_and_mail.js &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-mail.js \
  --output /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/mail.example.json \
  --output /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.example.json
```

A hét fájl legyen a weboldallal azonos Git-verzióból. Privát repónál a bejelentkezés nélküli raw GitHub-letöltés 404-et ad; ilyenkor a [CasaOS útmutató autentikált letöltését](./CASAOS_POCKETBASE.md) használd ugyanezekkel a fájlnevekkel. A repó láthatóságát ez az útmutató nem módosítja.

## 2. Telepítés a jelenlegi konténerbe

Az ismert konténer neve **`pocketbase`**, a binárisa **`/pocketbase/pocketbase`**, az aktív adatkönyvtára **`/pocketbase/pb_data`**. A `/pb_data` másik könyvtár: most is a már működő aktív adatbázist használjuk. A konténer maradjon elindítva. Másold be a teljes blokkot:

```sh
sudo docker exec pocketbase mkdir -p /pocketbase/fairauto_appointment_migrations /pocketbase/pb_hooks /usr/share/zoneinfo/Europe &&
sudo docker cp -L \
  /usr/share/zoneinfo/Europe/Budapest \
  pocketbase:/usr/share/zoneinfo/Europe/Budapest &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_migrations/1793502000_appointments.js \
  pocketbase:/pocketbase/fairauto_appointment_migrations/1793502000_appointments.js &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_migrations/1793512800_prices_vin_and_mail.js \
  pocketbase:/pocketbase/fairauto_appointment_migrations/1793512800_prices_vin_and_mail.js &&
sudo docker exec pocketbase /pocketbase/pocketbase migrate up \
  --dev=false \
  --dir /pocketbase/pb_data \
  --migrationsDir /pocketbase/fairauto_appointment_migrations &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json \
  pocketbase:/pocketbase/pb_hooks/fairauto-booking.json &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js \
  pocketbase:/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js \
  pocketbase:/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.example.json \
  pocketbase:/pocketbase/pb_hooks/fairauto-mail.example.json &&
sudo docker exec pocketbase sh -c 'test -e /pocketbase/pb_hooks/fairauto-mail.json || cp /pocketbase/pb_hooks/fairauto-mail.example.json /pocketbase/pb_hooks/fairauto-mail.json' &&
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js \
  pocketbase:/pocketbase/pb_hooks/appointments.pb.js &&
sudo docker restart pocketbase
```

Első alkalmazáskor `Applied 1793502000_appointments.js` és `Applied 1793512800_prices_vin_and_mail.js` várható; korábban működő időpontkezelésnél csak az új migráció kerül alkalmazásra. A meglévő `fairauto-mail.json` beállítást a blokk nem írja felül, új telepítésnél kikapcsolt mintából indul. Ismételt alkalmazáskor a `No new migrations to apply` helyes, ha ezt a blokkot a fenti aktív könyvtárral futtatod. A végén az újraindítás betölti az útvonalakat és a friss kollekciókat. Az `&&` megállítja a további lépéseket, ha valamelyik parancs hibázik.

A telepítés a meglévő konténert, adatbázist, köteteket, portokat, Tunnel-útvonalat és Vercel PocketBase URL-t használja. Az új hookok a JavaScript-képes PocketBase **0.26.3 és 0.26.6** kiadással teszteltek. A régi `account.pb.js` hook nem előfeltétele a foglalásnak; a most bemásolt foglalási és levelezési fájlok szükségesek a `/pocketbase/pb_hooks` mappában.

A blokk a CasaOS/Debian gép Budapest-időzónafájlját is bemásolja a konténerbe. Ez az alkalmazás adatait nem mozgatja: a minimális Alpine-képhez szükséges téli/nyári időszámítási adatot biztosítja. A hook ellenőrzi az időzónát, és hiányzó adatnál nem számol csendben UTC szerint.

Az aktív adatmappa jelenleg a konténer belső tárhelyén van. Konténercsere vagy újralétrehozás előtt tölts le külön PocketBase-mentést; ez az eljárás nem változtatja meg a tárolási elrendezést.

## 3. Kipróbálás

A GitHub-frissítés Vercel-telepítése és a fenti telepítés után:

1. Jelentkezz be ügyfélként, és nyisd meg az Időpontfoglalás oldalt. A kapcsolattartási adatok kitöltődnek; egy mentett autó automatikus, többnél választani kell.
2. Küldj be egy kérést. A `FA-…` azonosítójú kérés a Foglalásaim oldalon és a PocketBase `appointments` kollekciójában is megjelenik.
3. Munkafelvevőként a Telefonos egyeztetésre vár listából nyisd meg, majd a telefonos megbeszélés után válaszd a Visszaigazolás gombot. Ez biztosítja a kapacitást; ha közben betelt, másik időpontot kell egyeztetni.
4. Vezetőként vagy adminként a Műhely oldalon indítható és befejezhető a munka. Az ügyfél a saját listájában látja az állapotot.
5. Vendégként is kérhető időpont. A hozzáférést az adott böngésző HttpOnly sütije biztosítja; másik böngészőből vagy a sütik törlése után a vendégkérés nem nyitható meg. Ilyenkor telefonon kell egyeztetni a szervizzel. A vendégkérés nem kerül automatikusan később létrehozott fiókhoz.

A saját jövőbeli, egyeztetésre váró vagy visszaigazolt kérés lemondható és átütemezhető. **Átütemezés után ismét telefonos visszaigazolás szükséges**, a korábbi foglalás felszabadul. A munkafelvevő is átütemezhet; munkaindítás, befejezés, zárvatartás és összesített riport vezető/admin feladat. A vezetői grafikonok valós adatbázis-összesítést használnak; a CSV a jelzett aktuális listaoldalt exportálja.

## Szerkeszthető beállítások

A közös forrás: [`content/booking.json`](../content/booking.json). Ebben találhatók a szolgáltatások, becsült időtartamok, opcionális `priceLabel` árfeliratok, nyitvatartás, kapacitás, idősávköz és foglalási horizont. Ár nincs kitalálva: az üres `priceLabel` nem jelenít meg árat. A megjelenített ár a külön egyeztetendő végleges javítási díjat nem helyettesíti.

Módosításkor **a weboldalt újra kell telepíteni, és ugyanazt a JSON-t `fairauto-booking.json` néven be kell másolni a konténer hookmappájába, majd újraindítani a PocketBase-t**. A szolgáltatás azonosítóját ne változtasd névváltoztatáskor. A korábbi kérések saját szolgáltatás-, ár-, jármű- és kapcsolattartási másolatukat őrzik. A `termsVersion` a webes és szerveroldali feltételverzió közös forrása; eltéréskor új kérés nem indítható. A nyitvatartás feliratát a `content/site.ts` fájlban is igazítsd.

A `reservationPolicy` maradjon `phone-confirmation`, az időzóna `Europe/Budapest`. Alapbeállítás: 2 párhuzamos autó, hétfő–péntek 06:00–17:00, 90 napos horizont, 60 perces kezdési idősávok. A 90 perces szolgáltatás a teljes időtartamára foglal kapacitást. A lezárt napok nem kérhetők; meglévő kéréseket a nap lezárása nem mond le automatikusan, az érintettekkel a szerviznek egyeztetnie kell.

## Adatok és jogosultságok

- `appointment_mail`: alapból kikapcsolt, privát szolgáltatási értesítési feladatsor.
- `appointments`: bruttó ár/árbontás, tulajdonos vagy vendég-hozzáférés, szolgáltatás és időpont, adatmásolatok, állapot, feltételverzió, szerveridő, változatszám és telefonos megerősítés.
- `appointment_events`: változások és munkatársi műveletek sorrendje. Az ügyfél saját előzményében nem kapja meg a munkatárs nevét vagy azonosítóját.
- `appointment_closures`: vezető/admin által lezárt napok.
- `appointment_limits`: rövid életű, hash-elt kéréskorlátozási számlálók; lejárt sorokat a következő kérés töröl.

A közvetlen PocketBase-rekord API-n mind az öt kollekció **írása zárolt**. Ne tedd nyilvánossá az írási szabályokat: a hookok ellenőrzik a tulajdonost, az aktuális aktív szerepkört, az állapotváltást és a kapacitást egy tranzakción belül. A vendéghozzáférés titka nem kerül URL-be, JavaScriptbe, localStorage-ba vagy a rekord nyilvános mezőibe. A böngészőben nincs helyi foglalási adatbázis, és a régi demóadatokat nem importáljuk.

Az ismételt elküldés azonos kérésazonosítóval nem hoz létre második időpontot. Az ütköző módosításokat változatszám védi. A munkafelvevő által felvett telefonos ügyfélkérés nem rendelődik hozzá automatikusan egy e-mail alapján megtalált fiókhoz. Fiók- vagy autótörlés a történeti adatmásolatokat nem törli; az üzemeltetőnek ezek célját, jogalapját, megőrzését és törlési ügyintézését rendeznie kell a szerkeszthető jogi dokumentumokban.

Vendégként azonos e-mail/telefon pároshoz legfeljebb 3, fiókkal 20 jövőbeli függő vagy visszaigazolt kérés engedélyezett; a munkatársi felvétel kivétel. A natív hookok adatbázisban vezetett percenkénti korlátot alkalmaznak (120 írás, 1200 olvasás a PocketBase által látott IP-re), a webes API külön korlátoz. Fordított proxy mögött ez közös kimenő IP is lehet. A vendég e-mailje nincs ellenőrizve, és a korlátok nem helyettesítik az edge-védelmet. A függő kérések ezért sem foglalnak kapacitást.

A vendég hozzáférési süti és a rekordhoz tartozó jogosultság alapból 120 napra szól; ez hozzáférési idő, nem az adatbázis automatikus törlési határideje. Az opcionális értesítések a PocketBase levélkliensét használják; alapból kikapcsoltak. A helyi Unix sendmail javítása: [LOCAL_SENDMAIL.md](./LOCAL_SENDMAIL.md). E-mail-ellenőrzés, e-mailes hozzáférés-helyreállítás és javítási szerződéskötés továbbra nincs bekötve.
