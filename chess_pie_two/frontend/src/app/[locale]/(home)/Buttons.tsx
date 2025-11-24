"use client"
import { Zilla_Slab } from 'next/font/google';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

const zillaSlab = Zilla_Slab({
    weight: ['400', '700'],
    subsets: ['latin'],
});

export default function Btn() {
    const router = useRouter()
    const analyzeVid = useRef<HTMLVideoElement | null>(null)

    const handleMouseEnter = () => {
        analyzeVid.current?.play()
    }

    const handleMouseLeave = () =>{
        analyzeVid.current?.pause()
    }
    return (
    <div className='flex items-center flex-col gap-9 pt-10'>
    <button 
    type="button" className={`block lg:h-[78px] lg:w-[577px] md:h-[60px] md:w-[400px] p-0 overflow-hidden cursor-pointer
        hover:scale-104 transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px]
        shadow-playShadow ${zillaSlab.className} mt-1`} 
    style={{
        backgroundImage:"url('PlayBtn.png')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
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
            router.push("/game")
    }}>
        Play</button>
    <button type="button" className={`block lg:h-[78px] lg:w-[577px] md:h-[60px] md:w-[400px] p-0 overflow-hidden cursor-pointer
        hover:scale-104 transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px]
        shadow-playShadow ${zillaSlab.className} mt-1`} 
    style={{
        backgroundImage:"url('Board2.1.jpg')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
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
            router.push("/create")
    }}>Create</button>
    <button
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        type="button"
        onClick={()=>null}
        className={`relative block lg:h-[78px] lg:w-[577px] p-0 md:h-[60px] md:w-[400px] overflow-hidden cursor-pointer
            hover:scale-104 transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem]
            leading-5 lg:leading-[30px] shadow-playShadow ${zillaSlab.className} mt-1`}
        style={{
            color: "#F2FF00",
            textShadow: "-2px 2px 0 #F2FF0080",
            lineHeight: "30px",
            borderRadius: "10px",
            caretColor: "transparent",
            willChange: "transform",
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
        }}
        >
        <video
            ref={analyzeVid}
            src="/Analyze.mp4"
            loop
            muted
            playsInline
            style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
            }}
        />

        <span
            style={{
            position: "relative",
            zIndex: 1,
            }}
        >
            Analyze
        </span>
        </button>

    </div>
    );
}