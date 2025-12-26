import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

// function jsonLd_forProduct(product) {
//   // product: { id, name, description, imageUrl, price, currency, availability, sellerName, ratingValue, reviewCount }
//   const schema = {
//     "@context": "https://schema.org",
//     "@type": "Product",
//     "name": product.name,
//     "description": product.description,
//     "image": product.imageUrl,
//     "sku": product.id,
//     "url": `https://chesspie.de/marketplace/${product.id}`,
//     "offers": {
//       "@type": "Offer",
//       "url": `https://chesspie.de/marketplace/${product.id}`,
//       "priceCurrency": product.currency || "EUR",
//       "price": product.price?.toString() || "0.00",
//       "availability": product.availability || "https://schema.org/InStock"
//     },
//     "seller": { "@type": "Organization", "name": product.sellerName || "ChessPie" }
//   };

//   if (product.reviewCount && product.ratingValue) {
//     schema.aggregateRating = {
//       "@type": "AggregateRating",
//       "ratingValue": product.ratingValue,
//       "reviewCount": product.reviewCount
//     };
//   }

//   return schema;
// }
//NOTE: Add the index at #INDEX
// import { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Marketplace Item #INDEX | ChessPie',
//   description: 'Entdecke und kaufe individuelle Schachfiguren und Boards im ChessPie Marketplace.',
//   alternates: {
//     canonical: 'https://chesspie.de/marketplace/INDEX',
//     languages: {
//       'de': 'https://chesspie.de/de/marketplace/INDEX',
//       'en': 'https://chesspie.de/en/marketplace/INDEX',
//     },
//   },
//   openGraph: {
//     title: 'Marketplace Item #INDEX | ChessPie',
//     description: 'Entdecke und kaufe individuelle Schachfiguren und Boards im ChessPie Marketplace.',
//     url: 'https://chesspie.de/marketplace/INDEX',
//     type: 'website',
//     images: [
//       {
//         url: 'https://chesspie.de/opengraph-images/marketplace-INDEX.png',
//         width: 1200,
//         height: 630,
//         alt: 'Marketplace Item #INDEX | ChessPie',
//       },
//     ],
//   },
//   twitter: {
//     card: 'summary_large_image',
//     title: 'Marketplace Item #INDEX | ChessPie',
//     description: 'Entdecke und kaufe individuelle Schachfiguren und Boards im ChessPie Marketplace.',
//     images: ['https://chesspie.de/opengraph-images/marketplace-INDEX.png'],
//   },
//   icons: {
//     icon: '/favicon.ico',
//     shortcut: '/favicon.ico',
//     apple: '/apple-touch-icon.png',
//   },
//   metadataBase: new URL('https://chesspie.de'),
//   other: {
//     jsonLd: {
//       '@context': 'https://schema.org',
//       '@type': 'Product',
//       name: 'Marketplace Item #INDEX',
//       description: 'Individuelles Schachstück oder Board im ChessPie Marketplace.',
//       url: 'https://chesspie.de/marketplace/INDEX',
//       brand: {
//         '@type': 'Brand',
//         name: 'ChessPie',
//       },
//       offers: {
//         '@type': 'Offer',
//         url: 'https://chesspie.de/marketplace/INDEX',
//         priceCurrency: 'EUR',
//         availability: 'https://schema.org/InStock',
//       },
//     },
//   },
// };


export default function MarketplaceIndex() {
    return <>
        {/* <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_home).replace(/</g,'\\u003c') }}
/> */}
    </>
}