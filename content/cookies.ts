import type { LegalDocument } from "./legal";
import { site } from "./site";
import booking from "./booking.json" with { type: "json" };

export const cookieDocument: LegalDocument = {
  slug: "suti-tajekoztato",
  label: "Süti- és tárhelytájékoztató",
  title: "Tájékoztatás a sütik és a böngésző helyi tárhelyének használatáról",
  description:
    "Az ügyfélportál által alkalmazott tárolási technológiák, azok célja, élettartama és kezelési lehetőségei.",
  download: {
    filename: "suti-tajekoztato.txt",
    label: "Süti- és tárhelytájékoztató letöltése (.txt)",
  },
  sections: [
    {
      id: "adatkezelo",
      title: "Az adatkezelő és a tájékoztató hatálya",
      paragraphs: [
        `Jelen tájékoztató a ${site.legal.companyName} által üzemeltetett ügyfélportál sütijeinek és böngészőben tárolt beállításainak használatát ismerteti. Adatvédelmi kérdésben a ${site.legal.privacyEmail} e-mail-címen kérhető tájékoztatás. Az adatkezelő részletes adatai és a személyes adatok kezelésére vonatkozó információk az Adatkezelési Tájékoztatóban és az Impresszumban találhatók.`,
      ],
      links: [
        {
          label: "Adatkezelési Tájékoztató",
          href: "/adatkezelesi-tajekoztato",
        },
        { label: "Impresszum", href: "/impresszum" },
      ],
    },
    {
      id: "helyi-tarhely",
      title: "A tárolás célja és alkalmazási köre",
      paragraphs: [
        "A süti a böngésző által a webhelyhez kapcsolódóan tárolt adat. A helyi tárhely (localStorage) az adott webhely megjelenítési beállításának megőrzésére szolgál. Az ügyfélportál bejelentkezési és vendégfoglalási azonosítókat, valamint a felhasználó által kiválasztott megjelenítési témát tárolja. A fiók-, jármű- és időpontadatok központi tárolása a szolgáltató szerverén történik.",
        "A bejelentkezési és vendégfoglalási sütik a felhasználó által kért hozzáférési funkciókhoz szükségesek. A világos vagy sötét téma megjegyzése a felhasználó saját témaválasztásához kapcsolódó beállítás; a portál használata nem függ ettől a választástól. Az alkalmazás nem használ statisztikai, hirdetési vagy látogatók közötti követésre szolgáló tárolóelemet.",
        "A végberendezésen történő információtárolásra és az ott tárolt információhoz való hozzáférésre az elektronikus hírközlésről szóló 2003. évi C. törvény 155. § (4) bekezdése és az alkalmazandó uniós szabályok irányadók. Az azonosítókhoz kapcsolódó személyes adatok kezelésének céljait, jogalapjait és az érintetti jogokat az Adatkezelési Tájékoztató részletezi.",
      ],
    },
    {
      id: "tarolok",
      title: "Az alkalmazott sütik és helyi tárolási elemek",
      facts: [
        {
          label: "__Host-fairauto_session",
          value:
            "Első féltől származó bejelentkezési süti az ügyfélportál saját tartományán. Célja a sikeres bejelentkezés után a munkamenet azonosítása. Legfeljebb 8 óráig érvényes; kijelentkezéskor a böngészőből törlődik. Secure, HttpOnly és SameSite=Lax védelemmel rendelkezik. Nem marketingcélú.",
        },
        {
          label: "__Host-fairauto_guest",
          value: `Első féltől származó hozzáférési süti az ügyfélportál saját tartományán, a felhasználó által megnyitott vendégfoglalási funkcióhoz. Véletlen azonosítóval biztosítja az adott böngészőből a saját vendégkérések elérését. Legfeljebb ${booking.guestCookieDays} napig érvényes; a vendégfoglalási funkció ismételt megnyitásakor ez az idő megújulhat. Secure, HttpOnly és SameSite=Lax védelemmel rendelkezik. Nem marketingcélú.`,
        },
        {
          label: "fairauto-theme",
          value:
            "A böngésző helyi tárhelyében (localStorage) tárolt megjelenítési beállítás, amely a felhasználó által kiválasztott világos vagy sötét témát jegyzi meg. Az alkalmazás nem állít be automatikus lejáratot; az érték a témaválasztás módosításával felülírható, illetve a webhelyadatok törlésével eltávolítható. Nem bejelentkezési azonosító és nem szolgál követésre.",
        },
      ],
    },
    {
      id: "beallitasok",
      title: "A sütik és a helyi tárhely kezelése",
      paragraphs: [
        "A sütik és a helyi tárhely a böngésző adatvédelmi vagy webhelybeállításai között tekinthetők meg, törölhetők és korlátozhatók. A témaválasztás a webhely témaváltó gombjával is módosítható. A szükséges sütik letiltása esetén a bejelentkezés és a vendégkérésekhez kapcsolódó hozzáférés nem vagy csak korlátozottan működik.",
        "A böngésző webhelyadatainak törlése nem törli a szolgáltató szerverén tárolt fiók-, jármű- vagy időpontadatokat. A munkamenetsüti törlése után ismét be kell jelentkezni. A vendéghozzáférési süti törlése vagy lejárata esetén az adott böngészőből a vendégkérések online elérése megszűnhet; ilyen esetben telefonon kérhető segítség a szerviztől. A foglalási azonosító önmagában nem biztosít hozzáférést a személyes adatokhoz.",
        "Privát böngészés, a böngésző saját törlési szabályai vagy a webhelyadatok korlátozása a tárolási időt lerövidítheti. A korábbi webhelyváltozatokból esetleg megmaradt helyi adatok szintén a böngésző webhelyadatainak törlésével távolíthatók el; az ügyfélportál ezeket nem használja bejelentkezéshez vagy időpontkezeléshez.",
      ],
    },
    {
      id: "betukeszletek",
      title: "Tárhely és külső technikai szolgáltatások",
      paragraphs: [
        "A webes alkalmazást a Vercel szolgálja ki; a központi adatbázist a szolgáltató saját PocketBase-szervere kezeli, Cloudflare hálózati közvetítéssel. A weboldal kiszolgálásához kapcsolódó hálózati és biztonsági adatkezelés részleteit az Adatkezelési Tájékoztató ismerteti. A hálózati szolgáltató által esetleg alkalmazott külön biztonsági ellenőrzésekre annak saját tájékoztatója is vonatkozik.",
        "A betűkészletek a webhely saját állományaiból töltődnek be; az alkalmazás nem kezdeményez Google Fonts-kérést. A felületen nincs beépített analitikai követés, hirdetési követőkód vagy automatikusan betöltődő külső térkép.",
      ],
      links: [
        {
          label: "Adatkezelési Tájékoztató",
          href: "/adatkezelesi-tajekoztato",
        },
        {
          label: "2003. évi C. törvény – Nemzeti Jogszabálytár",
          href: "https://njt.jog.gov.hu/jogszabaly/2003-100-00-00",
        },
        {
          label: "NAIH – tájékoztatás a sütikről",
          href: "https://www.naih.hu/suti-tajekoztato",
        },
        {
          label: "Cloudflare – sütik és technikai céljaik",
          href: "https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/",
        },
      ],
    },
  ],
};
