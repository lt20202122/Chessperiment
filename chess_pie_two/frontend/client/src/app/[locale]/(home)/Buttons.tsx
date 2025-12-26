"use client"
import { Zilla_Slab, Lexend } from 'next/font/google';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Play, Plus, ScanEye } from 'lucide-react';

const zillaSlab = Zilla_Slab({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: "swap"
});

const lexend = Lexend({
    weight: ['400'],
    subsets: ['latin'],
    display: "swap"
});

export default function Btn() {
    const t = useTranslations('Homepage');
    const router = useRouter()

    return (
        <div className='flex items-center flex-col gap-9 pt-10 px-4'>
            <button
                type="button" className={`-mb-4 block lg:h-[78px] w-full max-w-xl md:max-w-lg sm:max-w-sm h-[60px] p-0 overflow-hidden cursor-pointer
        transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px] rounded-[10px]
        shadow-playShadow ${zillaSlab.className} mt-1 active:scale-95 group`}
                style={{
                    backgroundImage: "url('/PlayBtn.webp')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    color: "#F2FF00",
                    textShadow: "-2px 2px 0 #F2FF0080",
                    lineHeight: "30px",
                    caretColor: "transparent",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                }}
                onClick={() => {
                    router.push("/game")
                }}>
                <div className="flex items-center justify-center gap-4 w-full h-full">
                    <span>{t('play')}</span>
                    <Play className="w-10 h-10 stroke-[3px] group-hover:scale-110 transition-transform duration-300" style={{ filter: "drop-shadow(-2px 2px 0 #F2FF0080)" }} />
                </div>
            </button>


            <div className="relative group pt-4 rounded-[10px] w-full max-w-xl md:max-w-lg sm:max-w-sm">
                <button type="button" className={`block lg:h-[78px] w-full h-[60px] p-0 -mb-4
        cursor-pointer
        transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem] leading-5 lg:leading-[30px]
        shadow-playShadow ${zillaSlab.className} mt-1
        group
        `}
                    style={{
                        backgroundImage: "url('/Board2.1.webp')",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        color: "#F2FF00",
                        textShadow: "-2px 2px 0 #F2FF0080",
                        lineHeight: "30px",
                        caretColor: "transparent",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        transformStyle: "preserve-3d",
                        borderRadius: "10px"
                    }}
                    onClick={() => {
                        router.push("/editor/board")
                    }}>
                    <div className="relative z-10 flex items-center justify-center gap-4 w-full h-full">
                        <span>{t('create')}</span>
                        <Plus className="w-10 h-10 stroke-[3px] group-hover:scale-110 transition-transform duration-300" style={{ filter: "drop-shadow(-2px 2px 0 #F2FF0080)" }} />
                    </div>
                </button>

            </div>
            <div className="relative group pt-4 rounded-[10px] w-full max-w-xl md:max-w-lg sm:max-w-sm">
                <button
                    type="button"
                    onClick={() => null}
                    className={`relative block lg:h-[78px] w-full h-[60px] rounded-[10px]
            transition-all duration-400 antialiased lg:text-[2.8rem] text-[2rem]
            leading-5 lg:leading-[30px] shadow-playShadow ${zillaSlab.className}
            before:absolute before:w-full before:h-full before:left-0 before:top-0 before:bg-[hsla(0,0%,0%,0.5)] before:rounded-[10px] before:z-10 cursor-not-allowed
            group
            `}
                    style={{
                        color: "#F2FF00",
                        textShadow: "-2px 2px 0 #F2FF0080",
                        lineHeight: "30px",
                        caretColor: "transparent",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                        transformStyle: "preserve-3d",
                        borderRadius: "10px"
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
                            borderRadius: "10px"
                        }}
                    />

                    <div
                        className="relative z-20 flex items-center justify-center gap-4 w-full h-full"
                    >
                        <span>{t('analyze')}</span>
                        <ScanEye className="w-10 h-10 stroke-[3px] group-hover:scale-110 transition-transform duration-300" style={{ filter: "drop-shadow(-2px 2px 0 #F2FF0080)" }} />
                    </div>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-max
                    invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity delay-500 duration-300
                    bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg cursor-auto -mb-1
                    ${lexend.className}`}>
                        <p className="text-center text-shadow-none">{t('notAvailable')} <Link
                            href="/features/analyze"
                            className="underline hover:text-yellow-300"
                        >{t('learnMore')}</Link>
                        </p>
                    </div>
                </button>
            </div>

        </div>
    );
}