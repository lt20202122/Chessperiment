import { useModal } from '@/components/modalContext';


export default function Btn() {
    const {setModalOpen} = useModal()
    return (
    <section className='bg-'>
    <button type="button" className={`block lg:h-[56px] lg:w-[412px] p-0 overflow-hidden cursor-pointer
        hover:scale-102 transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-[100000000px] lg:leading-[30px] ml-130 scale-140
        shadow-playShadow`} 
    style={{
        backgroundImage:"url('PlayBtn.png')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
        fontFamily:'Rockwell',
        color:"#F2FF00",
        textShadow:"-2px 2px 0 #F2FF0080",
        lineHeight:"30px",
        borderRadius:"10px",
        caretColor:"transparent",
        willChange:"transform",
        backfaceVisibility:"hidden",
        transformStyle:"preserve-3d",
    }}
        onClick={() => {
        setModalOpen(true)
    }}>Play</button>
    </section>
    );
}