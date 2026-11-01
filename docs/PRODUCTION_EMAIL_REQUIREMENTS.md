# Szolgáltatási értesítések – működés és további feladatok

A portál opcionális, tartós PocketBase-feladatsort és e-mail-küldést tartalmaz. **Alapból ki van kapcsolva.** Unix `sendmail` vagy a PocketBase-ben beállított SMTP-kliens használható; nincs webes e-mail-előnézet vagy a frontendben tárolt levelezési kulcs.

Telepítés és bekapcsolás: [APPOINTMENT_PRICES_AND_MAIL.md](./APPOINTMENT_PRICES_AND_MAIL.md). CasaOS host Sendmail és a konténer közötti kapcsolat: [LOCAL_SENDMAIL.md](./LOCAL_SENDMAIL.md).

Bekapcsolás után az időpontkérésről külön áttekintő értesítést kap a megadott kapcsolattartó és az aktív vezető/munkafelvevő. Telefonos visszaigazoláskor új üzenet jelzi a biztosított időpontot. Átütemezés, lemondás, árváltozás és elkészült munka is külön esemény. A levél az azonosítót, dátumot, szolgáltatást, kapcsolattartási és járműadatokat – a megadott VIN-t is –, opcionális céget, megjegyzést, árakat és műhelyelérhetőségeket tartalmazza. A munka tartalmát és végleges díját továbbra külön kell egyeztetni.

A címzettek külön üzenetet kapnak; az ügyfél nem látja a munkatársak címeit. A felhasználói szöveget HTML-ként nem hajtjuk végre. Az időpontértesítés nem tartalmaz vendég-hozzáférési titkot. A fiókbiztonsági levelek külön, időkorlátos műveleti tokent tartalmaznak URL-töredékben; ezeket az alkalmazás csak megerősítéskor továbbítja POST-kérésben. A kérés és a feladat együtt jön létre; a tényleges átadás a foglalási tranzakción kívül fut. Átadási hiba nem törli a mentett időpontot. Ismételt kattintás ugyanahhoz az eseményhez nem hoz létre új feladatot.

A PocketBase superuser az `appointment_mail` kollekcióban látja az állapotot és a próbálkozásszámot. A `sent` csak a levélkliens sikeres átadását jelzi, nem bizonyított postaládás kézbesítést. A feladat alapból legfeljebb ötször próbálkozik. Folyamatleállás utáni újrapróbálkozás miatt a külső kézbesítésre nem állítunk pontosan egyszeri garanciát.

A bevezetéshez az üzemeltetőnek ellenőriznie kell a feladó és a munkatársi címek valódiságát, a saját postafiókba történő tényleges kézbesítést, a küldési naplókat és az MTA működését. A levelek és feladatsorok személyesadat-megőrzését, a tényleges szolgáltatókat és továbbításokat az adatkezelési dokumentációhoz kell igazítani.

A végső frissítés e-mailes címigazolást, újraküldést, önkiszolgáló jelszó-visszaállítást és megerősített címváltoztatást is tartalmaz: [FINAL_UPDATE.md](./FINAL_UPDATE.md). Új fiók belépéséhez címigazolás kell; ez nem oszt ki munkatársi szerepet. Időzített emlékeztető és marketing nincs.

A levelek a webhely színeihez igazodó, mobilon is olvasható HTML-fejlécet, csoportosított adatokat és műveletgombot kapnak. A tételes árbecslés külön táblázatban jelenik meg. Külső képet vagy betűkészletet nem töltenek le, és a szöveges alternatíva is megmarad.
