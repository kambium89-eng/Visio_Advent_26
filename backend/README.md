# Visio Advent 2026 – Datenspeicher

Privater D1-Datenspeicher für den Adventskalender auf GitHub Pages. Der Service stellt einen gemeinsamen Teamzugang und eine anonyme Sammlung aus einem bis fünf freiwilligen Gedanken bereit.

- `POST /api/login`: gemeinsamer Teamzugang, signiertes Token für acht Stunden.
- `POST /api/responses`: einen bis fünf Gedanken speichern oder mit derselben zufälligen Einsendungs-ID ersetzen. Leere Felder werden weggelassen.
- `GET /api/responses`: Team-Login erforderlich. Die Sammlung ist nach dem Login über den normalen Tageslink erreichbar, ohne Datumssperre.
- `DELETE /api/responses`: eigene Einsendung mit der nur im ursprünglichen Browser-Tab vorhandenen zufälligen Einsendungs-ID zurückziehen. Team-Login erforderlich.
- `GET /api/health`: einfacher Verfügbarkeitscheck ohne Beiträge.

Die Datenbank enthält keine Namen, E-Mail-Adressen oder Firmenkonten. Die zufällige Einsendungs-ID dient nur dazu, versehentliche doppelte Einsendungen im selben Browser-Tab zu ersetzen. Der Rückblick liefert ausschliesslich durchmischte Antworttexte, keine IDs oder Zeitstempel. Fehlgeschlagene Anmeldungen werden zeitlich begrenzt anhand eines HMAC-Digests begrenzt; rohe Netzwerkadressen werden nicht gespeichert. Inhalte werden nicht protokolliert.

Die Website darf öffentlich auf GitHub Pages liegen. Die API benötigt für den gemeinsamen Teamzugang einen ohne ChatGPT-Konto erreichbaren Service-Endpunkt. Der Datenzugriff wird in jeder API-Anfrage mit dem Team-Token geprüft. CORS erlaubt nur den Website-Ursprung und die lokalen Entwicklungsadressen. Das CORS-Setzen ersetzt keine Authentifizierung.

`TEAM_PASSWORD` und `SESSION_SECRET` werden ausschliesslich als Sites-Runtime-Secrets eingerichtet. Geheimnisse gehören weder in Git noch in Browser-Code. Lokale `.env*`- und `.dev.vars*`-Dateien sind ausgeschlossen. Die Datenbankbindung heisst `DB`.

Die offizielle Website verwendet einen festen Link pro Tag. Der Tageslink bestimmt den Dorfstand. Es gibt keine Vorschau-Parameter und keine kalendarische Lese- oder Schreibsperre. Sitzungsgültigkeit, Eingabeprüfung und Authentifizierung bleiben serverseitig wirksam. Diese Änderung folgt der Nutzerentscheidung vom 12. November 2026.

Tests: `node --test server/api.test.mjs`. Datenbankschema: `db/schema.ts`, generierte Migrationen unter `drizzle`. Bestehende Migrationen nicht verändern. Neue Migrationen mit `npm run db:generate` erzeugen. Veröffentlichung erfolgt über den Sites-Workflow. Website und Quellkopie dieses Dienstes liegen zusätzlich im lokalen GitHub-Repository `Visio_Advent_26`.

Die Aufbewahrung und das Löschen der Beiträge nach dem Advent werden vor dem Versand an das Team festgelegt. Der Service richtet keinen E-Mail-Versand ein.
