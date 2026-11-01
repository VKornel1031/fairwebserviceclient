# Végső ellenőrzés · 2026. november 1.

## Ellenőrzött változat

A weboldal és a PocketBase közös dokumentumverziója `2026-11-01.6-draft`. A két átadott Word-dokumentum tartalma a megfelelő webes oldalon olvasható; a megőrzési szabályt a kért, lezárás utáni 30 napra igazítottuk. Az eredeti fájlok és a szükséges javítások leírása a [jogi forrásoknál](./legal-sources/README.md) található. A frissített oldalakhoz egyező TXT- és szerkeszthető Word-letöltés tartozik; az ÁSZF szintén külön szerkeszthető és TXT-ként letölthető.

Az új céges fiókok belépés előtt igazolják e-mail-címüket. A címigazolás, újraküldés, jelszó-visszaállítás és megerősített címváltoztatás működik az alkalmazás saját oldalán. A nyilvános regisztráció csak `partner` szerepet ad; a munkafelvevő, vezető és admin szerepét továbbra is az admin osztja ki. A korábbi fiókok hozzáférése megmarad, a migráció nem állítja valótlanul igazoltnak a címüket.

Az időpont- és fióklevelek a portál színeit követő, mobilon is olvasható HTML-t kaptak. Az időpontlevél tételes árat is megjelenít, és megtartja a szöveges változatát. A céges fiókhoz tartozó járműpark, VIN, autóválasztás és előkitöltés már elérhető; több fiók közös céges flottája későbbi bővítés.

## Automatizált eredmények

- Teljes Playwright-csomag: **66 sikeres teszt**, elkülönített PocketBase 0.26.6 adatbázissal. Fiókok, szerepek, járművek, előkitöltés, időpontok, jogosultságok, árazás, e-mail-folyamatok, megőrzés és jogi oldalak is szerepelnek benne.
- PocketBase 0.26.3 kompatibilitás: **8 sikeres célzott teszt**, beleértve a címigazolást, jelszó-visszaállítást, vendégtörlést és dokumentumoldalakat.
- A végső levéldizájn és Word-letöltések után: **3 sikeres célzott teszt**. A ténylegesen előállított leveleket mobil- és asztali szélességen vizsgáltuk; a felhasználói szöveg HTML-kódja nem fut le.
- Migrációs frissítési próba: **sikeres PocketBase 0.26.6 és 0.26.3 alatt**. Megmaradnak a jelszavak, szerepek, letiltások, járműkapcsolatok és időpontadatok. A régi lezárási idő ismert előzményből származik, ennek hiányában friss türelmi idő indul. A migráció nem töröl rekordot.
- Éles Next.js build és TypeScript-ellenőrzés: **sikeres**.
- Formázás és `git diff --check`: **sikeres**.
- Éles függőségek `npm audit --omit=dev` eredménye: **0 ismert sérülékenység** az ellenőrzéskor.

A tesztek helyi, átmeneti adatbázist és elfogott leveleket használnak. A homelabon nem hoztunk létre tesztfiókot vagy időpontot, és nem indítottunk valódi levélküldést. A lejárt vendégkérés törlésénél a határidőt, az aktív ügyek védelmét, a kapcsolódó adatmásolatok törlését és a folyamatban lévő levélátadás kihagyását is ellenőriztük.

### A weboldal logója a levelekben

A későbbi logófrissítés után az időpont- és címigazolási levél két célzott tesztje is sikeres. A böngésző a tényleges PNG-t tölti be mobilnézetben; ugyanennek a fájlnak a nyilvános webes elérhetősége és egyezése is ellenőrzött. A három natív fióksablont módosító előremutató migráció frissítési próbája PocketBase 0.26.6 és 0.26.3 alatt sikeres. A telepítési parancsok az [EMAIL_LOGO.md](./EMAIL_LOGO.md) fájlban találhatók.

## Telepítés a saját végső próba előtt

A nyilvános frontend és a backend olvasási ellenőrzése sikeres volt: az anonim munkamenet üres, az admin API belépést kér, a levélstátusz végpont tiltja az anonim hozzáférést, és a natív listák nem adnak ki idegen rekordot. A backend az ellenőrzéskor még a korábbi `2026-11-01.5-draft` konfigurációt használta.

**A GitHub/Vercel frissítése mellett a PocketBase új migrációit és hookjait is telepíteni kell.** Az egyben bemásolható parancsok és a rövid kézi próbasor a [FINAL_UPDATE.md](./FINAL_UPDATE.md) fájlban vannak. A parancsok a tényleges `/pocketbase/pb_data` adatbázist használják a meglévő konténerben, és megőrzik a működő SMTP-beállítást. Frissítés után jelentkezz be újra. A saját postaládás kézi próba igazolja majd az éles levélkézbesítést.

## Nyitott üzemeltetői adatok

A jogi tartalom továbbra is felülvizsgálandó változat. A `npm run legal:check` szándékosan nyitott tételeket jelez: nyilvántartó hatóság, az adatfeldolgozás és a még nyitott megőrzési körök végleges leírása, szabályozott tevékenységre és magatartási kódexre vonatkozó nyilatkozat, békéltetési alávetés, valamint a cégadatok, üzleti feltételek, adatfeldolgozók és akadálymentességi hatály üzemeltetői ellenőrzése. Ezeket nem jelöltük elvégzettnek bizonyíték nélkül.

A technikai ellenőrzés nem tanúsítja a teljes magyar jogi megfelelést. A külső postaládák és mentések megőrzése, a visszaállítási próba és az éles üzemeltetési intézkedések a szolgáltató feladatai maradnak; a szoftveres 30 napos vendégtörlés ezek helyett nem töröl külső rendszereket.
