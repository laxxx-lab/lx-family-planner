# Nextcloud: mehrere Kalenderziele pro Familie

## Ziel

LX Family soll mehrere schreibende Nextcloud-/CalDAV-Kalender sicher
unterstützen. Ein einzelnes LX-Mitglied kann einen persönlichen Zielkalender
besitzen; gemeinsame Termine gehen in einen gemeinsamen Familienkalender.
Bestehende Installationen mit einem Nextcloud-Kalender bleiben ohne
Datenverlust funktionsfähig.

## Festgelegte Routing-Regeln

1. Ein Termin mit genau einem zugeordneten Mitglied wird in dessen
   persönlichen Zielkalender synchronisiert, sofern einer konfiguriert ist.
2. Termine für mehrere Mitglieder oder die ganze Familie werden in den
   gemeinsamen Zielkalender synchronisiert.
3. Fehlt für ein einzelnes Mitglied ein persönliches Ziel, fällt dessen
   Termin auf den gemeinsamen Zielkalender zurück.
4. Ein LX-Termin hat immer genau ein schreibendes Ziel. Gemeinsame Termine
   werden nicht in mehrere persönliche Kalender kopiert.
5. Ändert sich die Zielgruppe eines Termins, entfernt LX die bisherige
   Remote-Kopie und legt sie im neu berechneten Zielkalender an.

## Datenmodell und Migration

Ein Kalenderziel ist ein bestehender CalDAV-Zugang mit zusätzlicher Rolle:

- `family`: gemeinsamer Zielkalender der Familie;
- `member`: persönlicher Zielkalender mit genau einer LX-Mitglied-ID.

Ein Ziel enthält die verschlüsselte CalDAV-Verbindung, den gewählten
Kalenderpfad, die Rolle und bei persönlichen Zielen die Mitglied-ID. Pro
Familie ist genau ein aktiviertes gemeinsames Ziel erlaubt; pro Mitglied ist
höchstens ein aktiviertes persönliches Ziel erlaubt.

Der heutige Nextcloud-Zwei-Wege-Abgleich wird beim ersten Upgrade als
gemeinsames Ziel weitergeführt. Seine bestehenden Mapping-Daten bleiben unter
dem bisherigen Provider erhalten, damit veröffentlichte Termine nicht erneut
angelegt werden. Neue persönliche Ziele erhalten jeweils einen eigenen,
stabilen Provider-Schlüssel.

## Synchronisation

Vor jedem Abgleich berechnet eine zentrale Routing-Funktion aus
`memberIds`, Zielkonfiguration und Haushalt das eine Ziel eines lokalen
Termins. Sie wird sowohl für Export, Änderungen, Löschungen als auch für die
Bereinigung alter Mappings verwendet.

Ein importierter Termin aus einem persönlichen Kalender wird diesem Mitglied
zugeordnet. Ein importierter gemeinsamer Termin bleibt ein Familientermin,
sofern seine LX-Metadaten keine abweichende Zielgruppe enthalten. Bestehende
LX-ICS-Metadaten für Mitglied, Mitgliederliste und Haushalt bleiben erhalten.

Gleichzeitige lokale und entfernte Änderungen erzeugen weiterhin eine sichtbare
Konfliktkopie. LX löscht keine fremden Termine aus einem Zielkalender. Nur
eigene, über ein LX-Mapping bekannte Remote-Termine werden bei einer
Zieländerung oder lokalen Löschung entfernt.

## Oberfläche

Die Nextcloud-Verwaltung erhält einen Bereich „Kalenderziele“:

- gemeinsamer Kalender als Standardziel;
- persönliche Kalenderziele, jeweils mit Mitgliedsauswahl;
- Verbindungsprüfung, manueller Abgleich, letzter Status und Fehler je Ziel;
- klare Hinweise, welches Ziel ein Termin anhand seiner Zielgruppe nutzt.

Öffentliche oder geteilte Kalender bleiben als Kalenderquellen erhalten.
Sie können nur dann schreibend verwendet werden, wenn ein berechtigter
CalDAV-Zugang hinterlegt ist; schreibgeschützte Abonnements werden nicht als
Ziel angeboten.

## Fehlerfälle und Schutzmaßnahmen

- Kein gemeinsames Ziel: Es wird nichts schreibend synchronisiert; die
  Oberfläche erklärt die fehlende Konfiguration.
- Ungültiges oder gelöschtes Mitgliedsziel: Der Termin fällt kontrolliert auf
  den gemeinsamen Kalender zurück.
- Mehrere widersprüchliche Ziele: Speichern wird serverseitig abgelehnt.
- Ein Zielwechsel löscht die alte Remote-Kopie erst, nachdem die neue Kopie
  erfolgreich angelegt wurde oder eindeutig wiederherstellbar ist.
- Zugangsdaten bleiben ausschließlich als verschlüsselte App-Passwörter auf
  dem LX-Server gespeichert.

## Tests

Servertests decken ab:

1. Migration des vorhandenen einzelnen Nextcloud-Ziels;
2. Routing für ein Mitglied, mehrere Mitglieder und die ganze Familie;
3. Fallback auf den gemeinsamen Kalender;
4. Import aus persönlichen und gemeinsamen Zielen;
5. Zielwechsel inklusive Aufräumen der alten Remote-Kopie;
6. Konflikt, Löschung und fehlgeschlagenen Remote-Export;
7. Berechtigungs- und Duplikatschutz für Ziele.

Playwright-Tests prüfen die Konfiguration von gemeinsamen und persönlichen
Zielen sowie die sichtbare Zuordnung im Kalender.

## Nicht Bestandteil

- Kopien gemeinsamer Termine in mehrere persönliche Kalender;
- OAuth-/OIDC-Anmeldung bei Nextcloud;
- Bearbeitung anonymer öffentlicher Kalender ohne CalDAV-Schreibrechte;
- eine native iOS-App.
