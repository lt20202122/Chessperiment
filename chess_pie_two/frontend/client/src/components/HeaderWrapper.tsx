"use client"
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { useLocale } from "next-intl";
import { MobileMenu } from "./MobileMenu";

export function HeaderWrapper() {
    const pathname = usePathname();
    const locale = useLocale();
    return <>
        <MobileMenu locale={locale} />
        <Header pathname={pathname} locale={locale} />
    </>;
}
