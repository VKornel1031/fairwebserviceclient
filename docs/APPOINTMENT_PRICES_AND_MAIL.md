# Automatikus kitöltés, járműválasztás, alvázszám, árak és levelezés

## Frissítés

A már működő időpontkezeléshez az új **`1793512800_prices_vin_and_mail.js`** migráció és a friss foglalási hookok szükségesek. Az [APPOINTMENTS.md](./APPOINTMENTS.md) két másolható blokkját futtasd: a korábban alkalmazott migráció kimarad, az új az aktív `/pocketbase/pb_data` adatbázisba kerül. A meglévő konténer és járműadatok megmaradnak. API-kulcs vagy új Vercel-változó nem kell.

A friss `content/booking.json` is szükséges: a tájékoztatók közös verziója `2026-11-01.4-draft`. Levelezés alapból ki van kapcsolva; az árkezelés ettől függetlenül működik.

## Admin automatikus kitöltés és levelezési állapot javítása

A korábbi változat az admin/vezető/munkafelvevő szerepeket ügyfélfelvételnek tekintette, ezért a saját adatokat szándékosan üresen hagyta. A javítás ezeket a fiókokat is kitölti; a külön ügyfélfelvétel választható marad. Ehhez a frontend frissítésén kívül a három hookfájlt is frissítsd. **Új migráció nincs**, a korábbi VIN/ár migráció továbbra szükséges. A meglévő `fairauto-mail.json` beállítást a következő blokk nem írja felül.

```sh
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-appointments.js \
  -o /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-mail.js \
  -o /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/appointments.pb.js \
  -o /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js pocketbase:/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js pocketbase:/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js pocketbase:/pocketbase/pb_hooks/appointments.pb.js &&
sudo docker restart pocketbase
```

Az Adminisztráció oldalon az **E-mail értesítések állapota** lenyitható rész megmutatja a kapcsolót, ütemezőt, darabszámokat és a legutóbbi hiba típusát. Címeket, levéltörzset és jelszavakat nem ad vissza. Az admin a kapcsolat javítása után a **Sikertelen küldések újrapróbálása** gombbal legfeljebb 100 hibás átadású feladatot visszatehet a sorba. A korábban sikeresen átadott leveleket, aktívan küldött feladatokat és megszűnt munkatársi hozzáférés miatt kihagyott címzetteket nem indítja újra. Az újrapróbálás sorba állít; a következő worker-futás küld.

## Kitöltés

- Minden bejelentkezett szerepkör – az admin, vezető és munkafelvevő is – alapból a saját adataival foglal: az aktuális fiók név-, e-mail-, telefon- és településadatait a szerver a foglaló indításakor adja át.
- Egyetlen mentett autó esetén az autó automatikusan kitöltődik.
- Több autó esetén a foglaló választást kér; a választó kereshető és lapozható. Kézzel másik autó adatai is megadhatók.
- Új vendégfoglalás üres kapcsolattartási és járműmezőkkel indul; egy sikeres vendégfoglalás után a Másik időpontot kérek is üríti ezeket. A böngészőnek `autocomplete=off` jelzést adunk, de saját jelszókezelője vagy automatikuskitöltés-bővítménye ettől még felajánlhat adatot.
- Meglévő kérés átütemezése a korábban rögzített adatmásolatot mutatja, vendégként is. A munkatárs az „Ügyfélnek foglalok” kapcsolóval válthat üres ügyfélűrlapra. A Munkafelvétel / Műhely „Új időpont felvétele” gombja eleve ezt nyitja meg. A saját foglalás a saját fiókhoz kerül; ügyfélfelvételt nem rendelünk automatikusan az adott munkatárs fiókjához.

## Alvázszám (VIN)

A Járműveim / Járműpark mentési és szerkesztési űrlapján alvázszám is megadható. Meglévő autóknál később is kitölthető; a migráció nem töröl vagy talál ki adatot. A mentett VIN a járműválasztással kitöltődik. A járművek között VIN-re is lehet keresni.

Új időpontkérésnél **vendégként és fiókkal is kötelező a 17 karakteres VIN**, I/O/Q betű nélkül. A megadott értéket nagybetűsítjük; nem alkalmazunk csak amerikai autókra érvényes ellenőrzőszám-szabályt. VIN nélküli régi mentett autónál add hozzá a garázsban, vagy töltsd ki a foglalóban; a foglaló kézi módosítása önmagában nem írja át a mentett autót. Korábbi időpontok VIN nélkül is megnyithatók; új időpont kérésekor ki kell egészíteni őket.

Az alvázszám az időpont privát járműmásolatában, részleteiben, engedélyezett szolgáltatási értesítésében és exportjában szerepel. Más ügyfél nem keresheti vagy olvashatja a saját hozzáférésén kívüli autót.

## Ár rögzítése

A munkafelvevő, vezető és admin a visszaigazolt, folyamatban lévő vagy elkészült időpont részleteinél választhatja az **Ár hozzáadása / Ár módosítása** gombot. Telefonos megerősítés előtt vagy lemondott időpontnál nincs árírás.

- **Egy összeg:** teljes, bruttó forintérték.
- **Tételes részletezés:** alkatrész, munkadíj vagy egyéb tétel; megnevezés, egész mennyiség és bruttó egységár. A teljes összeget a szerver számolja; kliens által küldött összesítést nem fogad el.
- Opcionális megjegyzés, frissítési idő és állapotelőzmény tartozik az árhoz. Legfeljebb 30 tétel, tételenként 1–1000 mennyiség, összesen legfeljebb 1 milliárd Ft adható meg. Tört forintot és negatív összeget nem fogadunk el.
- Az ügyfél, partner vagy jogosult vendég saját időpontja részleteiben ugyanazt a bontást látja, szerkesztés nélkül.
- Párhuzamos szerkesztésnél változatszám védi az adatokat. Változatlan összeg ismételt mentése nem hoz létre új előzményt vagy értesítést.
- Átütemezéskor a korábbi árbecslés és a telefonos visszaigazolás törlődik az aktuális kérésből; az előzmény megmarad. Új időpontot és árat ismét egyeztetni kell.

A megjelenített összeg **tájékoztató bruttó árbecslés**, nem számla vagy automatikusan elfogadott javítási ajánlat. A munkát és végleges díját külön kell egyeztetni. Az ÁSZF és adatkezelési szöveg továbbra szerkeszthető minta, kitöltendő cég- és megőrzési adatokkal.

## Opcionális e-mail

A `fairauto-mail.json` a PocketBase hookmappájában található helyi beállítás; mintája a repó [`pocketbase/mail.example.json`](../pocketbase/mail.example.json) fájlja. Titok nem kell bele. A feladó név/cím és esetleges SMTP-hitelesítés a PocketBase Mail settings része. A `newMailClient()` SMTP kikapcsolásakor Unix `sendmail` klienst választ.

A felhasználónál már működő host Sendmail és a konténer localhost-eltérésének javítása: **[LOCAL_SENDMAIL.md](./LOCAL_SENDMAIL.md)**. A javítás nem küld levelet. Előbb a PocketBase saját tesztjével, saját postafiókba ellenőrizd a tényleges beérkezést.

Ezután a CasaOS hoston:

```sh
sudo docker cp \
  pocketbase:/pocketbase/pb_hooks/fairauto-mail.json \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.json &&
sudo nano /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.json
```

Állítsd az `enabled` értékét `true`-ra. Az `appUrl`, műhelycím és telefonszám legyen helyes. A `staffRoles` alapból `manager` és `reception`: az ilyen szerepű, aktív normál fiókok e-mail-címére mennek a belső értesítések, legfeljebb 100 fióknak. A címek valódiságát az üzemeltető ellenőrizze, mert a regisztráció még nem igazol e-mailt. Az `admin` csak akkor legyen a listában, ha az adminoknak is kell értesítés. Ne módosíts szerepkört csak azért, hogy valaki levelet kapjon, ha az adott szerep jogosultságai nem indokoltak.

Mentés után:

```sh
sudo docker cp \
  /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.json \
  pocketbase:/pocketbase/pb_hooks/fairauto-mail.json &&
sudo docker restart pocketbase
```

A bekapcsolástól kezdve a kérés, telefonos visszaigazolás, átütemezés, lemondás, árváltozás és elkészült munka külön szolgáltatási értesítést hoz létre a kapcsolattartónak és az aktív kijelölt munkatársaknak. A korábbi eseményeket nem küldi újra visszamenőleg. A munkatársi címet és aktív jogosultságot küldés előtt újraellenőrzi; megszűnt jogosultságnál nem küldi el a várakozó levelet. A címzettek külön levelet kapnak; a munkatársak címei nem kerülnek az ügyfél levelébe. A partner kapcsolattartója az időpontban tárolt címen kap levelet.

A szolgáltatási levél tartalmazza az azonosítót, időpontot, szolgáltatást, kontakt- és autóadatokat, opcionális céget, megjegyzést, árbontást és műhelyelérhetőséget. A kérés átvételét és a telefonos megerősítést elkülöníti. Hozzáférési titkot nem küld e-mailben; a vendég saját böngészőjében kezeli a kérését. Nincs webes e-mail-előnézeti postafiók, marketinglevél, aktiváló levél vagy új jelszó-visszaállítási folyamat.

### Küldési állapotok

Az esemény és címzettenkénti `appointment_mail` feladat együtt, tranzakcióban jön létre. A percenként futó worker legfeljebb 5 feladatot vesz fel futásonként. Transporthiba az időpontot nem törli: alapból legfeljebb 5 próbálkozás történik, növekvő várakozással. A küldés a foglalási tranzakción kívül fut. A feladatok nem érhetők el a nyilvános rekord API-n; a PocketBase superuser a kollekcióban láthatja az állapotot.

- `pending`: küldésre vagy újrapróbálkozásra vár.
- `processing`: a worker lefoglalta, legfeljebb 15 perces zárolással.
- `sent`: a beállított levélkliens sikeresen átvette; **nem bizonyítja, hogy a címzett postaládájába megérkezett**. Sendmail esetén a további kézbesítést a host MTA végzi.
- `failed`: elfogyott a próbálkozásszám, vagy a címzett munkatársi adatai/jogosultságai megváltoztak; a levélkiszolgálót és konfigurációt ellenőrizni kell. A hibakód nem tárol levéltörzset vagy hitelesítő adatot.

Az esemény/címzett egyedi kulcsa megakadályozza, hogy ismételt kattintás új feladatot hozzon létre. Ha a folyamat közvetlenül a tényleges átadás után, az állapot mentése előtt leáll, újrapróbálkozáskor lehetséges ismételt levél: a külső kézbesítésre nem állítunk pontosan egyszeri garanciát. A küldési sor adatmásolatokat tartalmaz; megőrzését és törlését az üzemeltetőnek rendeznie kell.

Kikapcsoláshoz `enabled: false`, ugyanaz a bemásolás és újraindítás szükséges. Ez új feladatokat sem hoz létre, és a meglévőket sem küldi; ismételt bekapcsoláskor a megmaradt várakozó feladatok folytatódnak. Az SMTP/Sendmail beállítása önmagában nem kapcsolja be ezt a kapcsolót.
