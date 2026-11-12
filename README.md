# Visio Advent 2026

24 feste Tageslinks für VisioCoaching auf GitHub Pages:
`https://kambium89-eng.github.io/Visio_Advent_26/?tag=N` (N = 1 bis 24).
Ohne Tagesnummer öffnet sich Tag 1. Es gibt keine Vorschau-Ansicht oder Datumssperre.

## Tagesseiten und Dorf

Der Tageslink bestimmt den Inhalt und den Dorfstand. Tag 7 zeigt die Häuser 1–7, Tag 24 alle 24 Häuser. Frühere Häuser und ihre Nummern führen zu ihrem Tageslink. Die Navigation verrät nur die Tagesnummer. Beim Öffnen erscheint das Tageshaus gross und verkleinert sich auf seinen Dorfplatz. Bei reduzierter Bewegung entfällt die Animation. Der Aquarell-Hintergrund und der leichte Schneefall gelten für alle Seiten. Titel und Zahlen verwenden Alex Brush, die übrigen Texte Georgia. Die Gestaltung ist für Computer vorgesehen.

## Planung und Inhalte

Die Excel-Datei `Adventskalender_2026_Links.xlsx`, Blatt `Adventstage`, ist die Inhaltsplanung. `content/calendar.json` übernimmt Titel, Format, Beschreibung und Hauszuordnung. Der Export erfolgt mit:

```sh
python3 tools/sync-calendar.py /absoluter/Pfad/Adventskalender_2026_Links.xlsx
```

Tag 1, 5, 6, 7, 9 und 23 haben ausgearbeitete Inhalte. Die übrigen 18 Seiten zeigen einen gekennzeichneten Platzhalter mit dem genauen Wortlaut der Beschreibung aus der Excel-Datei. Das gilt auch für den noch auszuarbeitenden Weihnachtsgruss an Tag 24. Änderungen in Excel werden beim nächsten Inhaltsupdate exportiert und veröffentlicht. Die Website liest keine lokale Arbeitsmappe im Browser.

- Tag 1: fünf freiwillige Felder; ein Gedanke genügt. Gemeinsamer Teamzugang, Speichern, Ersetzen und Zurückziehen. Der Hinweis verrät den späteren Rückblick nicht.
- Tag 5: Geschichte und Erklärung «Die zwei Wölfe», per Drehung umschaltbar.
- Tag 6: Otto-Video ohne automatische Wiedergabe.
- Tag 7: achtsame Farbjagd mit fünf auswählbaren Farben.
- Tag 9: vorhandener Calvin-und-Hobbes-Comic.
- Tag 23: geschützter gemeinsamer Rückblick im Dorf.

## Tag 23

Der normale Link ist `?tag=23`. Vor der Anmeldung trägt die Seite den neutralen Titel «Eine kleine Überraschung wartet auf dich nach dem Login», ohne Inhaltsuntertitel oder Hinweise am unteren Rand. Die Häuser navigieren normal. Nach dem Team-Login werden die gespeicherten Beiträge geladen. Es gibt keinen zusätzlichen Vorschauknopf und keine Beispielsammlung.

Die kurze Anleitung verschwindet beim ersten Berühren oder Fokussieren eines Hauses. Wolkenförmige Georgia-Texte wachsen aus den Kaminen, steigen durch das Fenster und verblassen am oberen Rand. Beim Verweilen über einem Haus kommt alle 7,2 Sekunden ein weiterer Gedanke aus der gesamten Sammlung. Die Anzahl der Beiträge ist unabhängig von der Anzahl der Häuser. Über einer Wolke pausiert die Bewegung zum Lesen. Escape oder der Schliessen-Knopf blenden Wolken aus. Sie enthalten keine Navigation. Bei reduzierter Bewegung bleibt eine Wolke ruhig stehen; Klick oder Enter auf dem Haus wechseln den Gedanken.

Ist noch nichts gespeichert, steigt ein ausdrücklich neutraler Dorftext auf. Es werden keine erfundenen Teambeiträge eingesetzt. Abmelden oder Verlassen der Seite entfernt Antworten, Wolken und Timer. Antworten werden ausschliesslich als Text ausgegeben. `CHIMNEY_ANCHORS` in `memory-clouds.js` beschreibt die Kaminpositionen der Hausmotive; beim Motivaustausch müssen sie geprüft werden.

## Speicherung und Veröffentlichung

GitHub Pages veröffentlicht die Website. Der separat über Sites bereitgestellte Dienst verwendet eine private D1-Datenbank; `backend/` ist seine Quellkopie. Tag 1 und Tag 23 benötigen den gemeinsamen Teamzugang. Jede Antwort-Anfrage wird auf dem Server geprüft. Passwörter und Sitzungsschlüssel stehen ausschliesslich in Runtime-Secrets.

Gemäss der Entscheidung vom 12. November 2026 bestimmt der Tageslink die Ansicht, ohne kalendarische Lese- oder Schreibsperre. Die Anmeldung schützt die Beiträge weiterhin. Gespeichert werden ein bis fünf freiwillige Gedanken, eine zufällige Einsendungs-ID und ein Zeitpunkt, keine Namen oder E-Mail-Adressen. Der Rückblick enthält nur gemischte Texte ohne Personen-, ID- oder Zeitzuordnung.

Original-PNGs für E-Mails liegen unter `assets/houses`, optimierte WebP-Häuser unter `assets/web/houses`. Hintergrund, Schrift und Dekorationen bleiben in ihren bisherigen Asset-Ordnern. Planung, Excel, Word-Quellen und Archive liegen im Obsidian-Vault unter `VisioCoaching/Projektwochen/Advent`.

## Lokal

`python3 -m http.server 8765 --bind 127.0.0.1` im Repository, dann z. B. `http://localhost:8765/?tag=23` öffnen. Alle lokalen Dateiverweise funktionieren auch unter dem GitHub-Pages-Unterpfad.
