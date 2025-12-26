export default function JsonLd() {
    const jsonLd =
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://example.com/#website", //TODO
                "url": "https://example.com/", //TODO
                "name": "ChessPie",
                "description": "A creative board game platform where users design custom boards, pieces, rules, and playable games.",
                "inLanguage": [
                    "en",
                    "de"
                ],
                "publisher": {
                    "@id": "https://example.com/#organization" //TODO
                }
            },
            {
                "@type": "Organization",
                "@id": "https://example.com/#organization", //TODO
                "name": "ChessPie",
                "url": "https://example.com/", //TODO
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://example.com/logo.png" //TODO
                },
                "sameAs": [
                    "https://twitter.com/chesspie", //TODO
                    "https://instagram.com/chesspie", //TODO
                    "https://youtube.com/@chesspie" //TODO
                ]
            },
            {
                "@type": "WebApplication",
                "@id": "https://example.com/#app", //TODO
                "name": "ChessPie",
                "url": "https://example.com/", //TODO
                "applicationCategory": [
                    "GameApplication",
                    "DesignApplication"
                ],
                "operatingSystem": [
                    "Web",
                    "iOS",
                    "Android"
                ],
                "browserRequirements": "Requires modern browser with JavaScript enabled",
                "isAccessibleForFree": true,
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "EUR" //TODO
                },
                "creator": {
                    "@id": "https://example.com/#organization" //TODO
                },
                "description": "ChessPie is a creation-first game platform that lets players design custom boards, pieces, and rules, play their own games, and share creations with others.",
                "audience": {
                    "@type": "Audience",
                    "audienceType": "All ages"
                },
                "featureList": [
                    "Custom board creation",
                    "Custom piece design",
                    "Rule and game mode creation",
                    "Playable user-created games",
                    "Optional account system",
                    "Device-synchronized statistics",
                    "Public visibility of creations",
                    "Marketplace for digital items",
                    "Social sharing and discovery"
                ],
                "interactionStatistic": [
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/CreateAction",
                        "userInteractionCount": 0
                    },
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/PlayAction",
                        "userInteractionCount": 0
                    },
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/ShareAction",
                        "userInteractionCount": 0
                    }
                ]
            },
            {
                "@type": "VideoGame",
                "@id": "https://example.com/#game", //TODO
                "name": "ChessPie",
                "gamePlatform": [
                    "Web",
                    "iOS",
                    "Android"
                ],
                "genre": [
                    "Strategy",
                    "Creative",
                    "Sandbox"
                ],
                "playMode": [
                    "SinglePlayer",
                    "Multiplayer"
                ],
                "description": "A strategy sandbox game where players create, customize, and play original board games.",
                "creator": {
                    "@id": "https://example.com/#organization" //TODO
                }
            },
            {
                "@type": "CreativeWork",
                "@id": "https://example.com/#ugc", //TODO
                "name": "User Created Games and Boards",
                "description": "Publicly visible custom boards, pieces, and games created by users.",
                "creator": {
                    "@type": "Audience",
                    "audienceType": "Users"
                },
                "isAccessibleForFree": true
            }
        ]
    }
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd)
            }}
        />
    );
}
