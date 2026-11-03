# A te CasaOS PocketBase-telepítésed

A korábbi terminálkimeneted alapján a konténer neve **`pocketbase`**, a munkakönyvtára **`/pocketbase`**, az indítása `serve --http=0.0.0.0:8090`. A bináris **`/pocketbase/pocketbase`**, a tényleges adatbázis **`/pocketbase/pb_data/data.db`**. A korábbi image `argonptg/pocketbase:0.26.6`, de a veled már elvégzett frissítés után a ténylegesen futó PocketBase-verzió **0.40.6**. Ez a blokk a meglévő 0.40.6-os telepítés új hookjait, dokumentummigrációját és konfigurációját telepíti; a bináris verziója 0.40.6 marad.

## Másold be a teljes frissítési blokkot

A Debian/Ubuntu alapú CasaOS gép **host terminálján vagy SSH-kapcsolatán** futtasd, ugyanott, ahol korábban a `sudo docker` parancsokat használtad. A blokkban semmit sem kell átírnod. A saját Linux-felhasználód sudo-jelszavát a terminál kérheti. A repó jelenleg nyilvános, GitHub-bejelentkezés nem kell.

```bash
sudo apt-get update &&
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y bash ca-certificates coreutils curl tar unzip tzdata &&
sudo curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 120 https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/57b6a2c9fbe834f4005d174a02e1f65dbc9b990b/scripts/update-pocketbase-security.sh -o /root/fairauto-security-update.sh &&
printf '%s  %s\n' '02901801b25c2c3e9d6de43892e6f39e6709a2ec17e9e52940d1931852eafaca' '/root/fairauto-security-update.sh' | sudo sha256sum -c - &&
sudo bash /root/fairauto-security-update.sh 57b6a2c9fbe834f4005d174a02e1f65dbc9b990b &&
sudo docker exec pocketbase /pocketbase/pocketbase --version &&
sudo docker exec pocketbase /bin/sh -c 'wget -qO- http://127.0.0.1:8090/api/fairauto/security-policy'
```

Az ellenőrző összegnél `OK`, a végén **`pocketbase version 0.40.6`** és **`"ready":true`**, **`"version":1`** jelzi a sikert. Utána jelentkezz be újra a weboldalon.

A blokk telepíti a szükséges hosteszközöket, ellenőrzi a telepítést, letölti és ellenőrzi a rögzített kiadást, leállítja a meglévő konténert, majd a valódi adatokról, feltöltésekről, korábbi binárisról, hookokról és migrációkról ellenőrzött offline mentést készít. Ezután telepíti az új binárist, hookokat és konfigurációt, és elindítja ugyanazt a konténert. A privát szervizdokumentumok új migrációja és a mellékelt, még hiányzó migrációk indításkor automatikusan lefutnak; a már alkalmazottak kimaradnak. Külön `migrate up` vagy újraindítás nem kell. A korábbi fiók-, jármű- és időpontkezelő alapséma előfeltétel; ez a működő rendszer frissítése.

A jelenlegi SMTP-hitelesítés, `fairauto-mail.json` és sendmail megmarad. A hostra telepített `tzdata` csomag Budapest-időzónafájlját a konténer is megkapja, így a téli és nyári időszámítást a foglalás helyesen kezeli. Új API-kulcsot vagy superuser-jelszót nem kell megadnod. A mentés a `/DATA/AppData/pocketbase/backups/` alatt készül, a pontos útvonalat a frissítő kiírja. Töltsd le külön gépre, és kezeld bizalmasan.

## CasaOS-kompatibilitás és adatmegőrzés

A [CasaOS hivatalos leírása](https://github.com/IceWhaleTech/CasaOS#system-compatibility) Debian/Ubuntu támogatást és Docker-alapú appokat dokumentál. Ez a blokk a meglévő Docker-motort és a host csomagkezelőjét használja. A frissítő Linux AMD64 (`x86_64`) és ARM64 (`aarch64`) konténerhez, 0.26.3, 0.26.6 vagy már frissített 0.40.6 verzióhoz készült. A 32 bites ARMv7-et nem támogatja. A szükséges verziót, útvonalakat, architektúrát és eszközöket még a PocketBase leállítása előtt ellenőrzi.

**A történelmi `/pb_data` csatolás nem az aktív adatkönyvtár.** A működő adatbázis a konténer belső `/pocketbase/pb_data` mappájában van. A frissítő megtartja a konténert és az útvonalakat. CasaOS appfrissítés vagy újralétrehozás előtt külön meg kell oldani a valódi adatkönyvtár, a frissített bináris és a hookok tartós tárolását, és tesztelni kell a visszaállítást.

A CasaOS továbbra is a régi image-címkét mutathatja. A ténylegesen futó PocketBase verzióját a blokk végén a bináris saját `--version` parancsa ellenőrzi.

Az új kiadás teljes leírása, diagnosztikája és az éles üzemhez még szükséges Cloudflare/VPN-, MFA-, mentési és környezeti beállítások: **[SECURITY_UPDATE.md](./SECURITY_UPDATE.md#server-side-work-before-public-operation)**. Ezek fiókfüggő lépések; a fenti PocketBase-frissítés nem állítja be helyetted a külső szolgáltatásokat.

## Ha hibát ír

Ne folytasd régi részleges hook-/migrációmásolással, és ne hozd létre újra a konténert. Az állapot és a legutóbbi napló helyben ellenőrizhető:

```sh
sudo docker inspect pocketbase --format 'Status={{.State.Status}} ExitCode={{.State.ExitCode}}' &&
sudo docker logs --tail 100 pocketbase
```

A naplót helyben nézd át; ne ossz meg ügyféladatokat vagy hitelesítő adatokat. Mentési vagy telepítési hibánál a frissítő szándékosan leállítva hagyhatja a konténert. A visszaállítási leírás a [biztonsági útmutatóban](./SECURITY_UPDATE.md#recovery) található.

Új, még alapséma nélküli telepítés előkészítéséhez a [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md), [SAVED_VEHICLES.md](./SAVED_VEHICLES.md) és [APPOINTMENTS.md](./APPOINTMENTS.md) történeti sémaleírásai használhatók; a jelenlegi backend telepítését a teljes biztonsági frissítéssel kell befejezni. A weboldal normál `users` adminfiókot használ, PocketBase-superuser belépést nem.
