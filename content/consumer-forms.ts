/** Szerkeszthető nyilatkozatminták. Letöltésük nem jelent beküldést. */
import { site, contactPhoneLabel } from "./site";
const recipientAddress =
  site.legal.complaintsAddress ||
  site.legal.registeredOffice ||
  "[A vállalkozás levelezési címe – kitöltendő]";
export const consumerForms = {
  "elallasi-felmondasi-nyilatkozat.txt": {
    title: "Elállási / felmondási nyilatkozatminta",
    text: `ELÁLLÁSI / FELMONDÁSI NYILATKOZATMINTA
A 45/2014. (II. 26.) Korm. rendelet 2. melléklete alapján, szolgáltatáshoz igazítva.
Csak akkor küldje el, ha a vonatkozó szerződés tekintetében elállási/felmondási jogát gyakorolni kívánja.

Címzett: ${site.legal.companyName}
Postai cím: ${recipientAddress}
E-mail: ${site.legal.complaintsEmail}

Alulírott(ak) kijelentem/kijelentjük, hogy gyakorlom/gyakoroljuk elállási/felmondási jogomat/jogunkat az alábbi szolgáltatás nyújtására irányuló szerződés tekintetében:
Szolgáltatás megnevezése: ______________________________
Szerződés / megrendelés azonosítója (ha van): ______________________________
Szerződéskötés időpontja: ______________________________
A fogyasztó(k) neve: ______________________________
A fogyasztó(k) címe: ______________________________
E-mail a visszaigazoláshoz (ha elektronikus választ kér): ______________________________
Kelt: ______________________________
A fogyasztó(k) aláírása (kizárólag papíron tett nyilatkozat esetén): ______________________________

A nem kívánt rész törlendő. Indokolást nem kötelező megadni.
A letöltés nem továbbít nyilatkozatot. Az egyértelmű nyilatkozatot a vállalkozáshoz kell eljuttatni; e minta használata nem kötelező.
A helyi demó időpontkérése nem javítási szerződés. A minta nem helyettesíti a jogszabály szerint alkalmazandó online elállási funkciót.
`,
  },
  "panaszbejelento.txt": {
    title: "Panaszbejelentő minta",
    text: `PANASZBEJELENTŐ MINTA
Használata nem kötelező; saját szövegű panasz is benyújtható.

Címzett: ${site.legal.companyName}
Postai cím: ${recipientAddress}
E-mail: ${site.legal.complaintsEmail}
Telefon: ${contactPhoneLabel}

Bejelentő neve: ______________________________
Kapcsolattartási / válaszcím: ______________________________
Érintett szolgáltatás, munkalap vagy foglalás azonosítója (ha ismert): ______________________________
A panasz részletes leírása: ______________________________
Kért megoldás (ha van): ______________________________
Csatolt dokumentumok felsorolása (ha vannak): ______________________________
Kelt: ______________________________

Csak a panasz kivizsgálásához szükséges adatot adja meg. Érzékeny adatot, okmánymásolatot vagy bankkártyaadatot ne csatoljon indokolatlanul.
A letöltés önmagában nem nyújt be panaszt. A kitöltött dokumentumot a vállalkozás elérhetőségére kell elküldeni.
`,
  },
};
