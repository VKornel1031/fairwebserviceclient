import type { Metadata } from "next";
import Home from "@/components/home";
import "./home.css";
export const metadata: Metadata = {
  title: "Fair Autószerviz · Jó kezekben, már az első időponttól",
  description:
    "Foglalj szervizidőpontot egyszerűen a Fair Autószerviz Fehérvárnál. Vendégfoglalás, saját garázs és céges flottakezelés egy helyen. Bemutató oldal.",
};
export default function Page() {
  return <Home />;
}
