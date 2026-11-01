import type { Metadata } from "next";
import AccountConfirmation from "@/components/account-confirmation";
import "../(legal)/legal.css";
export const metadata: Metadata = {
  title: "Fiók megerősítése · Fair Autószerviz",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return <AccountConfirmation />;
}
