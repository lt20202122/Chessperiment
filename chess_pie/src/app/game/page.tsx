
export default function Board () {
    let isWhite = true;
    let content=[];
    for (let i = 0; i < 64; i++) {
        content.push(<div className={`${isWhite ? "bg-white":"bg-black"}`} key={i} />)
        isWhite = !isWhite
    }
    return (
        <div>
            {content}
        </div>
    )
}