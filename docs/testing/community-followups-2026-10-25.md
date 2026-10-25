# Lokaler Teststand – Community-Follow-ups

Prüfprotokoll für Release 1.22.1. Arbeitszweig der Umsetzung: `codex/ics-import-followups`. Die Release-Pipeline prüft Versionen, Tests und Build vor der Veröffentlichung; die APK wird lokal mit dem bisherigen Release-Schlüssel neu gebaut. PR #39 ist nicht Bestandteil dieses Releases.

Lokale Vorschau: `http://localhost:3001/`, separate Datenbank `.codex-tmp/community-preview-20261025.sqlite`. Eine neue Testfamilie kann dort angelegt werden; bestehende Entwicklungsdaten werden nicht zurückgesetzt. Beispieldatei: [LX-ICS-Test.ics](LX-ICS-Test.ics).

## Testen

1. Im Kalender **Datei importieren** wählen. Vor Bestätigung darf kein neuer Eintrag erscheinen.
2. Eine ICS-Datei mit jährlichen Geburtstagen und einer wöchentlichen oder monatlichen Serie auswählen. Die Vorschau zählt gespeicherte Termine/Serien, nicht alle Wiederholungen.
3. Import bestätigen. Aktuelle und künftige Jahre prüfen. Gelöschte/verschobene Serienvorkommen und exklusive Ganztags-Enddaten müssen stimmen.
4. Termin öffnen. Text, Kategorie und LX-Erinnerungen ändern. Importierte Zeitregeln bleiben geschützt; für Zeitänderungen die Originaldatei bearbeiten und neu importieren.
5. Export laden. UID, RRULE, EXDATE/RECURRENCE-ID, Kategorien und VALARM sollen enthalten sein. Ein Geburtstagsmaster darf nicht für jedes sichtbare Jahr erneut exportiert werden.
6. **Dateiimporte verwalten** öffnen. Nur die ausgewählte Gruppe in den Papierkorb verschieben und einen Eintrag daraus wiederherstellen. Normale Termine und andere Importgruppen müssen unverändert bleiben.
7. Im Menü fünf Favoriten wählen. Ein verständlicher Hinweis erscheint; ein weiterer Stern fügt keinen sechsten Favoriten hinzu. Nach Entfernen eines Sterns ist wieder Platz.
8. Dieselben Schritte auf schmalen Ansichten testen. Automatisch geprüft wird exakt 440 × 956 CSS-Pixel, einschließlich sichtbarer Bestätigungsschaltfläche.

## Grenzen und Datensicherheit

- Originaldateien aufbewahren. Alte, bereits verlustbehaftet importierte Termine enthalten die verlorene RRULE nicht mehr. Eine sichere automatische Reparatur oder Zuordnung ist daher nicht möglich.
- Ein erneuter neuer Import legt zusätzliche Einträge an. Die alte Gruppe vorher bewusst entfernen; bei alten Einträgen ohne Gruppe nicht pauschal nach Titel löschen.
- Neue Importe werden serverseitig atomar gespeichert, auch mit mehr als 500 Einträgen. Wiederholung derselben Importanfrage überschreibt zwischenzeitliche Änderungen nicht.
- Gruppen werden atomar in den bestehenden Papierkorb verschoben. Dessen Oberfläche zeigt maximal die letzten 250 Einträge gleichzeitig; nach Wiederherstellen weiterer Einträge werden ältere sichtbar. Aufbewahrung: 30 Tage.
- Dateiauswahl maximal 4 MB; maximal 2.000 Termine/Serien. Tägliche, wöchentliche, monatliche und jährliche RRULEs einschließlich COUNT/UNTIL, BYDAY und Ausnahmen werden unterstützt. Sekündliche/minütliche/stündliche Serien werden explizit abgelehnt.
- Nicht unterstützte Alarmarten bleiben beim Export erhalten, lösen in LX aber nicht aus. Die Vorschau weist darauf hin. LX unterstützt bis zu acht startbezogene DISPLAY-Erinnerungen bis eine Woche vorher. Änderungen an LX-Erinnerungen ersetzen nur die unterstützten DISPLAY-Alarme der gesamten Serie; andere Alarmarten bleiben erhalten.
- Eingebettete VTIMEZONE-Definitionen bleiben erhalten. Die Anzeige erfolgt wie beim bestehenden Kalender in Europe/Berlin. Ganztags- und Floating-Termine bleiben lokale Datums-/Zeitangaben.
- Müllkalender-Dateiimport und lesende Kalenderfeeds behalten ihren bisherigen Importpfad.

## Rezept-PR #39

Separat aus `review/pr39` in `.codex-tmp/pr39-review` getestet, nicht gemergt oder in den lokalen Produktcode übernommen.

- 13 gezielte Rezeptimport-/Mengen-Tests bestehen.
- Vollständiger alter PR-Stand: 154/157 Tests bestehen. Fehler in Manifest-Route (nicht gebauter Stand) und zwei alten Nextcloud-/CalDAV-Tests mit zeitabhängigen Fixtures. Keine Freigabe des vollständigen PR-Checks.
- Vor Integration auf den aktuellen Stand aktualisieren und alle Tests sowie Kochmodus prüfen. Bestehende Rezepte werden durch diesen PR nicht migriert.

Nachprüfung: Der PR-Patch wurde inzwischen isoliert in `.codex-tmp/pr39-current-compat` auf unseren aktuellen Arbeitsstand angewendet. Dort bestehen **196/196 Tests**, Übersetzungsprüfung und Produktionsbuild. Die alten zeitabhängigen Testfehler treten im aktuellen Stand nicht auf. Der Patch bleibt außerhalb des eigentlichen Produktcodes und ist noch nicht gemergt.

## Erneute Gesamtprüfung

- Aktueller Produktcode: **194/194 Tests**, Übersetzungsprüfung und Produktionsbuild erfolgreich.
- Fünf vollständige Chromium-Browserabläufe erfolgreich; der ICS-/Favoriten-Ablauf zusätzlich mit WebKit bei 440 × 956 CSS-Pixeln.
- Ein Browserlauf überschritt während paralleler Android-Kompilierung und kalter Vite-Neuoptimierung das Zeitlimit. Der vollständige Wiederholungslauf ohne Android-Kompilierung bestand; keine Erhöhung des Test-Zeitlimits.
- Android `:app:assembleDebug` mit Capacitor 8.4.3 erfolgreich. Das bestätigt die native Kompilierung, nicht die Installation oder Bedienung auf einem echten Gerät.
- Release-APK 1.22.1, Versionscode 65, erfolgreich gebaut. APK-SHA-256: `055f56bc0a29071445cba78beaf73763760c967d6795981d89febafdc6da1955`. Zertifikat-SHA-256 unverändert gegenüber 1.22.0: `a76733e808ff4726e423c3ae439579879aaca3ffc5e3f519a1072742aed48ea6`.
- Abschließender lokaler Release-Check: 194/194 Tests, i18n und Produktionsbuild grün; fünf Chromium-Abläufe mit einem Worker grün. GitHub-Qualitätslauf für `6b047cf` bestätigt Tests/Build und Browsercheck ebenfalls erfolgreich.
- Lokale Vorschau erneut gestartet, Gesundheitsantwort `ok`; dieselbe isolierte Testdatenbank beibehalten.
- Geräteprüfung bleibt offen; es steht kein physisches iOS-Testgerät zur Verfügung. Die Release-APK wird separat signiert und auf passenden Schlüssel, Version und Prüfsumme geprüft. Bestehende Größenwarnung des Frontend-Bundles ist kein Buildfehler. In einzelnen API-Testläufen meldet eine noch auslaufende Cloud-Provisionierung beim Test-Teardown die bereits geschlossene Testdatenbank; die Testprüfungen selbst bestehen. Dies ist keine Live-Cloud-Verifikation.

## Sicherheitsprüfung und gezielte Updates

Beim ersten Prüflauf wurden unter anderem Warnungen für body-parser, proxy-addr, undici, Capacitor Android und Vite gefunden. Diese sind im lokalen Arbeitsstand gezielt aktualisiert, ohne Major-Upgrades und ohne `npm audit fix --force`:

- Capacitor Core, Android und CLI: 8.4.3.
- undici: 7.30.1; Vite: 8.1.6.
- body-parser: 2.4.0; proxy-addr: 2.0.8.
- xmldom: 0.9.12; brace-expansion: 5.0.12; source-map-js: 1.2.2; nanoid-Override: 3.3.18.

Sowohl `npm audit` als auch `npm audit --omit=dev` melden danach **0 bekannte Schwachstellen**. Das ist keine Garantie für vollständige Sicherheit. Frühere APKs werden dadurch nicht nachträglich korrigiert; die aktualisierten Android-Abhängigkeiten sind in der neu gebauten APK 1.22.1 enthalten.
