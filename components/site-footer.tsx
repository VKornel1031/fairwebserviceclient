import type { ReactNode } from "react";
import { site } from "@/content/site";
import LegalLinks from "./legal-links";

export default function SiteFooter({
  className = "",
  contentClassName = "",
  current,
  children,
}: {
  className?: string;
  contentClassName?: string;
  current?: string;
  children?: ReactNode;
}) {
  return (
    <footer className={`site-footer ${className}`}>
      <div className={`site-footer-inner ${contentClassName}`}>
        <span className="site-footer-copyright">
          © {new Date().getFullYear()} {site.name}
        </span>
        {children && <div className="site-footer-actions">{children}</div>}
        <LegalLinks current={current} />
        <span className="site-footer-credit">
          Made by kodi <span aria-hidden="true">❤️</span>
        </span>
      </div>
    </footer>
  );
}
