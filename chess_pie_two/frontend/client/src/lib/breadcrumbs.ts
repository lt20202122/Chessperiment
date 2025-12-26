const baseUrl = "https://chesspie.de";

export function generateBreadcrumbs(pathname: string) {
    const segments = pathname.split("/").filter(Boolean); // ["editor", "board"]
    const items = [
        {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
        },
    ];

    segments.forEach((segment, index) => {
        const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
        const itemUrl = `${baseUrl}/${segments.slice(0, index + 1).join("/")}`;
        items.push({
            "@type": "ListItem",
            position: index + 2,
            name,
            item: itemUrl,
        });
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
    };
}
