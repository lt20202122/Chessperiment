"use client"
import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Header } from "./Header";
import { useLocale } from "next-intl";
import { MobileMenu } from "./MobileMenu";

export function HeaderWrapper() {
    const pathname = usePathname();
    const locale = useLocale();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return <>
        <MobileMenu locale={locale} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <Header pathname={pathname} locale={locale} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </>;
}
