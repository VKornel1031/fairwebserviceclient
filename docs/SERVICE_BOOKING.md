# Szolgáltatások és telefonos műszaki vizsga

A gumiszerviz kikerült a kínálatból. Online karbantartásra/javításra, diagnosztikára és egyéb szervizigényre kérhető időpont. A **Műszaki vizsga** tájékoztató kártyaként jelenik meg, nem választható szolgáltatásként; időpontegyeztetés telefonon:

- **06 20 347 3705** – `tel:+36203473705`
- **06 20 405 6299** – `tel:+36204056299`

A `content/booking.json` szolgáltatásainál a `bookingMode` értéke `online` vagy `phone`. A `phoneContacts` a webhelyen és az új időpontértesítésekben megjelenő telefonszámok közös, szerkeszthető forrása. A korábbi helyi levélbeállítás és SMTP-hitelesítés megmarad.

A weboldal szervere és a PocketBase hook is elutasítja a telefonos szolgáltatás új online kérését, elérhetőség-lekérését és online átütemezését. A régi időpontok adatmásolatai megmaradnak: továbbra megtekinthetők és lemondhatók. A változás nem töröl autót vagy fiókot.

## CasaOS-frissítés

**Új adatbázis-migráció nincs.** A meglévő `pocketbase` konténerbe ezt a három fájlt kell bemásolni, majd újraindítani. A parancsok nem írják felül a `fairauto-mail.json` kapcsolóit vagy a Gmail SMTP-beállítást.

```sh
sudo mkdir -p /DATA/AppData/pocketbase/pb_hooks &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/content/booking.json -o /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-appointments.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo curl -fL https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/main/pocketbase/pb_hooks/fairauto-mail.js -o /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-booking.json pocketbase:/pocketbase/pb_hooks/fairauto-booking.json &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-appointments.js pocketbase:/pocketbase/pb_hooks/fairauto-appointments.js &&
sudo docker cp /DATA/AppData/pocketbase/pb_hooks/fairauto-mail.js pocketbase:/pocketbase/pb_hooks/fairauto-mail.js &&
sudo docker restart pocketbase
```

A már sikeresen elküldött leveleket nem küldi újra. A frontend a telepítésétől kezdve a friss kínálatot mutatja és tiltja az online műszaki vizsgát; a fenti másolás a közvetlen PocketBase API-ra is alkalmazza a szabályt. A közös feltételverzió továbbra `2026-11-01.5-draft`.
