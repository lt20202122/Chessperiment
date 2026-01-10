import styles from "./privacypolicy.module.css";
import { useTranslations } from "next-intl";

export default function PrivacyPolicy() {
    const t = useTranslations("PrivacyPolicy");

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.lastUpdated}>{t("lastUpdated")}</p>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("controllerHeading")}</h2>
                <div className={styles.text}>{t("controllerText")}</div>
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
