import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from '@/i18n/navigation';
import styles from "./legal-notice.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.LegalNotice' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/legal-notice`,
            languages: {
                'en': 'https://chessperiment.app/en/legal-notice',
                'de': 'https://chessperiment.app/de/legal-notice'
            }
        },
    };
}

export default async function LegalNotice({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "LegalNotice" });

    return (
        <div className={styles.container}>
            <div className="mb-6">
                <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                    ← chessperiment
                </Link>
            </div>
            <h1 className={styles.title}>{t("title")}</h1>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("providerHeading")}</h2>
                <p className={styles.text}>{t("providerName")}</p>
                <p className={styles.text}>{t("providerAddress")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("contactHeading")}</h2>
                <p className={styles.text}>
                    {t("emailLabel")}{" "}
                    <a href={`mailto:${t("emailValue")}`} className={styles.link}>
                        {t("emailValue")}
                    </a>
                </p>
                <p className={styles.text}>
                    {t("phoneLabel")} {t("phoneValue")}
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("copyrightHeading")}</h2>
                <p className={styles.text}>{t("copyrightText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("socialMediaHeading")}</h2>
                <p className={styles.text}>{t("socialMediaText")}</p>
                <p className={styles.text}>
                    {t("youtubeLabel")} /
                </p>
                <p className={styles.text}>
                    {t("otherProfilesLabel")} /
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("disputeResolutionHeading")}</h2>
                <p className={styles.text}>
                    {t("odrText")}{" "}
                    <a
                        href="https://consumer-redress.ec.europa.eu/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        https://ec.europa.eu/consumers/odr
                    </a>
                    .
                </p>
                <p className={styles.text}>{t("vsbgText")}</p>
            </section>

            <footer className={styles.footer}>
                <p className={styles.smallText}>
                    {t("madeWith")}{" "}
                    <a
                        href="https://www.dieter-datenschutz.de/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        {t("dieterLinkText")}
                    </a>
                </p>
            </footer>
        </div>
    );
}
