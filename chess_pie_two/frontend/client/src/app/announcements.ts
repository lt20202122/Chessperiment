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
        id: 'new-piece-editor',
        date: '2025-12-26',
        author: 'Gemini',
        image: '/announcements/piece-editor.png',
        title: {
            en: 'Unleash Your Creativity: Introducing the New Piece Editor!',
            de: 'Entfessle deine Kreativität: Der neue Figuren-Editor ist da!'
        },
        shortDescription: {
            en: 'Design your own pixel-perfect chess pieces and bring a personal touch to your games.',
            de: 'Gestalte deine eigenen pixelgenauen Schachfiguren und verleihe deinen Spielen eine persönliche Note.'
        },
        content: {
            en: `
                <p>We are thrilled to announce the launch of our brand-new Piece Editor! Now, you have the power to customize every aspect of your chess pieces, pixel by pixel.</p>
                <h3>What's New?</h3>
                <ul>
                    <li><strong>Intuitive Interface:</strong> Our easy-to-use editor makes design accessible to everyone.</li>
                    <li><strong>Endless Possibilities:</strong> Create unique Kings, Queens, Rooks, and more.</li>
                    <li><strong>Save & Share:</strong> Save your creations and share them with the ChessPie community.</li>
                </ul>
                <p>Dive in and start designing today!</p>
            `,
            de: `
                <p>Wir freuen uns riesig, den Start unseres brandneuen Figuren-Editors bekannt zu geben! Jetzt hast du die Möglichkeit, jeden Aspekt deiner Schachfiguren Pixel für Pixel anzupassen.</p>
                <h3>Was ist neu?</h3>
                <ul>
                    <li><strong>Intuitive Benutzeroberfläche:</strong> Unser benutzerfreundlicher Editor macht Design für jeden zugänglich.</li>
                    <li><strong>Endlose Möglichkeiten:</strong> Erstelle einzigartige Könige, Damen, Türme und mehr.</li>
                    <li><strong>Speichern & Teilen:</strong> Speichere deine Kreationen und teile sie mit der ChessPie-Community.</li>
                </ul>
                <p>Tauche ein und beginne noch heute mit dem Design!</p>
            `
        }
    },
    {
        id: 'history-mode-improvements',
        date: '2025-12-25',
        author: 'Gemini',
        image: '/announcements/history-mode.png',
        title: {
            en: 'Enhanced History Mode: Relive Your Games Like Never Before!',
            de: 'Verbesserter Verlaufsmodus: Erlebe deine Spiele wie nie zuvor!'
        },
        shortDescription: {
            en: 'Navigate through your game history with improved precision and visual move highlighting.',
            de: 'Navigiere durch deine Spielhistorie mit verbesserter Präzision und visueller Zug-Hervorhebung.'
        },
        content: {
            en: `
                <p>Our History Mode just got a major upgrade! We've listened to your feedback and implemented several key improvements to make reviewing your past games a seamless experience.</p>
                <h3>Key Enhancements:</h3>
                <ul>
                    <li><strong>Accurate Navigation:</strong> No more jumping to the first move – navigate move by move with confidence.</li>
                    <li><strong>Move Highlighting:</strong> Instantly see the 'from' and 'to' squares of each move as you scroll through history.</li>
                    <li><strong>Fluid Performance:</strong> Enjoy a smoother and more responsive history playback.</li>
                </ul>
                <p>Revisit your most epic battles and learn from every decision!</p>
            `,
            de: `
                <p>Unser Verlaufsmodus hat ein großes Upgrade erhalten! Wir haben euer Feedback berücksichtigt und mehrere wichtige Verbesserungen implementiert, um die Überprüfung eurer vergangenen Spiele zu einem nahtlosen Erlebnis zu machen.</p>
                <h3>Wesentliche Verbesserungen:</h3>
                <ul>
                    <li><strong>Genaue Navigation:</strong> Kein Springen mehr zum ersten Zug – navigiere Zug für Zug mit Vertrauen.</li>
                    <li><strong>Zughervorhebung:</strong> Sieh sofort die "von"- und "nach"-Felder jedes Zuges, während du durch die Historie scrollst.</li>
                    <li><strong>Flüssige Performance:</strong> Genieße eine flüssigere und reaktionsschnellere Wiedergabe der Historie.</li>
                </ul>
                <p>Besuche deine epischsten Schlachten noch einmal und lerne aus jeder Entscheidung!</p>
            `
        }
    }
];

export default announcements;
