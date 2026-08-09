"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { modules } from "@/platform/content/registry";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const otherLocale = locale === "zh" ? "en" : "zh";
  const localePath = pathname.replace(/^\/(zh|en)/, "") || "/";
  const pathParts = localePath.split("/").filter(Boolean);
  const pathModuleId = pathParts[0] === "learn" || pathParts[0] === "labs" ? pathParts[1] : undefined;
  const pathModule = pathModuleId ? modules.find((module) => module.id === pathModuleId) : undefined;
  const localeHref = pathModule && !pathModule.locales.includes(otherLocale as "zh" | "en") ? `/${otherLocale}/paths` : `/${otherLocale}${localePath}`;
  const primaryItems = [
    { href: `/${locale}/paths`, label: t("nav.learn") },
    { href: `/${locale}#curriculum`, label: t("nav.curriculum") },
    { href: `/${locale}/progress`, label: t("nav.progress") },
  ];
  const toolItems = [
    { href: `/${locale}/flows`, label: t("nav.flow"), description: t("nav.flowDescription") },
    { href: `/${locale}/labs/${pathModule?.id ?? (locale === "en" ? "ledger" : "prediction-markets")}`, label: t("nav.lab"), description: t("nav.labDescription") },
    { href: `/${locale}/challenges`, label: t("nav.challenge"), description: t("nav.challengeDescription") },
    { href: `/${locale}/glossary`, label: t("nav.glossary"), description: t("nav.glossaryDescription") },
    { href: `/${locale}/journal`, label: t("nav.journal"), description: t("nav.journalDescription") },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href={`/${locale}`} aria-label={t("site.name")}>
          <span className="brand__mark" aria-hidden="true">⌁</span>
          <span><strong>{t("site.shortName")}</strong><small>ONCHAIN MECHANICS</small></span>
        </Link>
        <nav aria-label={t("nav.primary")}>
          {primaryItems.map((item) => {
            const active = item.href.includes("#") ? pathname === `/${locale}` : pathname.startsWith(item.href);
            return <Link className={active ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>;
          })}
        </nav>
        <div className="site-header__utilities">
          <details className="site-header__tools">
            <summary>{t("nav.tools")}<span aria-hidden="true">⌄</span></summary>
            <div className="site-header__tools-menu">
              <p><strong>{t("nav.tools")}</strong><small>{t("nav.toolsDescription")}</small></p>
              {toolItems.map((item) => <Link href={item.href} key={item.href}><strong>{item.label}</strong><small>{item.description}</small></Link>)}
            </div>
          </details>
          <Link className="locale-switcher" href={localeHref}>{t("locale.switchTo")}</Link>
        </div>
      </div>
    </header>
  );
}
