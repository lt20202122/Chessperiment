import styles from "./legal-notice.module.css";
import { useTranslations } from "next-intl";

export default function LegalNotice() {
    const t = useTranslations("LegalNotice");

    return (
        <div className={styles.container}>
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
