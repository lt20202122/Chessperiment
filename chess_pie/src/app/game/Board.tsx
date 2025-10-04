export default function Board() {
    let isWhite = true;
    let content = [];

    for (let i = 0; i < 8; i++) {
    for (let a = 0; a < 8; a++) {
        content.push(
        <div
            key={`${i}-${a}`}
            className={`${isWhite ? "bg-gray-50" : "bg-BoardGreen1"} h-[80px] w-[80px] m-0 aspect-square`}
        />
        );
        isWhite = !isWhite;
    }
    isWhite = !isWhite;
    }

    return <div className="w-[643px] grid grid-cols-8 gap-0 custom-grid border-black border-2">{content}</div>;
}