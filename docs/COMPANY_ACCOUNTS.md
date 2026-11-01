# Céges regisztráció, négy szerepkör

Nyilvánosan csak **cégnévvel és magyar adószámmal** lehet fiókot létrehozni. Az új fiók `partner`; nincs nyilvános szerepkörválasztás. Az adószám formátuma `12345678-2-19`; ez formátumellenőrzés, nem NAV-lekérdezés vagy képviseleti jogosultság igazolása. Magánszemélyek továbbra vendégként kérhetnek időpontot.

A megmaradó szerepek: `partner`, `reception`, `manager`, `admin`. A munkatársi fiókokat az admin hozza létre, nekik nem kell cégnév vagy adószám. A partner céges adatait nem lehet üresre menteni. A szabály a Next szerver és a PocketBase natív rekord API felől is érvényesül.

A migráció a korábbi `customer` rekordokat `partner` szerepbe teszi. **Nem töröl fiókot, autót vagy időpontot**, nem cserél azonosítókat vagy jelszavakat, és nem aktivál tiltott fiókot. A régi, céges adatok nélküli fiók továbbra beléphet és kezelheti korábbi adatait. Céges adatainak következő módosításakor a nevet és az adószámot ki kell egészíteni. A meglévő belső szerepek és adminvédelem megmaradnak. A régi `partnerRequested` adatbázismező adatmegőrzésből megmarad, a felület és API nem használja.

## Frissítés a meglévő CasaOS-konténerben

Előbb készíts letölthető mentést a PocketBase adminfelületén. A parancsok a már használt `pocketbase` konténert és **`/pocketbase/pb_data`** adatbázist használják. Nem módosítanak kötetet vagy indítási útvonalat. A `fairauto-mail.json` és a PocketBase-ben mentett Gmail SMTP-beállítás megmarad.

Másold be az alábbi teljes blokkot a CasaOS termináljába:

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations /DATA/AppData/pocketbase/pb_hooks &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793534400_company_accounts.js -o /DATA/AppData/pocketbase/pb_migrations/1793534400_company_accounts.js &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/company-accounts.pb.js -o /DATA/AppData/pocketbase/pb_hooks/company-accounts.pb.js &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/content/booking.json -o /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json &&
sudo docker exec pocketbase mkdir -p /pocketbase/fairauto_company_migrations /pocketbase/pb_hooks &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793534400_company_accounts.js pocketbase:/pocketbase/fairauto_company_migrations/1793534400_company_accounts.js &&
sudo docker exec pocketbase /pocketbase/pocketbase migrate up --dev=false --dir /pocketbase/pb_data --migrationsDir /pocketbase/fairauto_company_migrations &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/company-accounts.pb.js pocketbase:/pocketbase/pb_hooks/company-accounts.pb.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json pocketbase:/pocketbase/pb_hooks/fairauto-booking.json &&
sudo docker restart pocketbase
```

Ha a repó privát és a raw link 404-et ad, a saját GitHub-hozzáféréseddel töltsd le a három fájlt a fenti hostmappákba, majd a `docker` parancsoktól folytasd. Hitelesítő adat nem kell a parancsokba.

A frontend frissítését és a fenti telepítést együtt végezd. A céges regisztráció a migráció és hook hiányakor beállítási hibát jelez; nem állítja, hogy a fiók létrejött. A közös jogi verzió `2026-11-01.5-draft`, ezért a foglalási JSON másolása is szükséges. Az ÁSZF és az adatkezelés továbbra a `content/legal.ts` és `content/site.ts` fájlokban szerkeszthető.

Ellenőrzés: regisztrációnál cégnév és adószám látszik, belépés után Partnerközpont nyílik. Az admin szereplistájából eltűnik a Magánügyfél; a munkafelvevő továbbra visszaigazolhat, árat írhat, a vezető és admin hozzáférése megmarad.
