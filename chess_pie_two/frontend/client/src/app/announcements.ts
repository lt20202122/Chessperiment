export interface Announcement {
    id: string;
    date: string;
    author: string;
    image: string;
    title: {
        en: string;
        de: string;
        [key: string]: string;
    };
    shortDescription: {
        en: string;
        de: string;
        [key: string]: string;
    };
    content: {
        en: string;
        de: string;
        [key: string]: string;
    };
}

const announcements: Announcement[] = [
    {
        id: 'board-editor-movement-toggle',
        date: '2026-02-03',
        author: 'Lasse T.',
        image: '/announcements/board-editor-update.png',
        title: {
            en: 'Board Editor Update: Jump/Run Movement Toggle',
            de: 'Brett-Editor Update: Sprung/Lauf-Bewegungs-Umschalter'
        },
        shortDescription: {
            en: 'Quickly configure piece movement behavior with our new right-click context menu for standard pieces.',
            de: 'Konfiguriere das Bewegungsverhalten von Figuren schnell mit unserem neuen Rechtsklick-Kontextmenü für Standardfiguren.'
        },
        content: {
            en: `
                <p>We're excited to announce a powerful new feature in the Board Editor that makes setting up custom games faster and more intuitive!</p>
                <h3>What's New?</h3>
                <p>You can now <strong>right-click on any standard piece</strong> in the piece selection panel to toggle between two movement modes:</p>
                <ul>
                    <li><strong>Jump:</strong> The piece can jump over other pieces and disabled squares (like the Knight in traditional chess)</li>
                    <li><strong>Run:</strong> The piece must have a clear path and cannot jump over obstacles (like the Rook, Bishop, or Queen)</li>
                </ul>
                <h3>Visual Feedback</h3>
                <p>Each standard piece now displays a small colored badge showing its current movement mode:</p>
                <ul>
                    <li><strong>Orange "JUMP" badge:</strong> Piece can jump over others</li>
                    <li><strong>Blue "RUN" badge:</strong> Piece requires a clear path</li>
                </ul>
                <h3>Why This Matters</h3>
                <p>Previously, if you wanted to create a board where, for example, a Queen could jump over pieces, you'd need to leave the board editor, create a custom piece in the piece editor, and return. Now you can configure standard pieces on the fly, making board creation much more efficient!</p>
                <h3>Default Behavior</h3>
                <ul>
                    <li><strong>Knight:</strong> Defaults to "jump" mode</li>
                    <li><strong>All other standard pieces:</strong> Default to "run" mode</li>
                </ul>
                <p>This feature is available now in the Board Editor. Try it out and let us know what you think!</p>
                <p>Happy experimenting,</p>
                <p><strong>Lasse T.</strong></p>
            `,
            de: `
                <p>Wir freuen uns, ein mächtiges neues Feature im Brett-Editor anzukündigen, das die Einrichtung von benutzerdefinierten Spielen schneller und intuitiver macht!</p>
                <h3>Was ist neu?</h3>
                <p>Du kannst jetzt <strong>mit der rechten Maustaste auf jede Standardfigur</strong> im Figurenauswahl-Panel klicken, um zwischen zwei Bewegungsmodi umzuschalten:</p>
                <ul>
                    <li><strong>Sprung:</strong> Die Figur kann über andere Figuren und deaktivierte Felder springen (wie der Springer im traditionellen Schach)</li>
                    <li><strong>Lauf:</strong> Die Figur benötigt einen freien Weg und kann nicht über Hindernisse springen (wie Turm, Läufer oder Dame)</li>
                </ul>
                <h3>Visuelle Rückmeldung</h3>
                <p>Jede Standardfigur zeigt jetzt ein kleines farbiges Abzeichen, das ihren aktuellen Bewegungsmodus anzeigt:</p>
                <ul>
                    <li><strong>Oranges "JUMP"-Abzeichen:</strong> Figur kann über andere springen</li>
                    <li><strong>Blaues "RUN"-Abzeichen:</strong> Figur benötigt einen freien Weg</li>
                </ul>
                <h3>Warum das wichtig ist</h3>
                <p>Früher musstest du, wenn du zum Beispiel ein Brett erstellen wolltest, auf dem eine Dame über Figuren springen kann, den Brett-Editor verlassen, eine benutzerdefinierte Figur im Figuren-Editor erstellen und zurückkehren. Jetzt kannst du Standardfiguren spontan konfigurieren, was die Brett-Erstellung viel effizienter macht!</p>
                <h3>Standardverhalten</h3>
                <ul>
                    <li><strong>Springer:</strong> Standardmäßig im "Sprung"-Modus</li>
                    <li><strong>Alle anderen Standardfiguren:</strong> Standardmäßig im "Lauf"-Modus</li>
                </ul>
                <p>Dieses Feature ist jetzt im Brett-Editor verfügbar. Probiere es aus und lass uns wissen, was du denkst!</p>
                <p>Viel Spaß beim Experimentieren,</p>
                <p><strong>Lasse T.</strong></p>
            `
        }
    },
    {
        id: 'chessperiment-launch',
        date: '2026-01-20',
        author: 'Lasse T.',
        image: '/announcements/chessperiment-launch.png',
        title: {
            en: 'Welcome to chessperiment: The Future of Custom Chess!',
            de: 'Willkommen bei chessperiment: Die Zukunft des individuellen Schachs!'
        },
        shortDescription: {
            en: 'Create, play, and share your own chess pieces and rules. Explore a new dimension of the game.',
            de: 'Erstelle, spiele und teile deine eigenen Schachfiguren und Regeln. Entdecke eine neue Dimension des Spiels.'
        },
        content: {
            en: `
                <p>Welcome to chessperiment! We're incredibly excited to finally launch the ultimate platform for custom chess enthusiasts. chessperiment isn't just about playing chess; it's about making it your own.</p>
                <h3>What can you do on chessperiment?</h3>
                <ul>
                    <li><strong>Custom Piece Editor:</strong> Use our pixel-art editor to draw your own pieces. Whether it's a dragon, a wizard, or a futuristic tank, you decide the look!</li>
                    <li><strong>Visual Logic Builder:</strong> Give your pieces unique powers! Our Scratch-like logic editor allows you to define movements, capture rules, and special effects without writing a single line of code.</li>
                    <li><strong>Board Editor:</strong> Don't stick to the standard layout. Create custom boards with your own pieces and unique starting positions.</li>
                    <li><strong>Live Game Lobby:</strong> Challenge your friends to a match or test your creations against Stockfish, the world's strongest chess engine, fully adapted to handle your custom rules.</li>
                    <li><strong>Move History & Analysis:</strong> Every game is recorded. Replay your moves, branch off into new variations, and perfect your strategy.</li>
                </ul>
                <p>This is just the beginning. We have many more features planned, and we can't wait to see what amazing games you'll create. Thank you for being part of our journey!</p>
                <p>Enjoy playing,</p>
                <p><strong>Lasse T.</strong></p>
            `,
            de: `
                <p>Willkommen bei chessperiment! Wir freuen uns riesig, endlich die ultimative Plattform für Fans von individuellem Schach zu starten. Bei chessperiment geht es nicht nur darum, Schach zu spielen – es geht darum, es zu deinem eigenen Spiel zu machen.</p>
                <h3>Was kannst du auf chessperiment machen?</h3>
                <ul>
                    <li><strong>Eigener Figuren-Editor:</strong> Nutze unseren Pixel-Art-Editor, um deine eigenen Figuren zu zeichnen. Ob Drache, Zauberer oder futuristischer Panzer – du bestimmst das Aussehen!</li>
                    <li><strong>Visueller Logik-Editor:</strong> Gib deinen Figuren einzigartige Kräfte! Unser Scratch-ähnlicher Logik-Editor ermöglicht es dir, Bewegungen, Schlagregeln und Spezialeffekte zu definieren, ohne eine einzige Zeile Code zu schreiben.</li>
                    <li><strong>Brett-Editor:</strong> Halte dich nicht an das Standard-Layout. Erstelle eigene Bretter mit deinen Figuren und einzigartigen Startpositionen.</li>
                    <li><strong>Live-Spiel-Lobby:</strong> Fordere deine Freunde zu einer Partie heraus oder teste deine Kreationen gegen Stockfish, die stärkste Schach-Engine der Welt, die vollständig angepasst wurde, um mit deinen individuellen Regeln umzugehen.</li>
                    <li><strong>Spielverlauf & Analyse:</strong> Jedes Spiel wird aufgezeichnet. Spiele deine Züge noch einmal ab, erstelle Varianten und perfektioniere deine Strategie.</li>
                </ul>
                <p>Dies ist erst der Anfang. Wir haben noch viele weitere Funktionen geplant und können es kaum erwarten zu sehen, welche fantastischen Spiele du erschaffen wirst. Vielen Dank, dass du Teil unserer Reise bist!</p>
                <p>Viel Spaß beim Spielen,</p>
                <p><strong>Lasse T.</strong></p>
            `
        }
    }
];

export default announcements;
