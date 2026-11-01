# A weboldal logója a levelekben

Az időpont- és fióklevelek ugyanazt a `public/images/fair-logo.png` képet használják, mint a weboldal, világos fejlécen. A PNG normál HTTPS-kép, így a levélklienseknek nem kell SVG-t vagy CSS-szűrőt támogatniuk. Képek letiltásakor a cégnév helyettesítő szövegként jelenik meg.

## Már frissített PocketBase

Ha az e-mail-megerősítéses [végső frissítést](./FINAL_UPDATE.md) már telepítetted, az alábbi blokk csak a három fióklevél logóját és az időpontlevél hookját frissíti. A működő SMTP-beállítást, címeket és jogosultságokat megőrzi. Előbb készíts mentést a PocketBase adminfelületén.

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_migrations /DATA/AppData/pocketbase/pb_hooks &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_migrations/1793548800_email_website_logo.js -o /DATA/AppData/pocketbase/pb_migrations/1793548800_email_website_logo.js &&
sudo curl -fsSL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-mail.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker exec pocketbase mkdir -p /pocketbase/fairauto_logo_migrations &&
sudo docker cp /DATA/AppData/pocketbase/pb_migrations/1793548800_email_website_logo.js pocketbase:/pocketbase/fairauto_logo_migrations/1793548800_email_website_logo.js &&
sudo docker exec pocketbase /pocketbase/pocketbase migrate up --dev=false --dir /pocketbase/pb_data --migrationsDir /pocketbase/fairauto_logo_migrations &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js pocketbase:/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker restart pocketbase
```

A parancs a meglévő konténert és a tényleges `/pocketbase/pb_data` adatbázist használja. Ha a korábbi végső frissítés még hiányzik, helyette a [FINAL_UPDATE.md](./FINAL_UPDATE.md) teljes blokkját futtasd; az már ezt a logófrissítést is tartalmazza. Privát repó raw 404-es válaszánál a saját GitHub-hozzáféréseddel töltsd le a két fájlt, majd a `docker` parancsoktól folytasd.

Az időpontlevél képe a meglévő `fairauto-mail.json` `appUrl` címéről, a fiókleveleké a PocketBase **Application / App URL** címéről töltődik. Ezek a weboldal HTTPS-címére mutassanak, amely kiszolgálja az `/images/fair-logo.png` fájlt. A küldött kép URL-je nem tartalmaz fiókadatot vagy tokent. Egy saját címre küldött új tesztlevéllel ellenőrizhető; a korábban elküldött levelek nem módosulnak.
