import { Provider } from "@/components/provider";

// App Router layouts survive sidebar navigation, preserving the resolved account.
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider>{children}</Provider>;
}
