import { auth } from "@/auth";
import { getBoardAction, getCustomPieceAction } from "@/app/actions/library";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import BoardDetailClient from "@/components/editor/BoardDetailClient";
import PieceDetailClient from "@/components/editor/PieceDetailClient";
import { CustomPiece as CustomPieceType } from "@/lib/firestore";

export default async function BoardDetailPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = await params;
    const session = await auth();
    const t = await getTranslations('Library');

    if (!session?.user) {
        redirect("/login");
    }

    let board = await getBoardAction(id);
    let piece: CustomPieceType | null = null;

    if (!board) {
        piece = await getCustomPieceAction(id);
        if (!piece) {
            notFound();
        }
    }

    return (
        <main className="min-h-screen bg-bg lg:px-20 lg:py-16 p-6">
            <div className="max-w-7xl mx-auto">
                {board ? (
                    <BoardDetailClient
                        board={JSON.parse(JSON.stringify(board))}
                        locale={locale}
                        userName={session.user.name || "Unknown"}
                        translations={{
                            play: t('play'),
                            publish: t('publish'),
                            details: t('details'),
                            size: t('size'),
                            lastUpdated: t('lastUpdated'),
                            edit: t('edit'),
                            backToLibrary: t('backToLibrary')
                        }}
                    />
                ) : (
                    <PieceDetailClient
                        piece={JSON.parse(JSON.stringify(piece))}
                        locale={locale}
                        translations={{
                            details: t('details'),
                            lastUpdated: t('lastUpdated'),
                            edit: t('edit'),
                            backToLibrary: t('backToLibrary')
                        }}
                    />
                )}
            </div>
        </main>
    );
}
