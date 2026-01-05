"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export function BoardEditorHelp() {
    const { locale } = useParams();
    const isEn = locale === 'en';
    const isDe = locale === 'de';

    if (!isDe && !isEn) return null;

    if (isEn) {
        return (
            <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
                <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Board Editor Guide</h2>
                <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">What is the Board Editor?</h3>
                        <p>
                            The Board Editor is the tool used to create custom game boards for ChessPie. A board defines the playing area: its size, squares, starting positions, and special properties. You can recreate classic chessboards or design entirely new variations.
                        </p>
                        <p className="mt-2 font-medium italic">
                            In short: The Board Editor defines the structure of your game.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">How does the Board Editor work?</h3>
                        <ol className="list-decimal list-inside space-y-4 ml-2">
                            <li>
                                <span className="font-bold">Set Board Size</span><br />
                                First, determine the dimensions of your board (e.g., 8×8, 10×10, or custom sizes) by dragging and resizing the grid.
                            </li>
                            <li>
                                <span className="font-bold">Edit Squares</span><br />
                                Individual squares can be configured easily. Currently, there is one main setting per square:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Active / Inactive (playable or blocked)</li>
                                </ul>
                                Inactive squares are not part of the playing area and cannot be entered or occupied.
                            </li>
                            <li>
                                <span className="font-bold">Set Starting Positions</span><br />
                                Decide which pieces start on which squares. These positions serve as the initial state for new games on this board.
                            </li>
                            <li>
                                <span className="font-bold">Board-Level Rules</span><br />
                                Some rules depend on the board itself rather than the pieces (e.g., forbidden zones or special areas).
                            </li>
                            <li>
                                <span className="font-bold">Save & Test</span><br />
                                Your board can be saved at any time and tested directly in game mode—even against yourself. Check your library!
                            </li>
                        </ol>
                    </div>

                    <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Finished? Here is what you can do:</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Test the board against yourself</li>
                            <li>Play against others online</li>
                            <li>Share it with the community</li>
                            <li>Edit or expand it later</li>
                        </ul>
                        <p className="mt-4 text-sm opacity-80">
                            The Board Editor is intentionally flexible: we want you to experiment without feeling locked in.
                        </p>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
            <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Board Editor Guide</h2>
            <div className="space-y-8 text-stone-600 dark:text-stone-400 leading-relaxed">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Was ist der Board Editor?</h3>
                    <p>
                        Der Board Editor ist das Werkzeug, mit dem du eigene Spielbretter für ChessPie erstellst. Ein Board definiert die Spielfläche: Größe, Felder, Startpositionen und spezielle Eigenschaften einzelner Felder. Damit kannst du klassische Schachbretter nachbauen oder völlig neue Varianten entwerfen.
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

export function PieceEditorHelp() {
    const { locale } = useParams();
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
                            The Piece Editor is the counterpart to the Board Editor. While the board defines the field, pieces define the behavior: how they move, capture, and interact.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Design</h3>
                            <p className="mb-4">This section handles the visual appearance of a piece:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Icons or Graphics</li>
                                <li>Color / Variations</li>
                                <li>Orientation (e.g., player-dependent)</li>
                            </ul>
                            <p className="mt-4 text-sm italic">Design doesn't affect rules but ensures clarity and recognition.</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Rules</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-stone-700 dark:text-stone-300">Fundamental</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        <li>Can it move?</li>
                                        <li>Can it capture?</li>
                                        <li>Neutral or Player-bound?</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-stone-700 dark:text-stone-300">Detailed</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        <li>Movement patterns (directions, range)</li>
                                        <li>Conditions (e.g., first move only)</li>
                                        <li>Special rules (transformation, blockades)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                        <h3 className="text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">Pro Tip</h3>
                        <p className="font-bold">Pieces can only be added to a game within the Board Editor!</p>
                        <p className="mt-4">
                            A piece is truly complete when its design and rules work together seamlessly. The goal is to make every piece intuitive and consistent.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Sets</h3>
                        <p>
                            Group related pieces into a "Set". These sets can then be imported into the Board Editor, allowing you to deploy entire armies or themes at once.
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

export function GameHelp() {
    const { locale } = useParams();
    const isEn = locale === 'en';
    const isDe = locale === 'de';

    if (!isDe && !isEn) return null;

    if (isEn) {
        return (
            <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
                <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Getting Started with ChessPie</h2>
                <div className="grid md:grid-cols-2 gap-12 text-stone-600 dark:text-stone-400 leading-relaxed">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Stockfish Engine</h3>
                            <p>
                                ChessPie uses the Stockfish engine for analysis and as an AI opponent. Stockfish analyzes complex positions and enables:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2">
                                <li>Playing against an AI</li>
                                <li>Detailed position analysis</li>
                                <li>Comparing different boards and rules</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Room Codes</h3>
                            <p>
                                Share your games and experiments using a Room Code. This ensure all players are using the exact same rules, boards, and pieces.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-stone-100 dark:bg-white/5 p-6 rounded-2xl border border-stone-200 dark:border-white/10">
                            <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Rules & Concepts</h3>
                            <p>
                                ChessPie is conceptually based on Chess, but expands it radically:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-3">
                                <li className="font-medium text-amber-600 dark:text-amber-400">Classic rules only apply if you define them that way</li>
                                <li>Deviations are expressly allowed</li>
                                <li>Your custom rule sets take priority over standard chess</li>
                            </ul>
                            <p className="mt-6 text-sm italic">
                                The game system is rule-driven: "Chess" is not the fixed standard; what you configure is.
                            </p>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="w-full max-w-4xl mx-auto px-6 py-16 mt-12 border-t border-stone-200 dark:border-white/10">
            <h2 className="text-3xl font-black mb-8 text-stone-900 dark:text-white uppercase tracking-tight">Einstieg in ChessPie</h2>
            <div className="grid md:grid-cols-2 gap-12 text-stone-600 dark:text-stone-400 leading-relaxed">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">Stockfish Engine</h3>
                        <p>
                            ChessPie nutzt die Stockfish Engine zur Analyse und als KI-Gegner. Stockfish analysiert komplexe Stellungen und ermöglicht:
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
                            ChessPie basiert konzeptionell auf Schach, erweitert dieses aber radikal:
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
