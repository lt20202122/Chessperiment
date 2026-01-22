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
        id: 'chesspie-launch',
        date: '2026-01-20',
        author: 'Lasse T.',
        image: '/announcements/launch.png',
        title: {
            en: 'Welcome to ChessPie: The Future of Custom Chess!',
            de: 'Willkommen bei ChessPie: Die Zukunft des individuellen Schachs!'
        },
        shortDescription: {
            en: 'Create, play, and share your own chess pieces and rules. Explore a new dimension of the game.',
            de: 'Erstelle, spiele und teile deine eigenen Schachfiguren und Regeln. Entdecke eine neue Dimension des Spiels.'
        },
        content: {
            en: `
                <p>Welcome to ChessPie! We're incredibly excited to finally launch the ultimate platform for custom chess enthusiasts. ChessPie isn't just about playing chess; it's about making it your own.</p>
                <h3>What can you do on ChessPie?</h3>
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
                <p>Willkommen bei ChessPie! Wir freuen uns riesig, endlich die ultimative Plattform für Fans von individuellem Schach zu starten. Bei ChessPie geht es nicht nur darum, Schach zu spielen – es geht darum, es zu deinem eigenen Spiel zu machen.</p>
                <h3>Was kannst du auf ChessPie machen?</h3>
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
