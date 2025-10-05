export default function Board() {
    let isWhite = true;
    let content = [];

    for (let i = 0; i < 8; i++) {
    for (let a = 0; a < 8; a++) {
        // Check für Ecken:
        const isTopLeft = i === 0 && a === 0;
        const isBottomLeft = i === 0 && a === 7;
        const isTopRight = i === 7 && a === 0;
        const isBottomRight = i === 7 && a === 7;

      // CSS-Klassen für Rundungen:
        const eckenKlasse = `
        ${isTopLeft ? "rounded-tl-md" : ""}
        ${isBottomLeft ? "rounded-tr-md" : ""}
        ${isTopRight ? "rounded-bl-md" : ""}
        ${isBottomRight ? "rounded-br-md" : ""}
        `;
        content.push(
        <div
            key={`${i}-${a}`}
            className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[80px] w-[80px] m-0 aspect-square ${eckenKlasse}`}
        />
        );
        isWhite = !isWhite;
    }
    isWhite = !isWhite;
    }

    return <div className="ml-4 mt-4 grid grid-cols-8 gap-0 custom-grid border-black border-2 w-fit h-fit rounded-[10px]">{content}</div>;
} 