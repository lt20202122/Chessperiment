import PageClient from './PageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Editor' });
    return {
        title: `${t('newProject')} | Chess Pie`,
    };
}

export default function NewProjectPage() {
    return <PageClient />;
}
