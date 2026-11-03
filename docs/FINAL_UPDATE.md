# Frissítés a végső tesztelés előtt

**Aktuális kiadás:** meglévő telepítés frissítéséhez a [biztonsági frissítés teljes eljárását](./SECURITY_UPDATE.md) használd. Az alábbi bemásolható blokk ugyanezt a teljes frissítőt használja, beleértve a hiányzó migrációkat és az új biztonsági szabályokat.

A változat tartalmazza a megadott két dokumentum webes és szerkeszthető Word-változatát, az e-mailes fiókkezelést és a vendégadatok törlését. A közös dokumentumverzió **`2026-11-03.1`**. A már működő céges SMTP-feladót és jelszavát a frissítés megőrzi; új API-kulcs vagy Vercel-secret nem kell.

## A meglévő CasaOS PocketBase frissítése

A telepítésed már PocketBase 0.40.6-ot futtat. A teljes aktuális frissítő 0.40.6-on tartja a binárist, és telepíti az új biztonsági és privát dokumentumfeltöltési migrációkat, a még hiányzó négy e-mail-/adatmegőrzési migrációt és az összes hozzájuk tartozó hookot. Ellenőrzött offline mentést készít a módosítások előtt, megőrzi a működő SMTP-beállításokat, és ellenőrzi az új backend készenlétét. A korábbi fiók-, jármű- és időpontkezelő alapséma előfeltétel.

A Debian/Ubuntu alapú CasaOS gép host termináljába másold be az egész blokkot. Semmit nem kell benne átírnod:

```bash
sudo apt-get update &&
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y bash ca-certificates coreutils curl tar unzip tzdata &&
sudo curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 120 https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/57b6a2c9fbe834f4005d174a02e1f65dbc9b990b/scripts/update-pocketbase-security.sh -o /root/fairauto-security-update.sh &&
printf '%s  %s\n' '02901801b25c2c3e9d6de43892e6f39e6709a2ec17e9e52940d1931852eafaca' '/root/fairauto-security-update.sh' | sudo sha256sum -c - &&
sudo bash /root/fairauto-security-update.sh 57b6a2c9fbe834f4005d174a02e1f65dbc9b990b &&
sudo docker exec pocketbase /pocketbase/pocketbase --version &&
sudo docker exec pocketbase /bin/sh -c 'wget -qO- http://127.0.0.1:8090/api/fairauto/security-policy'
```

Ez ugyanaz a rögzített és ellenőrzött blokk, mint a [biztonsági frissítés útmutatójában](./SECURITY_UPDATE.md#copy-paste-installation-on-the-casaos-host). Külön `migrate up` vagy újraindítás nem kell. Az ellenőrző összegnél `OK`, a végén `pocketbase version 0.40.6` és `"ready":true`, `"version":1` jelzi a sikert. A pontos mentési útvonalat a frissítő kiírja; töltsd le külön gépre.

A meglévő `pocketbase` konténert és a valódi `/pocketbase/pb_data` adatbázist használja. A konténert, köteteket és indítási útvonalat megtartja. Frissítés után jelentkezz be újra a weboldalon. A regisztrált felhasználók, jelszavak, szerepek, letiltások és védett admin megmaradnak.

A migráció önmagában nem töröl időpontot. Az újraindítás után a percenkénti feladat már törölheti a bizonyíthatóan legalább 30 napja lezárt vendégkéréseket; az ismeretlen lezárási idejű régi vendégkérések friss türelmi időt kapnak. Az éles üzemhez még szükséges [külön szolgáltatói és üzemeltetési beállításokat](./SECURITY_UPDATE.md#server-side-work-before-public-operation) a frissítő nem helyettesíti.

## Mit állít be a fiókmigráció?

- Új nyilvános regisztráció kizárólag `partner`, kötelező cégnévvel és adószámmal; belépés előtt e-mail-megerősítés szükséges. A címigazolás nem ad admin-, vezetői vagy munkafelvevői szerepet.
- Új, webes adminfelületen létrehozott munkatársi fiók is megerősítő levelet kap. A szerepét továbbra az admin állítja be. E-mail-igazolás előtt nem kerül a belső időpontértesítések új címzettjei közé.
- A régi fiók hozzáférése megmarad anélkül, hogy a migráció igazoltnak jelölné a címét. A profilban kérhető megerősítő levél. A `verified` és az `emailVerificationRequired` mezőt az ügyfél nem kapcsolhatja át.
- Beállítja a magyar megerősítő, jelszó-visszaállító és e-mail-cím-változtatási sablonokat. A levélben a `https://fairwebserviceclient.vercel.app/fiok-muvelet#...` alkalmazásoldal nyílik meg. Az aktuális SMTP-feladó és hitelesítés megmarad.
- A címigazolási hivatkozás 24 óráig, a jelszó-visszaállítási és címváltoztatási hivatkozás 30 percig érvényes. Megnyitásuk önmagában nem módosít adatot; a felhasználónak meg kell erősítenie a műveletet.
- Saját e-mail-cím változtatásához jelszó és az új címen kapott link kell. Adminisztrátor másik fiók címét javíthatja; az új címet ekkor ismét igazolni kell. Jelszó-visszaállítás után a korábbi jelszó és munkamenetek érvényüket vesztik.

Saját frontenddomainre költözéskor a PocketBase **Settings → Application / App URL** értékét és a Vercel `AUTH_APP_ORIGIN` változóját ugyanarra a HTTPS-originre állítsd. A sablonok a PocketBase `{APP_URL}` helyőrzőjét használják. Superuser-jelszót a webalkalmazás továbbra sem használ.

## A törlés pontos köre

Kizárólag eredetileg vendég által indított, fiókhoz nem tartozó, `completed` vagy `cancelled` állapotú kérés jogosult törlésre a rögzített `closedAt` után 30 nappal. A tranzakció az előzményeket és e-mail-sori adatmásolatokat is törli. Egyszerre legfeljebb 100 tételt kezel; élő e-mail-átadási zárolásnál későbbi futásra hagyja a kérést.

Nem érinti a nyitott ügyeket, a fiókos foglalásokat, a fióktörlés után hátramaradt korábbi fiókos kérést vagy a munkatársi telefonos ügyfélfelvételt. A 120 napos böngészős hozzáférési süti nem hosszabbítja meg a lezárt vendégadat megőrzését. A külső postaládák, biztonsági mentések és külön szerviz-/számviteli iratok megőrzését az üzemeltető külön rendezi.

## Kézi végső próba

1. Inkognitóban regisztrálj saját tesztcéggel és saját e-mail-címmel. Megerősítés előtt ne engedjen belépni; a levél megnyitása után a Megerősítés gombbal igazolj, majd lépj be. Céges partner szerepet kell kapnod.
2. Próbálj új megerősítő levelet és elfelejtett jelszót kérni. Jelszó-visszaállítás után a régi jelszóval ne lehessen belépni. E-mail-változtatásnál a cím csak a megerősítéskor változzon meg.
3. A Partnerközpont / Járműpark alatt ments VIN-es autót. Egyetlen autó foglaláskor automatikusan kitöltődik; több autónál választó jelenik meg. Új vendégűrlap legyen üres.
4. Kérj időpontot; munkafelvevővel vagy vezetővel telefonos visszaigazolást rögzíts, majd adj bruttó árat vagy tételeket. A partner ugyanazt a részletezést lássa, szerkesztés nélkül. Ellenőrizd a saját és a kijelölt munkatárs postafiókját.
5. A műszaki vizsga kártyája csak a két telefonszámot kínálja; gumiszerviz nincs. Ellenőrizd a két új dokumentumot a láblécben és a TXT/Word letöltéseket mobilon is.

A lezárt tesztvendég határidejének visszaállítását éles adatbázisban ne használd próbának. A 30 napos határ, cascád törlés és párhuzamos levélküldés eseteit elkülönített tesztadatbázis ellenőrzi.
