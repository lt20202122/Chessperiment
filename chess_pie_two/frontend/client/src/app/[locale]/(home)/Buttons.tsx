"use client"
import { Zilla_Slab, Lexend } from 'next/font/google';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const zillaSlab = Zilla_Slab({
    weight: ['400', '700'],
    subsets: ['latin'],
});

const lexend = Lexend({
    weight: ['400'],
    subsets: ['latin'],
});

export default function Btn() {
    const router = useRouter()

    return (
    <div className='flex items-center flex-col gap-9 pt-10'>
    <button 
    type="button" className={`-mb-4 block lg:h-[78px] lg:w-[577px] md:h-[60px] md:w-[400px] p-0 overflow-hidden cursor-pointer
        hover:scale-104 transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px] rounded-[10px]
        shadow-playShadow ${zillaSlab.className} mt-1 active:scale-95`} 
    style={{
        backgroundImage:"url('/PlayBtn.png')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
        color:"#F2FF00",
        textShadow:"-2px 2px 0 #F2FF0080",
        lineHeight:"30px",
        caretColor:"transparent",
        willChange:"transform",
        backfaceVisibility:"hidden",
        transformStyle:"preserve-3d",
    }}
        onClick={() => {
            router.push("/game")
    }}>
        Play</button>

        
    <div className="relative group pt-4 rounded-[10px]">
    <button type="button" className={`block lg:h-[78px] lg:w-[577px] md:h-[60px] md:w-[400px] p-0 -mb-4
        cursor-not-allowed
        transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px]
        shadow-playShadow ${zillaSlab.className} mt-1
        before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-[hsla(0,0%,0%,0.5)] before:rounded-[10px]
        
        `}
    style={{
        backgroundImage:"url('/Board2.1.jpg')",
        backgroundSize:"cover",
        backgroundRepeat:"no-repeat",
        backgroundPosition:"center",
        color:"#F2FF00",
        textShadow:"-2px 2px 0 #F2FF0080",
        lineHeight:"30px",
        caretColor:"transparent",
        willChange:"transform",
        backfaceVisibility:"hidden",
        transformStyle:"preserve-3d",
        borderRadius:"10px"
    }}
        onClick={() => {
            //router.push("/create")
    }}>Create
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-max
                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity delay-500 duration-300
                    bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg cursor-auto -mb-1
                    ${lexend.className}`}>
        <p className="text-center text-shadow-none">Feature not available yet. <Link
            href="/features/create"
            className="underline hover:text-yellow-300"
        >Learn more</Link>
        </p>
    </div>
    </button>

    </div>
    <div className="relative group pt-4 rounded-[10px]">
    <button
        type="button"
        onClick={()=>null}
        className={`relative block lg:h-[78px] lg:w-[577px] p-0 md:h-[60px] md:w-[400px] rounded-[10px]
            transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem]
            leading-5 lg:leading-[30px] shadow-playShadow ${zillaSlab.className}
            before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-[hsla(0,0%,0%,0.5)] before:rounded-[10px] before:z-10 cursor-not-allowed
            `}
        style={{
            color: "#F2FF00",
            textShadow: "-2px 2px 0 #F2FF0080",
            lineHeight: "30px",
            caretColor: "transparent",
            willChange: "transform",
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            borderRadius:"10px"
        }}
        >
        <video
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
            borderRadius:"10px"
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
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-max
                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity delay-500 duration-300
                    bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg cursor-auto -mb-1
                    ${lexend.className}`}>
        <p className="text-center text-shadow-none">Feature not available yet. <Link
            href="/features/analyze"
            className="underline hover:text-yellow-300"
        >Learn more</Link>
        </p>
    </div>
        </button>
    </div>

    </div>
    );
}