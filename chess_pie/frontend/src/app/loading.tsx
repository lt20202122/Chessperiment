import { Square } from 'ldrs/react'
import 'ldrs/react/Square.css'

export default function Loading(){
    return (
        <div className="w-screen h-screen flex justify-center">
            <h1 className="mb-30 text-9xl">ChessPie</h1>
            <Square
                size="80"
                stroke="6"
                strokeLength="0.25"
                bgOpacity="0.22"
                speed="1.2"
                color="rgb(115,117,0)" 
            />
            </div>
        
    )
}
