# Frissítés a végső tesztelés előtt

**Aktuális kiadás:** meglévő telepítés frissítéséhez a [biztonsági frissítés teljes eljárását](./SECURITY_UPDATE.md) használd. Az az alábbi, még hiányzó migrációkat is tartalmazza, valamint a friss hookokhoz szükséges új biztonsági migrációt. Az itt megőrzött korábbi részleges parancsblokk önmagában már nem telepíti a teljes aktuális backendet.

A változat tartalmazza a megadott két dokumentum webes és szerkeszthető Word-változatát, az e-mailes fiókkezelést és a vendégadatok törlését. A közös dokumentumverzió **`2026-11-01.6-draft`**. A már működő céges SMTP-feladót és jelszavát a frissítés megőrzi; új API-kulcs vagy Vercel-secret nem kell.

## A meglévő CasaOS PocketBase frissítése

Előbb készíts és tölts le mentést a PocketBase adminfelületén. A következő blokk a már működő `pocketbase` konténert és a tényleges **`/pocketbase/pb_data`** adatbázist használja; kötetet és indítási útvonalat nem változtat. Négy új migrációt alkalmaz, majd bemásolja a hozzájuk tartozó hookokat. A migráció önmagában nem töröl időpontot. Az újraindítás után a percenkénti feladat már törölheti a bizonyíthatóan legalább 30 napja lezárt vendégkéréseket; az ismeretlen lezárási idejű régi vendégkérések friss türelmi időt kapnak.

Másold be ezt az egész blokkot:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations /DATA/AppData/pocketbase/pb_hooks &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793541600_guest_retention.js -o /DATA/AppData/pocketbase/pb_migrations/1793541600_guest_retention.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793545200_email_verification.js -o /DATA/AppData/pocketbase/pb_migrations/1793545200_email_verification.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793548800_email_website_logo.js -o /DATA/AppData/pocketbase/pb_migrations/1793548800_email_website_logo.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793552400_email_portal_caption.js -o /DATA/AppData/pocketbase/pb_migrations/1793552400_email_portal_caption.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/content/booking.json -o /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-retention.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-retention.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-appointments.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/appointments.pb.js -o /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-mail.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/account.pb.js -o /DATA/AppData/pocketbase/pb_hooks/account.pb.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/company-accounts.pb.js -o /DATA/AppData/pocketbase/pb_hooks/company-accounts.pb.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/email-verification.pb.js -o /DATA/AppData/pocketbase/pb_hooks/email-verification.pb.js &&
sudo docker exec pocketbase mkdir -p /pocketbase/fairauto_final_migrations /pocketbase/pb_hooks &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793541600_guest_retention.js pocketbase:/pocketbase/fairauto_final_migrations/1793541600_guest_retention.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793545200_email_verification.js pocketbase:/pocketbase/fairauto_final_migrations/1793545200_email_verification.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793548800_email_website_logo.js pocketbase:/pocketbase/fairauto_final_migrations/1793548800_email_website_logo.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793552400_email_portal_caption.js pocketbase:/pocketbase/fairauto_final_migrations/1793552400_email_portal_caption.js &&
sudo docker exec pocketbase /pocketbase/pocketbase migrate up --dev=false --dir /pocketbase/pb_data --migrationsDir /pocketbase/fairauto_final_migrations &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json pocketbase:/pocketbase/pb_hooks/fairauto-booking.json &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-retention.js pocketbase:/pocketbase/pb_hooks/fairauto-retention.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js pocketbase:/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/appointments.pb.js pocketbase:/pocketbase/pb_hooks/appointments.pb.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js pocketbase:/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/account.pb.js pocketbase:/pocketbase/pb_hooks/account.pb.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/company-accounts.pb.js pocketbase:/pocketbase/pb_hooks/company-accounts.pb.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/email-verification.pb.js pocketbase:/pocketbase/pb_hooks/email-verification.pb.js &&
sudo docker restart pocketbase
```

Privát repó 404-es raw linkjénél a saját GitHub-hozzáféréseddel töltsd le ezeket a fájlokat a megadott hostmappákba, majd a `docker` parancsoktól folytasd. Ne írj GitHub-, SMTP- vagy PocketBase-jelszót a parancsba vagy csevegésbe.

A weboldal új verzióját és a backendfrissítést együtt használd. A dokumentumverzió eltérésénél a foglalás beállítási hibát jelez. A PocketBase az auth szabály módosításakor visszavonhat korábbi munkameneteket: frissítés után jelentkezz be újra. A meglévő jelszavak, szerepek, letiltások és védett admin megmaradnak.

A levelek a weboldal saját PNG-logóját használják. Ha a korábbi, kétmigrációs frissítést már elvégezted, elegendő a rövid [logófrissítés](./EMAIL_LOGO.md).

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
