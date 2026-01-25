import Link from 'next/link'
import { getLocale } from 'next-intl/server';

export async function BoardEditorHelp() {
    const locale = await getLocale();
    const isEn = locale === 'en';
    const isDe = locale === 'de';

    if (!isDe && !isEn) return null;

    if (isEn) {
        return (
            <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
                <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight"><Link href="/editor/board" className="underline decoration-wavy decoration-2 decoration-stone-600 dark:decoration-stone-400">Board Editor</Link> Guide</h2>
                <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">What is the Board Editor?</h3>
                        <p>
                            The Board Editor is the tool you use to create custom game boards for chessperiment. A board defines the playing field: its size, which squares are playable, starting positions, and board-level rules.
                        </p>
                        <p className="mt-2 font-medium italic">
                            In short: the Board Editor defines the structure of the game.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">How does the Board Editor work?</h3>
                        <ol className="list-decimal list-inside space-y-4 ml-2">
                            <li>
                                <span className="font-bold">Set the board size</span><br />
                                First, you define the dimensions of the board (e.g. 8×8, 10×10, or any custom size) by resizing the grid.
                            </li>
                            <li>
                                <span className="font-bold">Edit squares</span><br />
                                Individual squares are intentionally kept simple. Each square currently has exactly one configurable property:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Active / inactive (playable or blocked)</li>
                                </ul>
                                Inactive squares are not part of the playing field and cannot be entered or occupied by pieces.
                            </li>
                            <li>
                                <span className="font-bold">Set starting positions</span><br />
                                Define which pieces start on which squares. These positions are used as the initial setup for new games played on this board.
                            </li>
                            <li>
                                <span className="font-bold">Board-level rules</span><br />
                                Some rules apply to the board itself rather than to individual pieces (for example: blocked areas or special zones).
                            </li>
                            <li>
                                <span className="font-bold">Save & test</span><br />
                                Your board can be saved at any time and tested directly in game mode — even by playing against yourself. You can find it in your library.
                            </li>
                        </ol>
                    </div>

                    <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">You&apos;re done – what can you do with the board?</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li>test the board by playing against yourself</li>
                            <li>play on it with others</li>
                            <li>share it with other players</li>
                            <li>edit or extend it later</li>
                        </ul>
                        <p className="mt-4 text-sm opacity-80">
                            The Board Editor is intentionally flexible. You are encouraged to experiment without having to commit to a final design immediately.
                        </p>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
            <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">
                <Link
                    href="/editor/board"
                    className="underline decoration-wavy decoration-2 decoration-stone-600 dark:decoration-stone-400"
                >
                    Board Editor
                </Link>{" "}
                Guide
            </h2>
            <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Was ist der Board Editor?</h3>
                    <p>
                        Der Board Editor ist das Werkzeug, mit dem du eigene Spielbretter für chessperiment erstellst. Ein Board definiert die Spielfläche: Größe, Felder, Startpositionen und spezielle Eigenschaften einzelner Felder. Damit kannst du klassische Schachbretter nachbauen oder völlig neue Varianten entwerfen.
                    </p>
                    <p className="mt-2 font-medium italic">
                        Kurz gesagt: Der Board Editor legt die Struktur des Spiels fest.
                    </p>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Wie funktioniert der Board Editor?</h3>
                    <ol className="list-decimal list-inside space-y-4 ml-2">
                        <li>
                            <span className="font-bold">Board-Größe festlegen</span><br />
                            Du bestimmst zuerst die Abmessungen des Boards (z. B. 8×8, 10×10 oder frei definierte Größen), indem du das Schachfeld größer ziehst.
                        </li>
                        <li>
                            <span className="font-bold">Felder bearbeiten</span><br />
                            Einzelne Felder können bewusst vereinfacht konfiguriert werden. Pro Feld gibt es aktuell nur eine Einstellung:
                            <ul className="list-disc list-inside ml-6 mt-1">
                                <li>Aktiv / inaktiv (spielbar oder gesperrt)</li>
                            </ul>
                            Inaktive Felder gehören nicht zur Spielfläche und können weder betreten noch belegt werden.
                        </li>
                        <li>
                            <span className="font-bold">Startpositionen setzen</span><br />
                            Lege fest, welche Pieces auf welchen Feldern starten. Diese Positionen gelten als Ausgangszustand für neue Spiele mit diesem Board.
                        </li>
                        <li>
                            <span className="font-bold">Regeln auf Board-Ebene</span><br />
                            Manche Regeln hängen nicht vom Piece, sondern vom Board ab (z. B. verbotene Felder oder besondere Zonen).
                        </li>
                        <li>
                            <span className="font-bold">Speichern & Testen</span><br />
                            Dein Board kann jederzeit gespeichert und direkt im Spielmodus getestet werden – auch gegen dich selbst. Siehe in deiner Bibliothek nach!
                        </li>
                    </ol>
                </div>

                <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Du bist fertig – was kannst du mit dem Board tun?</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li>das Board gegen dich selber ausprobieren</li>
                        <li>oder gegen andere online spielen</li>
                        <li>Es mit der Community teilen</li>
                        <li>Es später weiter bearbeiten oder erweitern</li>
                    </ul>
                    <p className="mt-4 text-sm opacity-80">
                        Der Board Editor ist bewusst flexibel gehalten: Du sollst experimentieren können, ohne dich sofort festzulegen.
                    </p>
                </div>
            </div>
        </article>
    );
}

export async function PieceEditorHelp() {
    const locale = await getLocale();
    const isEn = locale === 'en';
    const isDe = locale === 'de';

    if (!isDe && !isEn) return null;

    if (isEn) {
        return (
            <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
                <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Piece Editor Guide</h2>
                <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">What is the Piece Editor?</h3>
                        <p>
                            The Piece Editor is the counterpart to the Board Editor. While the board defines the playing field, pieces define how the game is played: how they move, capture, and interact with the board and other pieces.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Design</h3>
                            <p className="mb-4">This section focuses on the visual appearance of a piece:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Icon or graphic</li>
                                <li>Color / variants</li>
                                <li>Orientation (e.g. depending on the player)</li>
                            </ul>
                            <p className="mt-4 text-sm italic">Design has no influence on the rules, but it is essential for clarity and recognition.</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Rules</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-stone-700 dark:text-stone-300">Fundamental</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        <li>Can it move?</li>
                                        <li>Can it capture?</li>
                                        <li>Does it belong to a player or is it neutral?</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-stone-700 dark:text-stone-300">Detailed</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        <li>Movement patterns (directions, range)</li>
                                        <li>Conditions (e.g. only on the first move)</li>
                                        <li>Special rules (transformations, blocking, dependencies on specific squares)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                        <h3 className="text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">At the end</h3>
                        <p className="font-bold italic">A piece is only complete when design and rules work together cleanly. The goal is for every piece to be clear, consistent, and predictable.</p>
                        <p className="mt-4 font-black text-red-500 uppercase tracking-tighter">!Pieces can only be placed via the Board Editor!</p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Sets</h3>
                        <p>
                            Group related pieces into a set. These sets can later be imported into the Board Editor.
                        </p>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
            <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Piece Editor Guide</h2>
            <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Was ist der Piece Editor?</h3>
                    <p>
                        Der Piece Editor ist das Gegenstück zum Board Editor. Während das Board die Spielfläche definiert, bestimmen Pieces das Verhalten im Spiel: wie sie sich bewegen, schlagen und interagieren.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Design</h3>
                        <p className="mb-4">Hier geht es um das visuelle Erscheinungsbild eines Pieces:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Icon oder Grafik</li>
                            <li>Farbe / Varianten</li>
                            <li>Orientierung (z. B. abhängig vom Spieler)</li>
                        </ul>
                        <p className="mt-4 text-sm italic">Das Design hat keinen Einfluss auf die Regeln, sorgt aber für Klarheit und Wiedererkennung.</p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Regeln</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-stone-700 dark:text-stone-300">Fundamental</h4>
                                <ul className="list-disc list-inside text-sm">
                                    <li>Darf es ziehen?</li>
                                    <li>Darf es schlagen?</li>
                                    <li>Neutral oder Spieler-gebunden?</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-700 dark:text-stone-300">Detailliert</h4>
                                <ul className="list-disc list-inside text-sm">
                                    <li>Bewegungsmuster (Richtungen, Reichweite)</li>
                                    <li>Bedingungen (z. B. erster Zug)</li>
                                    <li>Spezialregeln (Transformation, Blockaden)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">Wichtig zu wissen</h3>
                    <p className="font-bold">Pieces können nur im Board Editor eingefügt werden!</p>
                    <p className="mt-4">
                        Ein Piece ist erst dann vollständig, wenn Design und Regeln sauber zusammenspielen. Ziel ist es, dass ein Piece klar verständlich und konsistent ist.
                    </p>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Sets</h3>
                    <p>
                        Packe zusammengehörende Pieces in ein Set, um sie zu gruppieren. Diese Sets kannst du später in den Board Editor importieren und so ganze Armeen auf einmal nutzen.
                    </p>
                </div>
            </div>
        </article>
    );
}

export async function GameHelp() {
    const locale = await getLocale();
    const isEn = locale === 'en';
    const isDe = locale === 'de';

    if (!isDe && !isEn) return null;

    if (isEn) {
        return (
            <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
                <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Getting Started with chessperiment</h2>
                <div className="grid md:grid-cols-2 gap-12 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Stockfish</h3>
                            <p>
                                chessperiment can use Stockfish as an engine. Stockfish allows:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2">
                                <li>playing against an AI</li>
                                <li>position analysis</li>
                                <li>comparing different boards and rule sets</li>
                            </ul>
                            <p className="mt-4 text-sm opacity-80 italic">Depending on the complexity of the rules, engine behavior may vary.</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Room Code</h3>
                            <p>
                                A room code lets you share games easily: other players can join directly, making it ideal for private matches or testing.
                            </p>
                            <p className="mt-2 text-sm opacity-80 italic">The code ensures that all players use the same rules, boards, and pieces.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Chess rules</h3>
                            <p>
                                chessperiment is conceptually based on chess, but extends it:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-3">
                                <li className="font-medium text-amber-600 dark:text-amber-400">classical rules only apply if you define them</li>
                                <li>deviations are explicitly allowed</li>
                                <li>custom rule sets override standard chess</li>
                            </ul>
                            <p className="mt-6 text-sm italic">
                                The system is rule-driven: “chess” is not the default — your configuration is.
                            </p>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
            <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Einstieg in chessperiment</h2>
            <div className="grid md:grid-cols-2 gap-12 text-stone-600 dark:text-stone-400 leading-relaxed">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Stockfish Engine</h3>
                        <p>
                            chessperiment nutzt die Stockfish Engine zur Analyse und als KI-Gegner. Stockfish analysiert komplexe Stellungen und ermöglicht:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Spielen gegen eine KI</li>
                            <li>Detaillierte Analyse von Positionen</li>
                            <li>Vergleich unterschiedlicher Boards und Regeln</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Room Codes</h3>
                        <p>
                            Mit einem Room Code kannst du deine Spiele und Experimente teilen. Der Code stellt sicher, dass alle Spieler mit denselben Regeln, Boards und Pieces spielen.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Regeln & Konzepte</h3>
                        <p>
                            chessperiment basiert konzeptionell auf Schach, erweitert dieses aber radikal:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-3">
                            <li className="font-medium text-amber-600 dark:text-amber-400">Standard-Regeln gelten nur, wenn du sie so definierst</li>
                            <li>Abweichungen sind ausdrücklich erlaubt</li>
                            <li>Eigene Regelsets haben Vorrang vor Standard-Schach</li>
                        </ul>
                        <p className="mt-6 text-sm italic">
                            Das Spielsystem ist regelgetrieben: Nicht „Schach“ ist der Standard, sondern das, was du konfigurierst.
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}

export function HelpArticlesAll() {
    return (
        <div className="space-y-0">
            <BoardEditorHelp />
            <PieceEditorHelp />
            <GameHelp />
        </div>
    );
}
