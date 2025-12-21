"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function HomepageButton() {
    const router = useRouter()
    const t = useTranslations('Analyze');
    return (
        <Button variant="secondary" onClick={() => { router.push("/") }} className="bg-blue-400 text-black">{t('goBackHome')}</Button>
    )
}