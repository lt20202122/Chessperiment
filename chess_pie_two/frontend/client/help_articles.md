# Hilfsartikel

Diese Artikel erklären die Kernfunktionen von ChessPie für neue und fortgeschrittene Nutzer. Ziel ist es, dir einen schnellen Einstieg zu geben und gleichzeitig genügend Tiefe für komplexere Anwendungsfälle zu liefern.

---

## Board Editor

### Was ist der Board Editor?

Der Board Editor ist das Werkzeug, mit dem du eigene Spielbretter für ChessPie erstellst. Ein Board definiert die Spielfläche: Größe, Felder, Startpositionen und spezielle Eigenschaften einzelner Felder. Damit kannst du klassische Schachbretter nachbauen oder völlig neue Varianten entwerfen.

Kurz gesagt: Der Board Editor legt die Struktur des Spiels fest.

### Wie funktioniert der Board Editor?

1. **Board-Größe festlegen**\
   Du bestimmst zuerst die Abmessungen des Boards (z. B. 8×8, 10×10 oder frei definierte Größen), indem du das Schachfeld größer ziehst.

2. **Felder bearbeiten**\
   Einzelne Felder können bewusst vereinfacht konfiguriert werden. Pro Feld gibt es aktuell nur eine Einstellung:

   - Aktiv / inaktiv (spielbar oder gesperrt)

   Inaktive Felder gehören nicht zur Spielfläche und können weder betreten noch belegt werden.

3. **Startpositionen setzen**\
   Lege fest, welche Pieces auf welchen Feldern starten. Diese Positionen gelten als Ausgangszustand für neue Spiele mit diesem Board.

4. **Regeln auf Board-Ebene**\
   Manche Regeln hängen nicht vom Piece, sondern vom Board ab (z. B. verbotene Felder oder besondere Zonen).

5. **Speichern & Testen**\
   Dein Board kann jederzeit gespeichert und direkt im Spielmodus getestet werden – auch gegen dich selbst. Siehe in deiner Bibliothek nach!

### Du bist fertig – was kannst du mit dem Board tun?

Du kannst

- das Board gegen dich selber ausprobieren
- oder gegen andere
- Es mit anderen teilen
- Es später weiter bearbeiten oder erweitern

Der Board Editor ist bewusst flexibel gehalten: Du sollst experimentieren können, ohne dich sofort festzulegen.

---

## Piece Editor

> Hinweis: Dieser Artikel beschreibt nur die Grundidee. Details kannst du später ergänzen.

### Was ist der Piece Editor?

Der Piece Editor ist das Gegenstück zum Board Editor. Während das Board die Spielfläche definiert, bestimmen Pieces das Verhalten im Spiel: wie sie sich bewegen, schlagen und iteragieren.bestimmen Pieces das Verhalten im Spiel: wie sie sich bewegen, schlagen und

### Design

Hier geht es um das visuelle Erscheinungsbild eines Pieces:

- Icon oder Grafik
- Farbe / Varianten
- Orientierung (z. B. abhängig vom Spieler)

Das Design hat keinen Einfluss auf die Regeln, sorgt aber für Klarheit und Wiedererkennung.

### Regeln

#### Fundamental

Die grundlegenden Eigenschaften eines Pieces:

- Darf es ziehen?
- Darf es schlagen?
- Gehört es zu einem Spieler oder ist es neutral?

#### Detailliert

Hier wird das Verhalten präzise festgelegt:

- Bewegungsmuster (Richtungen, Reichweite)
- Bedingungen (z. B. nur beim ersten Zug)
- Spezialregeln (Transformation, Blockaden, Abhängigkeiten von Feldern)

### Am Ende

Ein Piece ist erst dann vollständig, wenn Design und Regeln sauber zusammenspielen. Ziel ist es, dass ein Piece klar verständlich und konsistent ist.

!Pieces können nur im Board Editor eingefügt werden!

### Sets

Packe zusammengehörende Pieces in ein Set, um sie zu gruppieren. Diese Sets kannst du später in den Board Editor importieren.&#x20;

---

## Game

### Stockfish

ChessPie kann Stockfish als Engine nutzen. Stockfish analysiert Stellungen und ermöglicht:

- Spielen gegen eine KI
- Analyse von Positionen
- Vergleich unterschiedlicher Boards und Regeln

Je nach Regelkomplexität kann das Verhalten der Engine variieren.

### Room Code

Mit einem Room Code kannst du Spiele teilen:

- Andere Spieler können direkt beitreten
- Ideal für private Matches oder Tests

Der Code stellt sicher, dass alle Spieler mit denselben Regeln, Boards und Pieces spielen.

###

### Regeln von Schach

ChessPie basiert konzeptionell auf Schach, erweitert dieses aber:

- Klassische Regeln gelten nur, wenn du sie so definierst
- Abweichungen sind ausdrücklich erlaubt
- Eigene Regelsets haben Vorrang vor Standard-Schach

Das Spielsystem ist regelgetrieben: Nicht „Schach“ ist der Standard, sondern das, was du konfigurierst.

---

Wenn du willst, können diese Artikel später weiter vertieft, aufgeteilt oder SEO-optimiert werden (z. B. mit Beispielen, Screenshots oder Schritt-für-Schritt-Guides).

