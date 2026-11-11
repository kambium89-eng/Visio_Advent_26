# Visio Advent 2026

Ein wachsendes Weihnachtsdorf für VisioCoaching. Die Website wird über GitHub Pages veröffentlicht.

## Fertige Tagesinhalte

- [1. Dezember – Fünf Dinge, auf die du stolz bist](https://kambium89-eng.github.io/Visio_Advent_26/?tag=1)
- [5. Dezember – Die zwei Wölfe](https://kambium89-eng.github.io/Visio_Advent_26/?tag=5)
- [6. Dezember – Samichlaus mit Otto](https://kambium89-eng.github.io/Visio_Advent_26/?tag=6)
- [7. Dezember – Farbjagd](https://kambium89-eng.github.io/Visio_Advent_26/?tag=7)
- [9. Dezember – Calvin und Hobbes](https://kambium89-eng.github.io/Visio_Advent_26/?tag=9)
- [23. Dezember – Vorschau des Rückblicks](https://kambium89-eng.github.io/Visio_Advent_26/?tag=23&vorschau=23)

Vor dem 1. Dezember zeigt die erste Version den gekennzeichneten Vorschau-Stand vom 9. Dezember. Ab 1. Dezember verwendet sie automatisch das tatsächliche Datum in `Europe/Zurich`. Für die Gestaltung kann `vorschau=N` einen einzelnen Dorfstand zeigen. Das verändert keine serverseitigen Datensperren. Der normale Tageslink für das E-Mail am 23. Dezember ist `?tag=23`, ohne Vorschau-Parameter.

## Konzept

Das zu einem Tag gehörende Haus erscheint gross und verkleinert sich automatisch auf seinen festen Platz im Dorf am unteren Fensterrand. Danach wird der Tagesinhalt eingeblendet. Frühere fertig vorbereitete Tage sind über ihre Häuser erreichbar. Noch nicht ausgearbeitete Tage erscheinen im Vorschau-Dorf blasser. Zukünftige Häuser fehlen, bis ihr Datum erreicht ist. Bei reduzierter Bewegung wird die Animation übersprungen.

Die Inhalte bleiben beim Scrollen im Lesebereich, das Dorf bleibt unten sichtbar. Am 24. Dezember enthält es alle 24 Häuser. Das Design ist für Computer gedacht. Titel und Hausnummern verwenden die mitgelieferte Schrift Alex Brush. Alle übrigen Texte verwenden Georgia.

Am 23. Dezember bleibt die Überraschung vor dem Login verborgen: Die Häuser führen wie gewohnt zu den fertigen Tagesinhalten. Der Login trägt den Titel «Eine kleine Überraschung wartet auf dich nach dem Login», ohne Inhaltsuntertitel oder Hinweise am unteren Rand. Auch Tabtitel, Hausbeschriftungen und Screenreader-Ansagen nehmen den Rückblick nicht vorweg. Für das ganze Projekt gilt: Künftige Überraschungen nicht durch Navigation oder Hilfstexte verraten.

Nach der Anmeldung und der Freigabe wird das Dorf selbst zum Rückblick. Eine kurze Anleitung verschwindet, sobald das erste Haus berührt oder mit der Tastatur fokussiert wird. Kleine Rauchpuffs und wolkenförmige Georgia-Texte entstehen direkt am Kamin, steigen durch das Fenster und verblassen am oberen Rand. Beim Verweilen über einem Haus kommt alle 7,2 Sekunden ein weiterer Gedanke. Alle Kamine greifen nacheinander auf dieselbe Sammlung zu: Es gibt keine Begrenzung auf die Zahl der Häuser. Bereits aufgestiegene Wolken fliegen nach dem Verlassen des Hauses weiter. Über einer Wolke pausiert die Bewegung zum Lesen. Escape schliesst alle Wolken; jede Wolke hat zusätzlich einen Schliessen-Knopf. Höchstens sechs Gedankenwolken bleiben gleichzeitig im Fenster, um hektische Mausbewegungen abzufangen. Bei reduzierter Bewegung erscheint nur eine ruhende Wolke; Klick oder Enter auf einem Haus zeigen den nächsten Gedanken. Die Wolken enthalten keine Navigation. An anderen Tagen bleibt die Haus-Navigation erhalten.

`memory-clouds.js` verwaltet die Wolken und die Kaminpositionen der quadratischen WebP-Bilder. Werden Hausmotive ausgetauscht, müssen ihre normierten Kaminpositionen in `CHIMNEY_ANCHORS` geprüft werden. Private Antworttexte werden als Text ausgegeben und beim Abmelden oder Verlassen des Rückblicks aus der Wolkenansicht entfernt. Der Vorschau-Rundgang verwendet 32 ausdrücklich erfundene Beispielgedanken, ohne Beiträge zu speichern oder die serverseitige Datumssperre zu verändern.

## Bilder und Inhalte

- `assets/houses/house-01.png` bis `house-24.png`: Original-PNGs für die Tages-E-Mails.
- `assets/backgrounds`, `assets/decorations`, `assets/fonts`: Hintergrund, Bäume, Schnee und Alex Brush samt Lizenz.
- `assets/web`: kleinere WebP-Versionen für zügiges Laden. Die Originale bleiben erhalten.
- `tools/prepare-web-assets.py`: WebP-Versionen mit Pillow erneut erstellen.
- `content`: Geschichten, Erklärung und Textvorlage zur Farbjagd.
- `Images/Calvin&Hobbs_Xmas.jpg`: Comic für Tag 9.
- `vendor`: lokal gespeicherter Markdown-Parser mit Lizenz.

## Formular und Rückblick

Tag 1 und 23 verwenden den gemeinsamen Teamzugang. Der Datenspeicher läuft separat über Sites mit einer privaten D1-Datenbank. `backend/` enthält die Quellkopie des Dienstes mit Datenbankschema, Migrationen und Tests. Die Plattform stellt den Dienst separat bereit; ein GitHub-Push veröffentlicht nur die Website.

Passwort und Sitzungsschlüssel sind ausschliesslich als Runtime-Secrets hinterlegt. Sie stehen nicht im Repository. Die API prüft jeden Datenzugriff. Gespeichert werden ein bis fünf freiwillige Gedanken, eine zufällige Einsendungs-ID und ein Speicherzeitpunkt, keine Namen oder E-Mail-Adressen. Leere Felder werden weggelassen; ein Gedanke genügt. Wiederholtes Speichern mit derselben Einsendungs-ID ersetzt die frühere Fassung. Im selben Browser-Tab lassen sich eigene Antworten auch zurückziehen. Die Formulierung auf Tag 1 verrät den späteren Rückblick nicht.

Die tatsächlichen Beiträge sind serverseitig bis zum 23. Dezember 2026 um 00:00 Uhr Schweizer Zeit gesperrt. Die Vorschau des Rückblicks kann vorher ausdrücklich gekennzeichnete, erfundene Beispieltexte zeigen. Diese Beispiele werden nicht gespeichert. Der echte Rückblick zeigt nur gemischte Antworttexte ohne Zuordnung zu Einsendungen.

## Lokal starten

Im Repository: `python3 -m http.server 8765 --bind 127.0.0.1`.

Dann `http://localhost:8765/?tag=5` öffnen. Alle lokalen Dateiverweise sind relativ und funktionieren auch unter dem GitHub-Pages-Unterpfad.

Planung, Excel-Datei, Word-Quellen und Archive liegen im Obsidian-Vault unter `VisioCoaching/Projektwochen/Advent`. Die frühere Website-Version ist dort archiviert.
