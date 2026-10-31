# Fair Autószerviz – a helyi demó bemutatása

A demóhoz nem kell adatbázis, SQL-kiszolgáló, PocketBase, API-kulcs vagy környezeti változó. Indítás: `npm ci`, majd `npm run dev`; a felület a 3000-es porton érhető el. A meglévő világos/sötét megjelenés és az összes szerkeszthető tájékoztató megmaradt.

## 1. Időpontkérés vendégként

1. A főoldalon válaszd az **Időpontot foglalok** lehetőséget.
2. Válassz szolgáltatást, szabad napot és időpontot.
3. Adj meg kitalált kapcsolattartási és járműadatokat.
4. Az áttekintésen ellenőrizd az adatokat, fogadd el a demó feltételeit, majd küldd el az időpontkérést.
5. A **Foglalásaim** oldalon látható a kérés; itt kérhetsz másik időpontot, lemondhatod, vagy letöltheted a naptárbejegyzést.

Az időpontkérés nem javítási megrendelés. A munka tartalmát és a végleges árat külön kell egyeztetni, akkor is, ha később tájékoztató ár jelenik meg. A demó nem továbbít valódi foglalást vagy e-mailt.

## 2. Munkafelvétel és vezetői kezelés

1. A fejlécben: **Demó mód → Tulajdonos / vezető**.
2. A vezetői oldalon kipróbálhatók az időszak- és keresési szűrők, a terhelés és a CSV-riport.
3. Az oldalsávon válaszd a **Műhely és naptár** oldalt, majd a **Kérések** szűrőt.
4. Nyisd meg az előbb létrehozott kérést, és válaszd a **Visszaigazolás**, **Munka indítása**, majd **Elkészült** állapotokat.
5. A **Zárvatartás kezelése** alatt lezárhatsz és újranyithatsz napokat. A lezárt nap vendégként sem foglalható.

A **Demó mód → Munkafelvevő** külön munkateret nyit a `/munkafelvetel` oldalon. Itt ügyfélnek vehetsz fel időpontot, visszaigazolhatsz, átütemezhetsz vagy lemondhatsz kéréseket, és megnyithatod az ügyfél telefonos vagy e-mailes elérhetőségét. A munka indítása/lezárása, a zárvatartás és a riportok a vezetői nézetben maradnak.

Korábbi helyi mentés betöltésekor a régi staff-profil munkafelvevővé alakul; a foglalási azonosítók, személyes adatok és járművek megmaradnak. A korábban már vezetőhöz került adatoknál a tulajdonos nem változik.

## 3. Ügyfelek és partnerek

- **Magánügyfél:** egy mentett autó, saját foglalások és szerkeszthető kapcsolattartási adatok. Saját demófiók is regisztrálható; a mentett adatok a következő foglalásnál automatikusan kitöltődnek.
- **Céges partner:** két mintajármű, egy megjelölt mintaidőpont, flottakeresés, céges adatok és saját foglalások CSV-exportja. Új céges regisztráció külön, üres flottával indul.

A demónézetek szabadon válthatók. A vendég, az ügyfél és a partner a szokásos navigációban nem kap vezetői funkciókat; ez a helyi bemutató nem éles hozzáférés-védelem.

## 4. Adminisztrátori fiókkezelés

**Demó mód → Adminisztrátor** megnyitja az `/admin` oldalt. Új fiókot hozhatsz létre névvel, e-maillel és szerepkörrel; most nem kell demójelszó. A sorban lévő **Profil kipróbálása** gombbal közvetlenül megnyithatod a fiókot. A valódi e-mail/jelszó alapú hitelesítést később a PocketBase kezeli, jelszóhash tárolásával. A partnerfióknál céges adatok is megadhatók. Meglévő fióknál módosíthatók az adatok és a szerepkör.

A törlést külön meg kell erősíteni. A fiók, a mentett járművei és a céges adatai törlődnek; a korábbi foglalási másolatok vendégfoglalásként megmaradnak. A bejelentkezett adminfiók nem törölhető és saját szerepe nem változtatható meg. A törölt mintafiókok frissítéskor nem jönnek vissza; az újrakezdés állítja vissza őket.

Az admin minden munkaterülethez hozzáfér. A helyi szerepkörszabályok a `lib/permissions.ts` fájlban vannak; ezek még nem szerveroldali hozzáférés-védelmek.

## 5. Új bemutató indítása

**Demó mód → Demó újrakezdése → Mintaadatok visszaállítása**.

A megerősítés törli az ebben a böngészőben létrehozott demófiókokat, járműveket, foglalásokat és zárvatartásokat, majd visszaállítja az öt mintaprofilt. Kijelentkeztet, de a világos/sötét témát és más alkalmazások helyi adatait nem törli. A **Mégse** gomb változtatás nélkül bezárja a megerősítést.

Az adatok frissítés után megmaradnak, más eszközre nem szinkronizálódnak. A helyi tárhely engedélyezése szükséges. A jogi dokumentumok továbbra is az ellenőrzésre és a hiteles cégadatok kitöltésére váró minták; az élesítés előtti teendőket a [jogi útmutató](./HUNGARIAN_LEGAL_READINESS.md) tartalmazza.
