// // app/announcements/[id]/page.tsx
// import { getAnnouncementById } from "@/components/announcemnt"
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

// export async function generateMetadata({ params }: { params: any }) {
//     const announcement = await getAnnouncementById(params.id);
//      const canonicalUrl = `https://chesspie.de/announcements/${params.id}`;
//     return {
//         title: announcement.title,
//         description: announcement.summary || announcement.content.slice(0, 160),
//         openGraph: {
//             title: announcement.title,
//             description: announcement.summary || announcement.content.slice(0, 160),
//             url: `https://chesspie.de/announcements/${announcement.id}`,
//             siteName: 'ChessPie',
//             images: [announcement.image || '/og-announcement-default.png'],
//             type: 'article',
//         },
//         twitter: {
//             card: 'summary_large_image',
//             title: announcement.title,
//             description: announcement.summary || announcement.content.slice(0, 160),
//             images: [announcement.image || '/og-announcement-default.png'],
//         },
//         alternates: { canonical: canonicalUrl },
//         languages: hreflangs.reduce((acc, tag) => {
//      acc[tag.hrefLang] = tag.href;
//      return acc;
//    }, {} as Record<string, string>),
//     };
// }

function jsonLd_forAnnouncement(a: any) {
    // a: { id, slug, title, summary, content, imageUrl, datePublished, dateModified, authorName }
    return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": a.title,
        "description": a.summary || a.content?.slice(0, 160),
        "image": a.imageUrl || "https://chesspie.de/static/og-announcement-default.png",
        "datePublished": a.datePublished,
        "dateModified": a.dateModified || a.datePublished,
        "author": { "@type": "Person", "name": a.authorName || "ChessPie Team" },
        "publisher": {
            "@type": "Organization",
            "name": "ChessPie",
            "logo": { "@type": "ImageObject", "url": "https://chesspie.de/static/logo.svg" }
        },
        "mainEntityOfPage": `https://chesspie.de/announcements/${a.id}`
    };
}


export default function AnnouncementPage() {
    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_forAnnouncement).replace(/</g, '\\u003c') }}
        />
    </>
}