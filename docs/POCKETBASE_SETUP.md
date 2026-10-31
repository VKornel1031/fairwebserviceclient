# PocketBase-fiókkezelés – induló beállítások

Ez az útmutató a Fair Autószerviz portál **következő, éles fiókkezelési lépéséhez** készült. A frontend jelenleg továbbra is helyi demóadatokat használ: egy PocketBase-példány beállítása önmagában még nem kapcsolja át a weboldalt.

Az alábbi collection- és jogosultsági beállításokat PocketBase **0.40.6** alatt, elkülönített helyi adatbázison ellenőriztük. Más verziónál a mezők és menüpontok eltérhetnek; először tesztkörnyezetben alkalmazd a saját verziódhoz illő beállításokat. A homelabodat és a valódi SMTP-küldést nem teszteltük.

## 1. Mi szükséges a homelabon?

- Egy rögzített verziójú PocketBase-példány tartós `pb_data` kötettel. A SQLite-ot PocketBase kezeli, külön SQL-szerver és SQL API-kulcs nem kell.
- HTTPS-es, stabil API-cím, például `https://pb.sajatdomain.hu`. A Vercelen futó frontendnek és a felhasználók böngészőinek is el kell érniük. A `localhost`, a privát LAN-cím vagy egy csak otthon feloldható név erre nem megfelelő.
- Reverse proxy (például Caddy vagy Nginx), amely a PocketBase tényleges hallgatózási címére továbbít. Konténeres proxy esetén a belső konténerhálózatot használd; a PocketBase-portot ne kelljen közvetlenül publikálni.
- SMTP-kiszolgáló a megerősítő és jelszó-visszaállító levelekhez.
- Rendszeres, PocketBase által támogatott mentés és kipróbált visszaállítás. A `pb_data`, a saját migrációk és hookok maradjanak meg frissítéskor.

A PocketBase beépített adminfelülete általában a `https://pb.sajatdomain.hu/_/` címen érhető el. Hozz létre **saját superuser** fiókot. Ezt kizárólag adminisztrációra használd: a weboldal tulajdonosi/vezetői ügyfélfiókja nem superuser.

Böngészős kérésekhez korlátozhatod a megengedett originöket a tényleges frontendcímre és helyi fejlesztésre:

```sh
./pocketbase serve --http=127.0.0.1:8090 --origins="https://portal.sajatdomain.hu,http://localhost:3000"
```

Ez a példa ugyanazon gépen futó reverse proxyhoz való. Konténerben a hallgatózási címet és a belső hálózatot a telepítésedhez igazítsd. Az originlista nem helyettesíti a collection-jogosultságokat. Teszteld az API-t a frontend tényleges domainjéről is.

## 2. Alap- és levelezési beállítások

A PocketBase adminfelületének Settings részében:

1. Állítsd be az alkalmazás nevét és URL-jét. A beépített megerősítőoldalak használatakor az e-mail-sablonokban szereplő `/_/` útvonalaknak a **PocketBase domainjére** kell vezetniük. Ne irányítsd ezeket olyan frontendoldalra, amely még nem létezik.
2. Kapcsold be az SMTP-t. Add meg biztonságosan a hostot, portot, felhasználónevet, jelszót és a szolgáltató szerinti TLS-beállítást. Ellenőrizd a feladói címet és az SPF/DKIM/DMARC beállításokat a levelezési szolgáltatónál.
3. Küldj tesztlevelet. Külön próbáld ki a regisztrációs megerősítést és a jelszó-visszaállító linket is; egy sikeres tesztlevél önmagában nem ellenőrzi az authfolyamatot.
4. Az éles használat előtt állíts be megfelelő beépített rate limitet a regisztrációra, belépésre és authlevelek kérésére.

A frontendbe nem kerül SMTP-jelszó vagy superuser-token. A nyilvános PocketBase API-URL nem titok; a hozzáférést a bejelentkezés és a szerveroldali szabályok szabályozzák.

## 3. `users` – Auth collection

A Collections alatt keresd meg az alap `users` auth collectiont. Ha még nincs ilyen, hozz létre egyet **Auth** típussal, `users` néven. Meglévő collectiont ne törölj vagy cserélj le; a saját adataidhoz és sémádhoz add hozzá a hiányzó mezőket.

A rendszermezőket (`id`, `email`, `password`, `verified`, `emailVisibility`, dátumok stb.) PocketBase kezeli. Ne készíts saját `passwordHash`, `salt` vagy jelszót tároló text mezőt.

| Egyedi mező | Típus  | Beállítás                                                                       |
| ----------- | ------ | ------------------------------------------------------------------------------- |
| `name`      | Text   | Kötelező; min. 2, max. 100 karakter; teljes név                                 |
| `phone`     | Text   | Nem kötelező; max. 25 karakter                                                  |
| `city`      | Text   | Nem kötelező; max. 100 karakter                                                 |
| `reminders` | Bool   | Értesítési preferencia; nem marketing-hozzájárulás                              |
| `role`      | Select | Kötelező, egy választás; `customer`, `partner`, `reception`, `manager`, `admin` |

Ha a `name` mező már létezik, annak beállításait módosítsd, ne készíts második, azonos nevű mezőt. A telefon és település regisztrációkor még lehet üres; az időpontkéréskor a frontend és a későbbi backend kötelezővé teheti őket.

## 4. Másolható API-szabályok

A `users` collection API Rules részében:

**List rule** és **View rule**:

```text
@request.auth.id != "" && id = @request.auth.id
```

**Create rule**:

```text
@request.auth.id = "" && @request.body.role = "customer" && @request.body.verified:isset = false
```

**Update rule**:

```text
@request.auth.id != "" && id = @request.auth.id && @request.body.role:changed = false && @request.body.verified:changed = false
```

**Delete rule**: maradjon **Locked / null** az induló verzióban. Az adatok törlésének folyamatát külön kell megvalósítani, beleértve a kapcsolódó foglalásokat és a kötelező megőrzéseket. A zárolt törlés nem váltja ki az érintetti kérelmek kezelését.

**Manage rule**: maradjon **Locked / null**. Ez egy másik felhasználó hitelesítési adatainak teljes kezelését is lehetővé tehetné; ne legyen nyilvános.

PocketBase-ben a **Locked / null** és az **üres szabály** különböző: az üres szabály nyilvános hozzáférést enged. A zárolt műveleteknél ne töröld egyszerűen a szabály szövegét.

Ezekkel a beállításokkal a felhasználó csak saját profilját olvashatja és módosíthatja; nem sorolhatja fel mások adatait, és nem adhat magának partner-, munkafelvevői, vezetői vagy adminisztrátori szerepet. A listázási szabály szűrőként is működik: tiltott adatoknál üres listát is kaphatsz, nem feltétlenül HTTP-hibát.

Az itt megadott sajátprofil-szabályok önmagukban nem biztosítanak adminisztrátori fióklistázást vagy mások módosítását. A demó `/admin` műveletei helyi adatokon működnek; az éles adminisztrációhoz külön, szerver által ellenőrzött szabályok vagy végpontok szükségesek. Az alkalmazás `admin` szerepe sem PocketBase-superuser.

## 5. Hitelesítés és szerepkörök

A `users` auth beállításaiban:

- **Identity/Password**: bekapcsolva; azonosítómező: `email`.
- A password rendszermezőnél állíts be megfelelő minimális hosszt, például 12 karaktert; a későbbi frontendnek ezt követnie kell. A mostani demó 8 karakteres minimuma ettől független.
- **Auth rule**:

```text
verified = true
```

- OAuth2 és OTP az első verzióhoz nem szükséges. A superuser-fiókodnál használd a rendelkezésre álló erősebb hitelesítési védelmet.

A regisztrációs kérésben **mindig `role: "customer"`** szerepeljen. A céges regisztráció később partnerigény lehet, amelyet admin hagy jóvá. A jelenlegi demó automatikus partnerjogosultságát és szabad szerepkörváltóját **nem szabad átvinni az éles authfolyamatba**.

Partner-, reception-, manager- és admin-szerepet kizárólag ellenőrzött adminisztrációval adj. A munkafelvevő az időpontokat és az ügyfélfogadást kezeli; a műhelyfolyamatok és a riportok a vezetőhöz tartoznak. Az admin minden munkaterülethez hozzáfér, és a fiókokat is kezeli. Az appbeli `manager` szerep nem PocketBase superuser. A `role` értéke önmagában más collectionhöz sem ad hozzáférést: azokhoz később külön szabályok kellenek.

A `verified = true` miatt a felhasználó regisztráció után a megerősítésig nem tud jelszóval belépni. Az első tesztfióknál az adminfelületen átállíthatod a `verified` mezőt, hogy ellenőrizd a profilfolyamatot; ez **nem helyettesíti az éles e-mailes megerősítést**.

## 6. A majdani frontendhívások

A hivatalos JavaScript SDK csomagneve `pocketbase`. A következő példák egy későbbi integrációhoz valók; most nem futnak a weboldalban.

```ts
import PocketBase from "pocketbase";

const pb = new PocketBase("https://pb.sajatdomain.hu");

// Regisztráció: nyers jelszót TLS-en keresztül PocketBase kapja meg;
// soha ne a demóban mentett hash-t küldd, és ne naplózd a jelszót.
await pb.collection("users").create({
  email,
  password,
  passwordConfirm,
  name,
  role: "customer",
  emailVisibility: false,
  reminders: false,
});
await pb.collection("users").requestVerification(email);

// Megerősítés után:
await pb.collection("users").authWithPassword(email, password);
const me = await pb.collection("users").authRefresh();
await pb
  .collection("users")
  .update(me.record.id, { name, phone, city, reminders });

// Elfelejtett jelszó és e-mail-cím módosítása:
await pb.collection("users").requestPasswordReset(email);
await pb.collection("users").requestEmailChange(newEmail);

// Kijelentkezés:
pb.authStore.clear();
```

A levelekben kapott tokenek kezelésére kezdetben használhatod PocketBase beépített megerősítőoldalait. Saját frontendoldalakhoz később a `confirmVerification`, `confirmPasswordReset` és `confirmEmailChange` hívásokat is be kell kötni, majd a sablonlinkeket hozzájuk igazítani. A jelszó-visszaállítás és az e-mail-változtatás a meglévő auth-tokenek érvénytelenítésével is járhat; ezt a felületnek kezelnie kell.

Next.js-ben ne ossz meg egyetlen, változó felhasználói authállapotot hordozó SDK-példányt az összes szerverkérés között. Szerveroldali használathoz kérésenként külön példány és átgondolt sütikezelés kell; a böngészős SDK alap tárolási módját is szerepeltesd az adatkezelési tájékoztatóban. A hitelesítési token érvényességét és az adott művelet jogosultságát a backendnek kell ellenőriznie.

## 7. Mit kell még bekötni ebben a projektben?

1. A `components/provider.tsx` helyi sessionkezelését valódi PocketBase authra kell cserélni, elkülönített, tudatosan kiválasztott auth-tárolással.
2. A `components/workspace.tsx` regisztrációját, belépését, profilmentését, megerősítéskérését és jelszó-visszaállítását az SDK-hoz kell kötni.
3. A `lib/demo.ts` helyi jelszólenyomatait **nem importáljuk éles jelszóként**. A mintaadatok és a demószerepkörök nem éles ügyfélfiókok.
4. A járművek, foglalások és céges rekordok jelenleg helyben maradnak; ezekhez a következő körben külön collectionök, szerveroldali hozzáférési szabályok és foglalási végpont szükségesek.
5. A jogi mintaszövegeket frissíteni kell a valódi PocketBase-, tárhely-, e-mail- és megőrzési adatokkal.

A bekötéshez a következő nem titkos információk elegendők az induláshoz: **PocketBase-verzió, HTTPS API-URL és a frontend végleges domainje**. Jelszót, superuser-tokent vagy SMTP-kulcsot ne küldj chatben és ne írj a repóba.

## 8. Átadási ellenőrzés

- Vendég létrehozhat `customer` fiókot, de `partner`/`reception`/`manager`/`admin` szerepet vagy `verified: true` értéket nem küldhet be.
- Nem megerősített fiók nem léphet be; a kiküldött megerősítőlink működik.
- A megerősített felhasználó be tud lépni, saját adatait módosíthatja, másét nem.
- Saját szerepkörét és a `verified` állapotot sem módosíthatja.
- A jelszó-visszaállítás és az e-mail-változtatás valódi tesztpostaládával végigfut.
- Kijelentkezés és lejárt/érvénytelen token esetén a frontend visszatér a belépéshez.
- A superuser adatai nem jelennek meg a frontendcsomagban vagy hálózati kérésben.
- A backupból végzett visszaállítást külön is kipróbáltad.

Az elkülönített helyi ellenőrzésben a regisztráció, megerősítés előtti belépés tiltása, saját profil módosítása, jogosultságemelés tiltása, másik fiók olvasásának/módosításának tiltása és a zárolt törlés működött. Az admin által beállított `verified` érték utáni belépést teszteltük; tényleges levélküldést nem.

Hivatalos források: [Hitelesítés](https://pocketbase.io/docs/authentication/), [API-szabályok](https://pocketbase.io/docs/api-rules-and-filters/), [Records API](https://pocketbase.io/docs/api-records/), [Éles üzemeltetés](https://pocketbase.io/docs/going-to-production/), [PocketBase 0.40.6](https://github.com/pocketbase/pocketbase/releases/tag/v0.40.6).
