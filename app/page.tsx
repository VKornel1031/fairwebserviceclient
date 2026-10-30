import { site } from "@/content/site";
import type { Metadata } from "next";
import Home from "@/components/home";
import "./home.css";
export const metadata: Metadata = {
  title: `${site.shortName} · Jó kezekben, már az első időponttól`,
  description: `Foglalj szervizidőpontot egyszerűen. ${site.name}: vendégfoglalás, saját garázs és céges flottakezelés egy helyen. Bemutató oldal.`,
};
export default function Page() {
  return <Home />;
}
