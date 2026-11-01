# Gmail SMTP a PocketBase-ben

A CasaOS gépen a külső 25-ös port elutasítja a kapcsolatot, a Gmail 587-es portja elérhető. Az üzemeltető 2026-11-01-én megerősítette, hogy a kívánt céges feladóról küldött levél is megérkezik. A működő hitelesítést a végső frissítés megőrzi. A PocketBase közvetlen SMTP-küldése megkerüli a helyi Sendmail továbbítását; alkalmazáskód vagy Vercel-kulcs nem kell hozzá.

1. A küldő Google-fiókban engedélyezd a kétlépcsős azonosítást, majd az [Alkalmazásjelszavak](https://myaccount.google.com/apppasswords) oldalon hozz létre egy PocketBase-jelszót.
2. A PocketBase **Settings → Mail settings** oldalán kapcsold be az SMTP-t.
3. A jelszót közvetlenül a PocketBase-be írd. Ne küldd el csevegésben, ne írd Vercel-változóba vagy a repóba.

| Beállítás      | Érték                   |
| -------------- | ----------------------- |
| Host           | `smtp.gmail.com`        |
| Port           | `587`                   |
| Username       | Teljes Gmail-cím        |
| Password       | Google-alkalmazásjelszó |
| Auth method    | `PLAIN`                 |
| TLS kapcsoló   | Kikapcsolva             |
| Sender address | Ugyanaz a Gmail-cím     |
| Sender name    | `Fair Autószerviz`      |

**PocketBase 0.26.3 / 0.26.6 esetén** a TLS kapcsoló közvetlen, implicit TLS-t választ. Az 587-es porton kikapcsolt kapcsoló mellett a kliens STARTTLS-re vált, mielőtt hitelesít. Ez továbbra titkosított kapcsolat; a `PLAIN` hitelesítés TLS nélkül nem küldi ki a jelszót távoli szervernek. Más PocketBase-verziónál ellenőrizd a felület jelentését.

Mentsd a beállítást és küldj tesztet a saját postaládádba. A sikeres PocketBase-válasz mellett a tényleges beérkezést is ellenőrizd.

## Ha nincs Alkalmazásjelszavak menüpont

A kétlépcsős azonosítás hiánya, szervezeti Google Workspace-szabály vagy speciális fiókvédelem miatt a Google nem feltétlenül kínál alkalmazásjelszót. [Google súgó](https://support.google.com/accounts/answer/185833). Szervezeti fióknál a rendszergazda állíthatja be a megengedett küldési módot. Más szolgáltatónál vezetett céges postafiókhoz annak SMTP-beállításai szükségesek, nem a Gmail alkalmazásjelszó-oldala.

A működő Gmail-fiók saját feladócímével tesztelhető a levelezés. Céges feladót csak a szolgáltatónál engedélyezett címmel használj. A személyes Gmail-fiók küldési korlátai és a Google levéladat-kezelése miatt az üzemi postafiókot, hozzáférést és adatkezelési tájékoztatást az üzemeltetőnek kell a tényleges szolgáltatáshoz igazítania.

## Időpontértesítések

Az időpontértesítések a PocketBase aktuális `newMailClient()` beállítását használják. A már engedélyezett `fairauto-mail.json` konfigurációt nem kell lecserélni. Bekapcsolás és az admin újrapróbálás gombja: [APPOINTMENT_PRICES_AND_MAIL.md](./APPOINTMENT_PRICES_AND_MAIL.md).

Az SMTP-re váltás az új küldésekre és az alkalmazás még várakozó feladataira vonatkozik. A helyi Sendmailnek korábban sikeresen átadott tesztlevelek a host saját sorában maradnak; ez a beállítás nem küldi újra és nem törli azokat. Az alkalmazás `sent` állapota továbbra a levélkiszolgáló átvételét jelenti, nem postaládai kézbesítési igazolást.

Az e-mailes fiókellenőrzés és jelszó-visszaállítás migrációja, magyar sablonjai és a meglévő CasaOS telepítés frissítése: [FINAL_UPDATE.md](./FINAL_UPDATE.md).
