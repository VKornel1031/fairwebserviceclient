# PocketBase Unix sendmail – CasaOS, szolgáltató és API-kulcs nélkül

A gépen a Poste.io foglalta a 25-ös portot. Eltávolítása után a host Sendmail szolgáltatása elindult. A megmutatott új állapot: **host `127.0.0.1:25`**, a PocketBase konténerben pedig BusyBox `sendmail`, amely szintén `127.0.0.1` címre küld alapból. A két localhost külön gépet jelent, ezért a PocketBase tesztje `exit status 1` hibával leállhat akkor is, amikor a host szolgáltatása működik.

## Másolható javítás

Ez a segéd kizárólag ehhez az elrendezéshez készült: működő Debian/CasaOS Sendmail, `pocketbase` nevű, egy privát IPv4 Docker-hálózaton futó konténer és BusyBox kliens. A meglévő adatbázist és konténert használja. Nem állít át PocketBase URL-t, adatkönyvtárat, kötetet vagy Tunnelt.

Előbb mentsd a Sendmail és PocketBase adatait. A segéd a módosított levelezési konfigurációról külön mentést is készít. Ezután a CasaOS terminálban:

```sh
sudo mkdir -p /DATA/AppData/pocketbase &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/sendmail-wrapper.sh \
  --output /DATA/AppData/pocketbase/sendmail-wrapper.sh &&
sudo curl --fail --show-error --location \
  https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/scripts/setup-local-sendmail.py \
  --output /DATA/AppData/pocketbase/setup-local-sendmail.py &&
sudo python3 /DATA/AppData/pocketbase/setup-local-sendmail.py --check &&
sudo python3 /DATA/AppData/pocketbase/setup-local-sendmail.py
```

Privát repónál a raw letöltés 404-et ad: ilyenkor a [CasaOS útmutató autentikált letöltését](./CASAOS_POCKETBASE.md) használd a két fájlhoz. Nem kell a repót nyilvánossá tenni.

A `--check` csak olvas és megmutatja a célcímeket. Az alkalmazás:

- Kiolvassa a PocketBase konténer aktuális privát IP-jét és átjáróját.
- A Sendmailhez új, **kizárólag a Docker-átjáró privát címére kötött `2525`-ös** figyelőt ad; a meglévő localhost-beállítást megtartja.
- Relay jogosultságot csak a PocketBase pontos IP-jének ad, nem a teljes hálózatnak és nem az internetnek. A nyilvános interfészen nem nyit SMTP-portot.
- Újrafordítja a Sendmail konfigurációt és access adatbázist, újraindítja a host Sendmailt, majd a konténerből csak SMTP-köszöntést és `QUIT` választ ellenőriz. Tesztlevelet nem küld.
- A konténer `/usr/sbin/sendmail` parancsát helyi indítóra cseréli. A BusyBox binárisát megőrzi; a symlinket nem követi és nem írja felül a `/bin/busybox` fájlt. Az indító a privát figyelőt, a levél tényleges From címét és 45 másodperces hálózati időkorlátot használ. Címzettnek nem enged parancssori kapcsolót vagy fejlécbefecskendezést.

A korábbi konfigurációk a `/DATA/AppData/pocketbase/mail-backups/…` mappába kerülnek; az eredeti konténeres kliens külön időbélyeges fájlban megmarad. Sikertelen telepítéskor a segéd visszaállítja az előző levelezési konfigurációt. Más szolgáltatás által foglalt 2525-ös port vagy eltérő hálózati elrendezés esetén nem módosít beállítást.

## PocketBase beállítás és próba

A PocketBase **Settings → Mail settings** alatt:

1. Az SMTP kapcsoló maradjon kikapcsolva: így a Unix `sendmail` klienst választja.
2. Állíts be a saját domainedhez tartozó, valóban használható feladócímét és feladónevet. Nem szükséges API-kulcs.
3. A PocketBase saját tesztküldésével küldj egy levelet **a saját ellenőrzött postafiókodba**, és ellenőrizd a beérkezést. A parancs sikeres lefutása csak azt jelenti, hogy a helyi MTA átvette a levelet; nem bizonyítja az internetes kézbesítést.

Ha a PocketBase tesztje már sikeres, de a levél nem érkezik meg, a következő lépés a host Sendmail-kézbesítés: `sudo mailq` és a host levélnaplója. A teljes queue vagy napló mások e-mail-címét és levéladatát tartalmazhatja; ne másold be nyilvánosan. Ilyenkor már nem a Docker localhost-eltérése a hiba.

A közvetlen internetes kézbesítéshez továbbra is kell működő kimenő SMTP-elérés, megfelelő DNS/SPF/DKIM és a tényleges nyilvános IP-hez tartozó PTR; ezeket a helyi indító nem biztosítja. Ha a szolgáltató blokkolja a forgalmat vagy nem ad megfelelő PTR-t, helyi Sendmailtől önmagában nem lesz megbízható a kézbesítés. A PocketBase [hivatalos útmutatója](https://pocketbase.io/docs/going-to-production/#use-smtp-mail-server) ezért külső vagy helyi SMTP-kiszolgálót javasol üzleti levelezéshez. Az SMTP protokoll használata nem jelent automatikusan fizetős előfizetést.

A PocketBase vagy a Docker hálózatának újralétrehozása után a konténer IP-je és a kliensfájl változhat: a segédet ekkor ismét futtasd. Csak a saját megjelölt konfigurációs blokkját frissíti. A telepítés nem változtatja meg a PocketBase aktív adatmappájának jelenlegi tárolását.

Az alkalmazás időpontértesítései ettől külön, alapból kikapcsolt funkciók. Bekapcsolásukat az [időpontkezelési útmutató](./APPOINTMENTS.md) írja le. A fiókregisztráció továbbra sem követel e-mail-ellenőrzést.
