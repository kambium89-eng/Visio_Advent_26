# Visio Advent 2026

24 feste Tageslinks für VisioCoaching auf GitHub Pages:
`https://kambium89-eng.github.io/Visio_Advent_26/?tag=N` (N = 1 bis 24).
Ohne Tagesnummer öffnet sich Tag 1. Es gibt keine Vorschau-Ansicht oder Datumssperre.

## Tagesseiten und Dorf

Der Tageslink bestimmt den Inhalt und den Dorfstand. Tag 7 zeigt die Häuser 1–7, Tag 24 alle 24 Häuser. Frühere Häuser und ihre Nummern führen zu ihrem Tageslink. Die Navigation verrät nur die Tagesnummer. Beim Öffnen erscheint das Tageshaus gross und verkleinert sich auf seinen Dorfplatz. Die Animation zeigt nur das Datum, ohne Schaltfläche oder zusätzlichen Begleittext. Bei reduzierter Bewegung entfällt die Animation. Der Aquarell-Hintergrund und der leichte Schneefall gelten für alle Seiten. Titel und Zahlen verwenden Alex Brush, die übrigen Texte Georgia. Die Gestaltung ist für Computer vorgesehen.

Das Dorf steht in einer horizontal scrollbaren Reihe mit gleich grossen Hausrahmen (132 px) auf einer gemeinsamen Schneelinie. Der Dorfstreifen ist 224 px hoch und lässt dem Tagesinhalt mehr Platz. Das normale Mausrad bewegt über dem Dorf die Häuser seitlich, innerhalb des Tagesinhalts den Text vertikal; Zusatztasten sind nicht nötig. Die Bildlaufleiste und die Pfeiltasten der Tastatur im fokussierten Dorfstreifen erlauben zusätzliche Bedienung; seitliche Pfeil-Schaltflächen gibt es nicht. Beim Öffnen ist das aktuelle Tageshaus sichtbar. Die Häuser gleiten hinter den transparenten Bäumen am Fensterrand vorbei, deren Äste den sichtbaren Abschluss bilden. Schatten und `HOUSE_BASE_GAPS` gleichen den transparenten unteren Bildrand jedes Motivs aus. Bei einem Motivaustausch sind neben den Kaminpositionen auch diese Basisabstände zu prüfen.

Der Lesebereich hat einen weich auslaufenden Hintergrund. Nur dessen separate Hintergrundebene wird unscharf, der Text bleibt scharf. Der Schneefall verwendet jetzt 33 statt 25 Flocken, also ungefähr 30 Prozent mehr. Die Einstellungen für reduzierte Bewegung gelten weiterhin.

Die gemeinsame `theme.css` übernimmt die sechs Farben aus der Vault-Notiz «Hex Codes». Drehschaltflächen haben `#595e48` mit Text in `#ece1dd`; Navigations- und Downloadschaltflächen haben `#eecfca` mit Text in `#595e48`. Die aktuelle Hausnummer hat einen Hintergrund in `#595e48` mit Schrift in `#eecfca`; frühere Tage zeigen die umgekehrte Kombination. Die Inhaltskarte nutzt bis zu rund 1200 px Breite und die verfügbare Höhe über dem Dorf. Auf kurzen Desktopfenstern wird der Kopf kompakter. Themenwahl und Drehschaltflächen stehen vor dem Text, damit lange Texte die Bedienung nicht verdecken. Lange Inhalte bleiben scrollbar. Auf den Tagen 2, 3, 5, 6, 8, 10, 12, 13, 14, 16, 20, 21 und 22 ist der Lesetext zentriert; dies gilt auf Tag 5 für Geschichte und Erklärung. Der Untertitel «Eine Parabel über das, dem wir unsere Aufmerksamkeit schenken.» entfällt.

## Planung und Inhalte

Johns am 23. November freigegebene Titel für Tag 2/3 sowie die Traumschiff-Einleitung und der Video-Link für Tag 6 stehen in `content/editorial-overrides.json`. Der Excel-Export übernimmt diese redaktionellen Anpassungen nach den Planungsdaten, damit ein erneuter Export sie erhält. Die Originalarbeitsmappe bleibt unverändert.

Die Excel-Datei `Adventskalender_2026_Links.xlsx`, Blatt `Adventstage`, ist die Inhaltsplanung. `content/calendar.json` übernimmt Titel, Format, Beschreibung und Hauszuordnung. Der Export erfolgt mit:

```sh
python3 tools/sync-calendar.py /absoluter/Pfad/Adventskalender_2026_Links.xlsx
```

Alle 24 Tageslinks enthalten einen ersten vollständigen Entwurf. Für Tag 2, 3, 8, 10, 12, 13, 14, 16, 18, 20, 21, 22 und 24 übernimmt der Export den Wortlaut aus Spalte K. Das Bastelvideo an Tag 16 verwendet den Link aus Spalte N. Die Originalmaterialien für Rezept, Wunschkarte und Weihnachtsgedanken liegen für die Website in `assets/tagesmaterial/`.

- Tag 8 öffnet mit «Rezept» die Rückseite mit dem Spitzbuben-PDF, dem Download und einer Druckansicht nur für das Rezept.
- An Tag 6, 10, 12, 16 und 20 öffnet eine Drehung das jeweilige Video. An Tag 18 dreht «Trailer» die jeweilige Filmkarte zum eingebetteten Video; «Zurück zum Text» entfernt den Player wieder. Tag 21 bietet die überarbeitete Wunschkarte als einseitiges A4-PDF zum Herunterladen.
- Tag 22 zeigt auf der Rückseite die 16 Karten einzeln für je sechs Sekunden mit einer weichen Überblendung von 1,1 Sekunden. Tag 24 zeigt Fatimes Gedicht in goldener Georgia, rund fünf Sekunden pro Satz. Beide Folgen können angehalten und von Hand weitergeschaltet werden. Bei reduzierter Bewegung lässt sich das ganze Gedicht direkt lesen.
- An Tag 3 und 14 ist der gesamte Absatz «Deine Aufgabe: …» fett hervorgehoben. Tag 11 erklärt direkt, dass ein Klick auf die Nummern die Hinweise öffnet.

- Tag 1: fünf freiwillige Felder; ein Gedanke genügt. Gemeinsamer Teamzugang, Speichern, Ersetzen und Zurückziehen. Der Hinweis verrät den späteren Rückblick nicht.
- Tag 2 trägt nur den Titel «Das schönste Weihnachtsgeschenk», Tag 3 nur «Ein kleines Kompliment. Eine grosse Wirkung»; ihre bisher wiederholten Inhaltsüberschriften entfallen.
- Tag 4: fünf frei wählbare Fragen mit drehbarer Textkarte zu Wintergrün, Samichlaus, Sonnenwende, Island und Adventskranz. Jede Antwort hat sechs Sätze in zwei Absätzen; die Quellen lassen sich separat aufklappen. Themenwechsel starten auf der Frageseite; die kurze Drehung entfällt bei reduzierter Bewegung. Der Zusatz «Eine kleine Frage. Eine Geschichte zum Weitererzählen.» ist entfernt. Die freigegebenen Vault-Texte werden mit `python3 tools/sync-facts.py /absoluter/Pfad/zum/Advent-Projekt` nach `content/04-fakten.json` übernommen.
- Tag 5: Geschichte und Erklärung «Die zwei Wölfe», per Drehung umschaltbar.
- Tag 11: interaktives Weihnachtskreuzworträtsel mit zehn Begriffen, Hinweisen per Zahlen-Popup und lokaler Fortschrittsspeicherung. Auswahl in Hellrosa (`#eecfca`), richtige Einträge in Salbeigrün (`#919682`), falsche Einträge in Altrosa (`#c7a491`). Raster und leere Felder behalten ihre Hintergründe. Pro Wort lassen sich rund 25 Prozent der Buchstaben aufdecken (gerundet, maximal drei); Hilfsbuchstaben stehen nicht direkt nebeneinander, Kreuzungsfelder zählen für beide Wörter.
  Nach der vollständigen Lösung wächst der ausgewählte «Kranz aus Licht»: grüne Zweige, altrosa Beeren und Schleife, goldene Lichter und ein kleiner Stern. Die Animation entspricht Vorschlag 2 vom 17. November, läuft einmal etwa sieben Sekunden und enthält keine Textblase. Sie ist lautlos, blockiert keine Eingabe und entfällt bei reduzierter Bewegung. Beim erneuten Öffnen eines gelösten Rätsels wird sie nicht wiederholt.
- Tag 7: ausschliesslich der freigegebene Hinweis auf die Visio Runde und der Wunsch für einen guten Start in den Tag. Die bisherige Überschrift, Einleitung, Spaziergang-Anleitung und Farbauswahl sind entfernt. Die Nachricht steht zentriert und endet mit «Eure Weihnachtselfen». Der Satz «Mitbringen müsst ihr eure Jacke und euer Natel.» ist fett hervorgehoben. Textquelle: `content/07-tagesinhalt.md`.
- Tag 9: «Herr Hummel», mit dem ausgewählten Bild `Images/Herr_Hummel_Samichlaus.jpg` und Link zur vollen Bildgrösse.
- Tag 6: «Bullyparade: Weihnachten auf dem Traumschiff» (YouTube: `kq3sYEPdvdM`). Zuerst erscheint Johns freigegebene Einleitung «Kurs auf gute Laune». «Zum Video» dreht dieselbe Karte wie an Tag 20 zum eingebetteten 16:9-Player; «Zurück zum Text» stellt die Einleitung wieder her und entfernt den Player. Keine automatische Wiedergabe. Ein separater Link öffnet YouTube.
- Tag 15: Filmpuzzle mit neun zusammenpassenden Teilen. Jede Weihnachtsfilmfrage hat drei Antworten; eine richtige Antwort deckt ein Teil auf. Zehn Filmtitel stehen jederzeit zur Wahl. Fortschritt bleibt im Browser. Nach dem richtigen Filmtipp erscheint genau eine stille Feier: Santa mit wenigen Hilfen, ein springendes Tageshaus bei mittlerer Hilfe, Sterne bei mehr Hilfe. Die Bereiche berücksichtigen aufgedeckte Teile sowie falsche Quiz- und Filmtipps; es gibt keine Rangliste oder Ergebnisübermittlung. Reduzierte Bewegung verwendet eine ruhige Textkarte. Verlassen der Tagesseite entfernt Animationen und stellt das Dorfhaus wieder her. Inhalt: `content/15-film-quiz.json`; Prüfungen: `node tools/verify-film-quiz.cjs`.
- Tag 17: kurze Einladung mit sechs freiwilligen Aktivitäten. Darunter nur «Wenn du magst, begleitet dich ein Timer.», ein kompaktes Scrollrad mit 5–10 Minuten in Minutenschritten und «Start». Start wechselt zu einer Ansicht ausschliesslich mit Countdown; Titel, Aktivitäten, Kalenderkopf und Dorf verschwinden. Nach Ablauf folgen lautlose Sterne und nur die Reflexionsfrage sowie «Ich habe mir einen Moment genommen». Der Klick auf «Ich habe mir einen Moment genommen» führt direkt zurück zur ersten Ansicht mit Aktivitäten und Häusernavigation. Die gewählte Aktivität bleibt markiert; das Zeitrad ist für einen neuen Durchlauf bereit. Eine absolute Endzeit hält den Countdown auch in Hintergrund-Tabs korrekt. Reduzierte Bewegung verwendet stille Sterne. Neuladen öffnet wieder die Aktivitäten von oben. Keine Speicherung oder Übermittlung. Inhalt: `content/17-freude.json`; Prüfung: `node --test tools/verify-joy-timer.cjs`.
- Tag 19: «Ein kleiner Ort zum Wohlfühlen». Einleitung, Einladung für 30 Minuten, vier nummerierte Schritte und beide Schlussabsätze aus «Fertiger Tagesinhalt» der Vault-Notiz, wortgetreu übernommen. Alle Inhalte sind ohne Eingabe lesbar. Allgemeine Textansicht: `content/19-tagesinhalt.md`, `text.css`.
- Tag 23: geschützter gemeinsamer Rückblick im Dorf.

## Tag 23

Der normale Link ist `?tag=23`. Vor der Anmeldung trägt die Seite den neutralen Titel «Eine kleine Überraschung wartet auf dich nach dem Login», ohne Inhaltsuntertitel oder Hinweise am unteren Rand. Die Häuser navigieren normal. Nach dem Team-Login werden die gespeicherten Beiträge geladen. Es gibt keinen zusätzlichen Vorschauknopf und keine Beispielsammlung.

Die kurze Anleitung verschwindet beim ersten Berühren oder Fokussieren eines Hauses. Wolkenförmige Georgia-Texte wachsen aus den Kaminen, steigen durch das Fenster und verblassen am oberen Rand. Beim Verweilen über einem Haus kommt alle 7,2 Sekunden ein weiterer Gedanke aus der gesamten Sammlung. Die Anzahl der Beiträge ist unabhängig von der Anzahl der Häuser. Die Wolken liegen ausserhalb des scrollenden Dorfstreifens und werden dort nicht abgeschnitten. Nach dem Scrollen wird die aktuelle Position des sichtbaren Kamins für jede neue Wolke gemessen; bereits aufgestiegene Wolken bewegen sich unabhängig weiter. Über einer Wolke pausiert die Bewegung zum Lesen. Escape oder der Schliessen-Knopf blenden Wolken aus. Sie enthalten keine Navigation. Bei reduzierter Bewegung bleibt eine Wolke ruhig stehen; Klick oder Enter auf dem Haus wechseln den Gedanken.

Ist noch nichts gespeichert, steigt ein ausdrücklich neutraler Dorftext auf. Es werden keine erfundenen Teambeiträge eingesetzt. Abmelden oder Verlassen der Seite entfernt Antworten, Wolken und Timer. Antworten werden ausschliesslich als Text ausgegeben. `CHIMNEY_ANCHORS` in `memory-clouds.js` beschreibt die Kaminpositionen der Hausmotive; beim Motivaustausch müssen sie geprüft werden.

## Speicherung und Veröffentlichung

GitHub Pages veröffentlicht die Website. Der separat über Sites bereitgestellte Dienst verwendet eine private D1-Datenbank; `backend/` ist seine Quellkopie. Tag 1 und Tag 23 benötigen den gemeinsamen Teamzugang. Jede Antwort-Anfrage wird auf dem Server geprüft. Passwörter und Sitzungsschlüssel stehen ausschliesslich in Runtime-Secrets.

Gemäss der Entscheidung vom 12. November 2026 bestimmt der Tageslink die Ansicht, ohne kalendarische Lese- oder Schreibsperre. Die Anmeldung schützt die Beiträge weiterhin. Gespeichert werden ein bis fünf freiwillige Gedanken, eine zufällige Einsendungs-ID und ein Zeitpunkt, keine Namen oder E-Mail-Adressen. Der Rückblick enthält nur gemischte Texte ohne Personen-, ID- oder Zeitzuordnung.

Die Original-PNGs für E-Mails liegen im Advent-Vault unter `Gestaltung/Häuser`. Alle 24 Dateinummern entsprechen dem Adventstag. Dieselben PNGs liegen für den Website-Build unter `assets/houses`, optimierte WebP-Häuser unter `assets/web/houses`. Hintergrund, Schrift und Dekorationen bleiben in ihren bisherigen Asset-Ordnern. Planung, Excel, Word-Quellen und Archive liegen im Obsidian-Vault unter `VisioCoaching/Projektwochen/Advent`.

## Lokal

`python3 -m http.server 8765 --bind 127.0.0.1` im Repository, dann z. B. `http://localhost:8765/?tag=23` öffnen. Alle lokalen Dateiverweise funktionieren auch unter dem GitHub-Pages-Unterpfad.
