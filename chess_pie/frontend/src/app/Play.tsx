import { useModal } from '@/components/modalContext'
import {useRef} from 'react'
import './Play.css'

export default function PlayModal() {
    const btnRef = useRef<HTMLButtonElement>(null);
    const {modalOpen, setModalOpen} = useModal()
    return (
        <div
        className={`fixed inset-0 bg-black/50 flex justify-center items-center transition-opacity duration-300 ${
            modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } px-4`}
        onClick={()=>{
            setModalOpen(false)
        }}
        >
        <div className="bg-white p-6 rounded shadow text-color-black mx-2"
            onClick={(e) => e.stopPropagation()}>
            <button type="button"
            className="cursor-pointer rounded-[10px] py-2 w-[80vw] sm:w-[60vw] bg-amber-400
            hover:scale-[104%] transition-all duration-400"
            style={{
                animationName:"BtnClick",
                animationDuration:"3s",
                animationDelay:"0s",
                animationPlayState:"paused",
                animationTimingFunction:"ease-in-out",
            }} ref={btnRef}
            onClick={ ()=>{
                if (btnRef.current) {
                    btnRef.current.style.animationPlayState="running"
                }
            }}>Play online</button>
        </div>
    </div>
)
}