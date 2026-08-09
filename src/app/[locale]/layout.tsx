import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { SiteHeader } from "@/platform/components/SiteHeader";
import { SiteFooter } from "@/platform/components/SiteFooter";
import type { Metadata } from "next";
import { createLocalizedMetadata, getSeoCopy } from "@/platform/seo";

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = getSeoCopy(locale);
  return {
    ...createLocalizedMetadata({ locale }),
    title: { default: copy.name, template: `%s · ${copy.name}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="site-shell" lang={locale === "en" ? "en" : "zh-CN"}>
        <SiteHeader locale={locale} />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
