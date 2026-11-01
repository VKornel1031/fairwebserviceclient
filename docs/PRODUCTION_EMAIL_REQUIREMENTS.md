# Szolgáltatási értesítések – működés és további feladatok

A portál opcionális, tartós PocketBase-feladatsort és e-mail-küldést tartalmaz. **Alapból ki van kapcsolva.** Unix `sendmail` vagy a PocketBase-ben beállított SMTP-kliens használható; nincs webes e-mail-előnézet vagy a frontendben tárolt levelezési kulcs.

Telepítés és bekapcsolás: [APPOINTMENT_PRICES_AND_MAIL.md](./APPOINTMENT_PRICES_AND_MAIL.md). CasaOS host Sendmail és a konténer közötti kapcsolat: [LOCAL_SENDMAIL.md](./LOCAL_SENDMAIL.md).

Bekapcsolás után az időpontkérésről külön áttekintő értesítést kap a megadott kapcsolattartó és az aktív vezető/munkafelvevő. Telefonos visszaigazoláskor új üzenet jelzi a biztosított időpontot. Átütemezés, lemondás, árváltozás és elkészült munka is külön esemény. A levél az azonosítót, dátumot, szolgáltatást, kapcsolattartási és járműadatokat – a megadott VIN-t is –, opcionális céget, megjegyzést, árakat és műhelyelérhetőségeket tartalmazza. A munka tartalmát és végleges díját továbbra külön kell egyeztetni.

A címzettek külön üzenetet kapnak; az ügyfél nem látja a munkatársak címeit. A felhasználói szöveget HTML-ként nem hajtjuk végre. A hozzáférési titok nem kerül e-mailbe vagy URL-be. A kérés és a feladat együtt jön létre; a tényleges átadás a foglalási tranzakción kívül fut. Átadási hiba nem törli a mentett időpontot. Ismételt kattintás ugyanahhoz az eseményhez nem hoz létre új feladatot.

A PocketBase superuser az `appointment_mail` kollekcióban látja az állapotot és a próbálkozásszámot. A `sent` csak a levélkliens sikeres átadását jelzi, nem bizonyított postaládás kézbesítést. A feladat alapból legfeljebb ötször próbálkozik. Folyamatleállás utáni újrapróbálkozás miatt a külső kézbesítésre nem állítunk pontosan egyszeri garanciát.

A bevezetéshez az üzemeltetőnek ellenőriznie kell a feladó és a munkatársi címek valódiságát, a saját postafiókba történő tényleges kézbesítést, a küldési naplókat és az MTA működését. A levelek és feladatsorok személyesadat-megőrzését, a tényleges szolgáltatókat és továbbításokat az adatkezelési dokumentációhoz kell igazítani.

E-mailes címellenőrzés, fiókaktiválás, önkiszolgáló jelszó-visszaállítás, időzített emlékeztetők, marketing és webes kézbesítési kezelőfelület továbbra nincs bekötve. A regisztráció és bejelentkezés működését a levélbeállítás nem változtatja meg.
