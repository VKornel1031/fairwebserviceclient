# PocketBase fiókkezelés – e-mail és ellenőrzés nélkül

Ez a dokumentum a most bekötött fiókkezeléshez tartozik. A korábbi `verified = true` belépési szabályt felváltja az `active = true`. SMTP nem szükséges. A PocketBase-superuser jelszavát vagy tokenjét **ne add meg a weboldalnak, Vercelnek vagy a csevegésben**.

A megadott `argonptg/pocketbase` image-hez és `/DATA/AppData/pocketbase/pb_data` mappádhoz külön, konkrét lépések: **[CASAOS_POCKETBASE.md](./CASAOS_POCKETBASE.md)**.

## 1. Biztonsági mentés és migráció

Készíts és tölts le PocketBase-mentést, és őrizd meg a jelenlegi collection-beállításokat. Éles cégadatoknál előbb külön másolaton próbáld ki a migrációt. A verziózott fájl:

[`pocketbase/pb_migrations/1793404800_account_management.js`](../pocketbase/pb_migrations/1793404800_account_management.js)

A saját e-mail-cím SMTP nélküli módosításához a [`pocketbase/pb_hooks/account.pb.js`](../pocketbase/pb_hooks/account.pb.js) fájlt is másold a PocketBase tényleges `pb_hooks` könyvtárába, majd indítsd újra az alkalmazást. A hook kizárólag a saját aktív fiók jelszóval megerősített címváltoztatását engedi; nem bővíti a `manageRule` sajátfiók-jogosultságát.

A migráció a meglévő `users` auth collectiont bővíti; nem törli és nem cseréli le a rekordokat vagy a meglévő mezőazonosítókat. A hiányzó mezőket hozzáadja, öt szerepkört állít be, és az API/auth szabályokat lecseréli. Az új `active` mező bevezetésekor a meglévő fiókokat egyszer aktiválja. Későbbi futtatás nem aktiválja újra a letiltott fiókokat. A legkorábban létrehozott aktív app-admint védetté teszi, ha már van ilyen. Automatikus visszagörgetés helyett ellenőrzött mentésből állíts vissza.

**CasaOS / Docker:** az appok eltérő bináris- és kötetútvonalakat használhatnak. A CasaOS alkalmazás beállításaiban nézd meg a `pb_data` és `pb_migrations` köteteket és a PocketBase indítási parancsát. Szükség esetén a konténernevek megtekintése:

```sh
docker ps --format '{{.Names}}\t{{.Image}}'
```

Másold a migrációt a tényleges, tartós `pb_migrations` könyvtárba. Állítsd le a PocketBase-t a migráció idejére; az adott telepítés PocketBase binárisával, ugyanazzal a `pb_data` és migrációs útvonallal futtasd:

```sh
/path/to/pocketbase migrate up --dir /actual/pb_data --migrationsDir /actual/pb_migrations
```

A fenti útvonalak helyőrzők, ne másold őket változatlanul. Az automatikus migrációt használó Docker-kép indításkor is alkalmazhatja a fájlt; ellenőrizd a konténer naplóját és a `users` mezőit. Ne indíts két PocketBase-példányt ugyanazzal a `pb_data` könyvtárral. Ha a CasaOS útvonalai nem egyértelműek, a konténer neve, képe és kötetútvonalai alapján lehet pontos parancsot adni; jelszó nem kell hozzá.

## 2. Ezt kell látnod a users collectionben

A rendszermezőket (`id`, `email`, `password`, `verified`, stb.) PocketBase kezeli. A jelszóhoz ne készíts saját text/hash mezőt.

| Mező               | Típus / beállítás                                                                   |
| ------------------ | ----------------------------------------------------------------------------------- |
| `name`             | Text, legalább 2, legfeljebb 100 karakter                                           |
| `phone`            | Text, max. 25                                                                       |
| `city`             | Text, max. 100                                                                      |
| `reminders`        | Bool; jelenleg nincs levelezés és nincs ilyen beállítás a felületen                 |
| `role`             | Select, kötelező, egy érték: `customer`, `partner`, `reception`, `manager`, `admin` |
| `companyName`      | Text, max. 120                                                                      |
| `companyTax`       | Text, max. 30                                                                       |
| `companyCity`      | Text, max. 100                                                                      |
| `partnerRequested` | Bool, fenntartott mező; önmagában nem ad szerepkört                                 |
| `active`           | Bool, a belépéshez `true` szükséges                                                 |
| `protectedRoot`    | Bool, a védett alapadminnál `true`; csak superuser állítsa                          |
| `termsVersion`     | Text, max. 100; a szerver állítja regisztrációnál                                   |
| `termsAcceptedAt`  | Date; a szerver állítja regisztrációnál                                             |

Password auth: engedélyezve, identity mező `email`; új jelszó 12–64 karakter, legfeljebb 72 UTF-8 bájt. Auth token élettartam 28 800 másodperc (8 óra). **Auth rule: `active = true`**. A `verified` nem belépési feltétel. OAuth2, OTP és e-mailes MFA ne legyen bekapcsolva ehhez az első verzióhoz.

A teljes API-szabályokat a migráció tartalmazza. Ne helyettesítsd őket üres szabállyal: a PocketBase üres szabálya nyilvános engedély, a `null` zárolást jelent. Saját profil mentésekor a szerver nem küldi vissza a szerepkört vagy az aktív állapotot. A közvetlen PocketBase API-nál is tilos ezek önálló módosítása.

## 3. Az első alkalmazás-admin

A PocketBase `/_/` kezelőjében, superuserként hozz létre egy normál **users rekordot** saját e-mail-címmel és erős jelszóval:

- `name`: a neved;
- `role`: `admin`;
- `active`: `true`;
- `protectedRoot`: `true`;
- `emailVisibility`: `false`;
- `verified`: maradhat `false`, mert most nincs címellenőrzés.

Ez az alkalmazás-admin különbözik a PocketBase-superusertől. A weboldalon a normál users rekord e-mail-címével és jelszavával lépsz be. Más app-admin nem törölheti, nem tilthatja le és nem veheti át a védett alapadmin fiókját az alkalmazás API-ján keresztül. A superuser továbbra is minden rekordot kezelhet a PocketBase adminfelületén.

## 4. Vercel beállítások

A projekt **Settings → Environment Variables** részén:

```text
POCKETBASE_URL=https://pb.fairautoszervizkft.hu
AUTH_APP_ORIGIN=https://fairwebserviceclient.vercel.app
AUTH_REGISTRATION_ENABLED=true
```

Ezek szerveroldali változók: ne legyen `NEXT_PUBLIC_` előtagjuk. Az `AUTH_APP_ORIGIN` a tényleges frontend pontos originje, útvonal és záró perjel nélkül; saját domainre költözéskor ezt is módosítsd. Előnézeti telepítéshez annak külön originjét használd. A regisztráció alapértelmezetten le van tiltva, amíg az üzemeltető el nem készíti a migrációt és engedélyezi a fenti flaget.

A változtatás után új Vercel deployment szükséges. A PocketBase-cím **alap URL**, ne `/api/health` végpont legyen. Nincs szükség API-kulcsra vagy superuser-hitelesítő adatra. Ha később Cloudflare Access service-token védi a backend API-t, az opcionális `CF_ACCESS_CLIENT_ID` és `CF_ACCESS_CLIENT_SECRET` kizárólag szerveroldali secret legyen; különben mindkettőt hagyd üresen.

## 5. Kipróbálás

1. Nyisd meg a `/fiok` oldalt; nincs Demó mód vagy szerepkörválasztó.
2. Regisztrálj új ügyfelet, majd lépj be: nincs aktiváló levél és nincs e-mail-ellenőrzés. Új fiók mindig `customer`.
3. Ments telefonszámot, települést vagy céges adatokat; másik böngészőben is ellenőrizd a mentést.
4. Lépj be az adminnal, nyisd meg az `/admin` oldalt. Hozz létre fiókot, vagy módosítsd egy másik felhasználó szerepét. Minden adminmódosításhoz a saját adminjelszó kell.
5. A felhasználó oldalfrissítéskor, fókuszváltáskor vagy legfeljebb percenkénti ellenőrzéskor megkapja az új nézetet. Minden hitelesített API-hívás azonnal újraellenőrzi a PocketBase-fiókot és szerepkört.
6. Tiltott fiók nem léphet be; meglévő munkamenete sem ad további API-hozzáférést. Törlésnél a cél e-mail-címét is meg kell erősíteni. Saját admin és védett alapadmin nem törölhető az appban.
7. E-mail-cím és jelszó módosítása saját jelenlegi jelszóval lehetséges. Elfelejtett jelszónál az admin ellenőrzött megkeresés után állíthat újat. A fióktulajdonos személyazonosságának ellenőrzése az üzemeltető feladata.

A járművek, időpontok, céges flotta és riportok adatbázisos bekötése még nincs kész. A bejelentkezett munkaterek ezért üres előnézetek, a mentési műveletek nem írnak helyi ál-adatbázisba. A vendégfoglaló külön helyi bemutató marad, mintaadatokkal. Nincs SMTP, levélküldés vagy előnézeti postafiók.

## 6. Biztonsági határok és üzemeltetés

A böngésző csak a Next szerverhez fordul; a PocketBase-token HttpOnly, éles környezetben Secure, SameSite=Lax és hosthoz kötött sütiben van. A hitelesítési válasz nem gyorsítótárazható. Az író végpontok originellenőrzést, mezőengedélylistát és 8 KiB méretkorlátot használnak. A publikus regisztráció nem választhat szerepet. Jelszó- és adminműveletekhez új jelszóellenőrzés szükséges. A szerepköröket a PocketBase szabályai közvetlen API-hozzáférésnél is ellenőrzik.

A Next folyamaton belüli próbálkozáskorlát **nem elosztott védelem**: Vercel több példányán és a közvetlen PocketBase elérésnél nem közös. PocketBase rate limit és Cloudflare oldali korlátozás is szükséges. A Tunnel önmagában nem korlátozza az API-hozzáférést, és egy másik domain nem jogosultsági védelem. A PocketBase `/_/` és superuser API-k elérését külön védd. A szuperuserhez távoli hozzáférést ne a webalkalmazásra bízd.

Kijelentkezés a jelen böngésző sütijét törli, nem von vissza egy már ellopott JWT-t. A jelszócsere érvényteleníti a korábbi jelszó-tokeneket; a tiltást és törlést az API minden kéréskor ellenőrzi. A migráció 8 órás backend-tokenidőt állít be, de már kiadott tokenekhez a jelszó/tokenKey cseréje szükséges.

A homelabon látott 0.26.3 régi: későbbi biztonsági javítások hiányoznak belőle, például a [GHSA-84vh-m24q-wjjx](https://github.com/pocketbase/pocketbase/security/advisories/GHSA-84vh-m24q-wjjx), javítva 0.39.7-ben. Cégszintű nyilvános használat előtt mentés és próbavisszaállítás után frissíts támogatott, javított PocketBase-verzióra, és azon is ellenőrizd a migrációt és a folyamatokat. A jelen integráció nem jelenti a teljes rendszer üzemeltetési vagy jogi készre jelentését.

Az adatkezelési és ÁSZF-fájlokat frissítettük a valódi fiókokra. A hiányzó hivatalos cégadatokat, megőrzést, adatfeldolgozókat és érintetti folyamatokat az üzemeltetőnek kell kitöltenie: `content/site.ts`, `content/legal.ts`, `docs/HUNGARIAN_LEGAL_READINESS.md`.

## 7. Mit jelent a PocketBase beépített SMTP-beállítása?

PocketBase tartalmaz levelezési klienst és levélsablonokat, de nem biztosít saját, internetes kézbesítést végző SMTP-szolgáltatást. A **Settings → Mail settings / SMTP** részben meglévő postafiók SMTP-kiszolgálója, helyi levelezőszerver vagy külső SMTP-szolgáltató adható meg. Szolgáltatótól függően ingyenes keret vagy meglévő előfizetéshez tartozó SMTP-hozzáférés is használható; az aktuális feltételeket ellenőrizd.

A beállításhoz szervercím, port/TLS mód, SMTP-felhasználó és jelszó, valamint feladó név és e-mail-cím szükséges. Ezeket közvetlenül a PocketBase adminfelületén add meg, ne a frontendben, GitHubon vagy a csevegésben. A szolgáltató által kért DNS-hitelesítést (például SPF/DKIM) is be kell állítani.

Alapértelmezésben PocketBase a Unix `sendmail` parancsot is használhatja. Ez nem jelent automatikusan működő vagy megbízható kézbesítést egy CasaOS/Docker homelabon. A hivatalos [üzemeltetési útmutató](https://pocketbase.io/docs/going-to-production/#use-smtp-mail-server) SMTP-szolgáltatást javasol éles levelezéshez.

Az SMTP beállítása önmagában nem kapcsolja be a weboldal ellenőrző vagy jelszó-visszaállító folyamatait: ezek a felhasználó kérésére jelenleg ki vannak kapcsolva. A mostani regisztráció és belépés levelezés nélkül működik. A későbbi emailes folyamatokat külön kell bekötni és tesztelni.

## 8. „A fiókszolgáltatás kapcsolata most nem használható”

Ez a hiba azt jelenti, hogy a Next szerver a PocketBase-től várt JSON helyett más választ, például HTML-oldalt kapott. Nem hibás jelszót jelez. A `/api/health` böngészős elérése önmagában nem teszteli a Vercel → PocketBase bejelentkezési útvonalat.

Először a Vercel **Production** környezetében ellenőrizd: `POCKETBASE_URL=https://pb.fairautoszervizkft.hu`. Az alapcím ne a frontend címe, a `/_/` adminoldal vagy az `/api/health` végpont legyen. Környezeti változó módosítása után új deployment szükséges.

Cloudflare **1010 / browser_signature_banned** esetén a generikus szerveroldali user agent is lehet az ok. A kliens ezért `User-Agent: FairautoszervizAccountServer/0.1` fejlécet küld, amely a tényleges alkalmazást azonosítja. Nem böngészőt utánoz, és nem helyettesíti az autentikációt. A javítás telepítése után újra teszteld a szerveroldali belépést. [Cloudflare 1010 dokumentáció](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/).

Ha az alapcím és a kliensazonosítás helyes, a bejelentkezési kísérlethez tartozó Vercel Runtime Logs részben keresd az `account_backend_non_json` eseményt. Ez kizárólag a HTTP-státuszt, válaszformátumot, átjáró típusát és esetleges Cloudflare challenge/ray azonosítót naplózza; nem naplóz jelszót, tokent, e-mail-címet vagy upstream választörzset.

- `status: 200`, `format: html`: ellenőrizd a backend URL-jét és a köztes átjárót; az API helyett weboldal érkezett.
- `status: 403`, `cloudflareChallenge: true`: interaktív Cloudflare-ellenőrzés blokkolja a szerverhívást. A Vercel szerver nem tud böngészős CAPTCHA-t megoldani. A szerveroldali eléréshez megfelelő Cloudflare-szabály vagy Access service-tokenes kapcsolat szükséges.
- `status: 401/403`, `cloudflareChallenge: false`: Access/WAF vagy más hozzáférési tiltás is lehet; nézd meg a megfelelő Cloudflare-eseményt a ray azonosító alapján.
- `status: 502/503/504`: a Tunnel, az origin vagy a köztes szolgáltatás nem érhető el megfelelően.

A Cloudflare védelmeit ne kapcsold ki találomra az egész domainre. A hibás URL vagy a konkrét szerveroldali elérési szabály javítandó; a PocketBase hozzáférési szabályait meg kell tartani. E hiba miatt nem szükséges újra futtatni az adatbázis-migrációt.

### Azonosított eset: Bot Fight Mode

Ha a Cloudflare Security Events bejegyzésében a **Service = Bot fight mode**, az **Action = Managed Challenge**, és a kérés a `pb.fairautoszervizkft.hu/api/collections/users/auth-with-password` végpontra megy, a szerveroldali belépést a Bot Fight Mode állítja meg. A `FairautoszervizAccountServer/0.1` user agent azt is megmutatja, hogy az új kliens már telepítve van.

A Cloudflare **Bot Fight Mode** nem támogat útvonalhoz kötött WAF Skip vagy Page Rule kivételt. A korábban említett célzott skip lehetőség ennél a konkrét terméknél nem használható. A Super Bot Fight Mode külön termék, amely támogat ilyen kivételeket.

A jelenlegi beállítás mellett a javítás:

1. A Cloudflare-ben válaszd ki a `fairautoszervizkft.hu` domaint.
2. **Security → Settings → Bot traffic → Bot Fight Mode**.
3. Állítsd a **Bot Fight Mode** kapcsolót **Off** állásba.
4. Várj néhány másodpercet, majd próbáld újra a bejelentkezést. Ehhez a Cloudflare-beállításhoz nem kell új Vercel-deployment vagy adatbázis-migráció.

Ez a változtatás a Bot Fight Mode réteget a teljes zónára kapcsolja ki, nem csak a PocketBase aldomainre. A Tunnel, HTTPS, PocketBase-jogosultságok és a többi bekapcsolt Cloudflare-védelem ettől nem módosulnak. Ha más hostneveken meg szeretnéd tartani a botvédelmet, útvonal-/hostname-kivételt támogató termékre vagy külön zónába szervezett API-ra van szükség. Vercel megosztott/képlékeny kimenő címei helyett ne engedélyezz teljes felhős IP-tartományokat ennek megkerülésére.

Hivatalos forrás: [Bot Fight Mode – kikapcsolás és korlátozások](https://developers.cloudflare.com/bots/get-started/free/).
