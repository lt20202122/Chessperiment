import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from '@/i18n/navigation';
import styles from "./privacypolicy.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.PrivacyPolicy' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/privacy-policy`,
            languages: {
                'en': 'https://chessperiment.app/en/privacy-policy',
                'de': 'https://chessperiment.app/de/privacy-policy'
            }
        },
    };
}

export default async function PrivacyPolicy({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });

    return (
        <div className={styles.container}>
            <div className="mb-6">
                <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                    ← chessperiment
                </Link>
            </div>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.lastUpdated}>{t("lastUpdated")}</p>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("controllerHeading")}</h2>
                <div className={styles.text}>{t("controllerText")}</div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("retentionHeading")}</h2>
                <p className={styles.text}>{t("retentionText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("generalHeading")}</h2>
                <p className={styles.text}>{t("generalText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("collectionHeading")}</h2>

                <h3 className={styles.subheading}>{t("accountsSubheading")}</h3>
                <p className={styles.text}>{t("accountsText")}</p>

                <h3 className={styles.subheading}>{t("contentSubheading")}</h3>
                <p className={styles.text}>{t("contentText")}</p>

                <h3 className={styles.subheading}>{t("chatSubheading")}</h3>
                <p className={styles.text}>{t("chatText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("analyticsHeading")}</h2>
                <p className={styles.text}>{t("analyticsText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("hostingHeading")}</h2>
                <p className={styles.text}>{t("hostingText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("cookiesHeading")}</h2>
                <p className={styles.text}>{t("cookiesText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("minorsHeading")}</h2>
                <p className={styles.text}>{t("minorsText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("rightsHeading")}</h2>
                <p className={styles.text}>{t("rightsText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("complaintHeading")}</h2>
                <p className={styles.text}>{t("complaintText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("changesHeading")}</h2>
                <p className={styles.text}>{t("changesText")}</p>
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
