"use client"

import { useSession, signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition } from "react"
import { Bungee } from "next/font/google"
import { Trophy, Target, TrendingUp, Calendar } from "lucide-react"
import type { Metadata } from "next"
import { generateHreflangs } from '@/lib/hreflang';
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LibraryGrid from "@/components/editor/LibraryGrid";
import { getUserBoardsAction } from "@/app/actions/library";
import { deleteAccountAction } from "@/app/actions/auth";
import { SavedBoard } from "@/lib/firestore";
import { Library, Trash2, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chessperiment.app');

const bungee = Bungee({
    subsets: ["latin"],
    display: "swap",
    weight: ["400"],
})

interface UserStats {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
}

interface GameHistoryItem {
    id: string
    result: "win" | "loss" | "draw"
    opponent?: string
    timestamp: { seconds: number }
    roomId?: string
}


const jsonLdProfilePage = {
    "@context": "https://schema.org",
    "@type": "AboutPage", // alternativ WebPage
    "url": "https://chessperiment.app/profile",
    "name": "Profile – chessperiment",
    "description": "Erfahre mehr über die Profile und Features auf chessperiment, inklusive Benutzerstatistiken, Achievements und personalisierten Einstellungen.",
    "publisher": {
        "@type": "Organization",
        "name": "chessperiment",
        "url": "https://chessperiment.app",
        "logo": {
            "@type": "ImageObject",
            "url": "https://chessperiment.app/static/logo.svg"
        }
    }
};

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const t = useTranslations("Profile")
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<GameHistoryItem[]>([])
    const [boards, setBoards] = useState<SavedBoard[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    useEffect(() => {
        if (status === "authenticated") {
            fetchUserData()
        }
    }, [status])

    const fetchUserData = async () => {
        try {
            const [statsRes, historyRes, boardsData] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/history?limit=10"),
                getUserBoardsAction()
            ])

            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData)
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json()
                setHistory(historyData)
            }

            setBoards(boardsData)
        } catch (error) {
            console.error("Error fetching user data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        )
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <h1 className="text-3xl font-bold text-amber-400 mb-4">
                    {t("notLoggedIn")}
                </h1>
                <p className="text-amber-400/60">{t("pleaseLogin")}</p>
            </div>
        )
    }

    const winRate = stats && stats.gamesPlayed > 0
        ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
        : "0.0"

    const handleDeleteAccount = () => {
        startTransition(async () => {
            const result = await deleteAccountAction();
            if (result.success) {
                await signOut({ callbackUrl: "/" });
            } else {
                alert(result.error || "Failed to delete account");
            }
        });
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProfilePage).replace(/</g, '\\u003c') }}
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Profile Header */}
                <div className="bg-islands/70 backdrop-blur-xl border border-amber-400/20 shadow-xl rounded-3xl p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-24 h-24 rounded-full border-4 border-amber-400/30"
                                width={96}
                                height={96}
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-amber-400/10 border-4 border-amber-400/30 flex items-center justify-center">
                                <span className="text-4xl text-amber-400">
                                    {session?.user?.name?.[0] || "?"}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className={`${bungee.className} text-4xl text-amber-600 dark:text-yellow-400 mb-2`}>
                                {session?.user?.name}
                            </h1>
                            <p className="text-amber-700/60 dark:text-amber-400/60">{session?.user?.email}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2">
                                        <Trash2 size={16} />
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-stone-900 border-stone-800 text-white">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-red-500">
                                            <AlertTriangle />
                                            Are you absolutely sure?
                                        </DialogTitle>
                                        <DialogDescription className="text-stone-400">
                                            This action cannot be undone. This will permanently delete your
                                            account and remove all your data (boards, pieces, stats) from our servers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-6 flex gap-2">
                                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            disabled={isPending}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {isPending ? "Deleting..." : "Permanently Delete Account"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
                        <TabsTrigger
                            value="activity"
                            className="flex-1 py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-bg font-bold flex items-center gap-2"
                        >
                            <TrendingUp size={18} />
                            Activity
                        </TabsTrigger>
                        <TabsTrigger
                            value="library"
                            className="flex-1 py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-bg font-bold flex items-center gap-2"
                        >
                            <Library size={18} />
                            Board Library
                            {boards.length > 0 && (
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                                    {boards.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                icon={<Trophy size={32} />}
                                label={t("wins")}
                                value={stats?.wins || 0}
                                color="text-green-400"
                            />
                            <StatCard
                                icon={<Target size={32} />}
                                label={t("gamesPlayed")}
                                value={stats?.gamesPlayed || 0}
                                color="text-blue-400"
                            />
                            <StatCard
                                icon={<TrendingUp size={32} />}
                                label={t("winRate")}
                                value={`${winRate}%`}
                                color="text-amber-400"
                            />
                            <StatCard
                                icon={<Calendar size={32} />}
                                label={t("rating")}
                                value={stats?.rating || 1500}
                                color="text-purple-400"
                            />
                        </div>

                        {/* Recent Games */}
                        <div className="bg-islands/70 backdrop-blur-xl border border-amber-400/20 shadow-xl rounded-3xl p-8">
                            <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mb-6 font-primary">
                                {t("recentGames")}
                            </h2>

                            {history.length === 0 ? (
                                <p className="text-amber-400/60 text-center py-8">
                                    {t("noGamesYet")}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((game) => (
                                        <GameHistoryCard key={game.id} game={game} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="library" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <LibraryGrid initialBoards={boards} initialSets={[]} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-islands shadow-md border border-amber-400/10 rounded-2xl p-6 transition-all hover:shadow-lg">
            <div className={`${color} mb-3`}>{icon}</div>
            <div className="text-3xl font-bold text-text dark:text-white mb-1">{value}</div>
            <div className="text-sm text-amber-700/60 dark:text-amber-400/60">{label}</div>
        </div>
    );
}

function GameHistoryCard({ game }: { game: GameHistoryItem }) {
    const resultColors = {
        win: "bg-green-400/10 border-green-400/30 text-green-400",
        loss: "bg-red-400/10 border-red-400/30 text-red-400",
        draw: "bg-amber-400/10 border-amber-400/30 text-amber-400",
    }

    const date = new Date(game.timestamp.seconds * 1000).toLocaleDateString()

    return (
        <div className="flex items-center justify-between p-4 bg-islands/40 border border-amber-400/10 rounded-xl">
            <div className="flex items-center gap-4">
                <div
                    className={`px-4 py-2 rounded-lg border font-bold uppercase ${resultColors[game.result]}`}
                >
                    {game.result}
                </div>
                <div>
                    <p className="text-text dark:text-white font-medium truncate max-w-[120px] sm:max-w-xs">
                        {game.opponent || "Unknown Opponent"}
                    </p>
                    <p className="text-sm text-amber-700/60 dark:text-amber-400/60">{date}</p>
                </div>
            </div>
            {game.roomId && (
                <div className="text-xs text-amber-400/40 font-mono">
                    {game.roomId}
                </div>
            )}
        </div>
    );
}
