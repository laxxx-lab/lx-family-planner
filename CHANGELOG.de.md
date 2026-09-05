# Changelog

Alle wichtigen Änderungen am LX Family Planner werden hier festgehalten.

## [Unveröffentlicht]

## [1.21.0] – 2026-09-05

### Besser sichtbare Fächerfarben

- Jedes Fach kann jetzt seine eigene Farbe im Stundenplan eines Kindes
  behalten. Die erweiterte, abgestimmte Palette bietet sechzehn gut lesbare
  Farben und verhindert weiterhin beliebige, unruhige Importfarben.
- Stundenkarten erhalten eine klare Farbkante, einen passenden Rahmen und
  eine sehr leichte Flächentönung. Fächer sind sofort unterscheidbar, ohne
  den Plan in große Farbflächen zu verwandeln.
- Bereits gespeicherte Farben bleiben erhalten. Eine Fachfarbe wird erst dann
  für alle Stunden desselben Fachs verwendet, wenn sie im Eintragseditor
  bewusst gewählt oder geändert wird.

## [1.20.3] – 2026-09-03

### Produkt-Symbole für den Einkauf

- Einkaufsartikel erhalten jetzt ein passendes Symbol für das tatsächliche
  Produkt, statt ein gemeinsames Bereichssymbol zu teilen. Eier, Butter, Käse,
  Obst, Gemüse, Getränke und Haushaltsartikel sind schneller erkennbar.
- Die Verbesserung gilt für Katalog, Einkaufsliste, Dashboard und Küchenansicht.
  Alte allgemeine Symbole werden korrigiert, bewusst gewählte eigene Symbole
  bleiben erhalten.

## [1.20.2] – 2026-09-03

### Mobiler Familienreise-Hotfix

- Das vollständige Familienreise-Menü bleibt auf Android-Handys immer sichtbar.
  Die sieben Bereiche liegen als kompaktes, fixes Zwei-Zeilen-Raster vor,
  statt seitlich in einer schwer entdeckbaren Leiste zu verschwinden.

## [1.20.1] – 2026-09-03

### Familien-Telefonbuch und ruhiger Stundenplan

- Eltern können wichtige Nummern für Ärzte, Schule, Betreuung, Behörden,
  Versicherungen und Notfälle in einem durchsuchbaren Familien-Telefonbuch
  hinterlegen. Kinder- und verwaltete Profile sehen dieses Verzeichnis nicht.
- Fächer im Stundenplan erhalten eine zurückhaltende, abgestimmte Palette mit
  feiner Farbkante und Farbpunkt statt großer Farbflächen. So bleiben Fächer
  schnell erkennbar, ohne den Plan unruhig wirken zu lassen.
- Der Server akzeptiert nur die abgestimmte Fachpalette. Alte oder importierte
  freie Farben können den Stundenplan dadurch nicht mehr uneinheitlich machen.

## [1.20.0] – 2026-08-27

### Sicherer Familienumzug und Wiederherstellen im Alltag

- Familien können jetzt in der Elternzentrale eine verschlüsselte,
  passwortgeschützte Umzugsdatei erstellen und diese auf einem neuen, leeren
  LX-Family-Server einspielen.
- Der Umzug enthält Familienprofile, PINs, Kalender, Aufgaben, Notizen,
  Rezepte, lokale Rezeptbilder und den Papierkorb. Geräte- und
  servergebundene Verbindungen werden auf dem neuen Server bewusst neu
  verbunden.
- Gelöschte Termine, Aufgaben, Notizen, Mahlzeiten, Rezepte, Einkaufs- und
  Chat-Einträge landen im Familienpapierkorb. Eltern können einzelne Einträge
  zurückholen oder dauerhaft entfernen.

### Schneller Termine anlegen

- Ein Klick auf einen freien Bereich der Wochenansicht startet einen
  30-Minuten-Termin. Ein Aufziehen über einen Zeitraum öffnet die Eingabe mit
  genau diesem Zeitraum.
- Überlappende Kalenderkarten nutzen den vorhandenen Platz auf schmalen und
  breiten Ansichten besser aus.

### Angenehmere Formulare auf dem Handy

- Auf Touch-Geräten setzt das Terminformular den Cursor nicht mehr sofort in
  den Titel. Dadurch verdeckt die Tastatur nicht mehr Zeit und Aktionen.

## [1.19.6] – 2026-08-27

### Benachrichtigungseinstellungen

- Die Browserprüfung für ntfy-Themen erzeugt in modernen Browsern keinen
  Konsolenfehler mehr. Sichere Namen mit Buchstaben, Zahlen, Unterstrichen und
  Bindestrichen bleiben weiterhin erlaubt.

## [1.19.5] – 2026-08-27

### Android-Wochenkalender

- Die Wochenansicht fängt vertikale Wischgesten nicht mehr ab. Die gesamte
  Kalenderseite lässt sich wieder nach oben und unten scrollen, während die
  Tages-Spalten auf schmalen Geräten weiterhin seitlich erreichbar bleiben.

## [1.19.4] – 2026-08-26

### Klarerer Familienkalender

- Die Wochenansicht zeigt den gesamten Tag von 00:00 bis 24:00 Uhr. Parallel
  laufende Termine bleiben auf ihrer tatsächlichen Uhrzeit und sind seitlich
  klar voneinander getrennt.
- Kalenderquellen können gezielt mehreren Familienprofilen zugeordnet werden.
  Eine Warnung macht auf bereits verwendete Quellfarben aufmerksam.
- ICS-Exporte enthalten Endzeit und Enddatum, damit andere Kalender Termine
  korrekt übernehmen.
- Der Dialog für die Server-Adresse blockiert das Scrollen nicht mehr; die
  Sicherungsverwaltung bleibt auch in der schmalen Elternzentrale übersichtlich.

## [1.19.3] – 2026-08-25

### Wiederkehrende Familientermine

- eigene Kalendereinträge können täglich, wöchentlich, monatlich, jährlich
  oder in einem frei wählbaren Rhythmus wiederholt werden;
- ein Enddatum begrenzt eine Serie bei Bedarf; ohne Enddatum läuft sie weiter;
- jede einzelne Wiederholung erhält ihre eigenen Terminerinnerungen;
- Terminserien bleiben ein einzelner, übersichtlicher Eintrag. Änderungen und
  Löschen wirken bewusst auf die gesamte Serie und werden bei Zwei-Wege-CalDAV
  als Standard-RRULE mitgegeben.

## [1.19.2] – 2026-08-25

### Klarerer gemeinsamer Kalender und sichere Familienabläufe

- Kalendereinträge behalten nun eine stabile Tagesbreite, überlappen als
  lesbare Karten und nutzen eine feste Familienfarbe bzw. die Profilfarbe der
  zugewiesenen Person;
- die vollständige Navigation liegt kompakt im Menü, während persönliche
  Schnelllinks kurz bleiben und „Mein Bereich“ immer zuerst zeigen;
- iPhone-Nutzer erhalten eine klare Safari-Anleitung für den Home-Bildschirm;
  die Anmeldung verbraucht keinen Platz mehr für Release-Hinweise;
- Familien können geprüfte Datenbanksicherungen inklusive geschütztem
  Wochenplan erstellen und zurückspielen sowie einen optionalen
  Zwei-Wege-CalDAV-Kalender verbinden. Zusätzlich kann das Familienarchiv
  nun mit einem eigenen WebDAV-Server oder NAS verbunden werden.

## [1.19.1] – 2026-08-23

### Stundenplan aufgeräumt

- Der Wochenstundenplan ist jetzt ein ruhiges, gut lesbares Raster mit
  Unterrichtsstunden links und Wochentagen oben – statt einzelner Listen pro
  Tag.
- Bearbeiten, einmaliger Ausfall und Löschen bleiben aus der Planansicht
  heraus und erscheinen für Eltern erst nach Klick auf das betreffende Fach.
- Auf schmalen Bildschirmen bleibt der komplette Plan durch horizontales
  Wischen lesbar, ohne Fächer unbrauchbar zusammenzudrücken.

## [1.19.0] – 2026-08-23

### Schule, CalDAV, Aufgaben und iOS

- Kinderprofile erhalten einen vollständigen, editierbaren Wochenstundenplan
  mit Fächern, Räumen, Lehrkräften und Unterrichtszeiten;
- externe Kalender lassen sich schreibgeschützt per ICS oder CalDAV anbinden.
  Synology Calendar wird über seine offizielle Konto-Adresse automatisch
  erkannt; unpassende Synology-Systemordner werden sicher übersprungen;
- Aufgaben können täglich, an ausgewählten Wochentagen, wöchentlich oder
  monatlich wiederkehren und optional nur am Fälligkeitstag sichtbar sein;
- auf iOS-Geräten erklärt LX Family in Safari den Weg über **Teilen → Zum
  Home-Bildschirm** und startet danach über ein eigenes Icon ohne Safari-Leiste;
- Kopfzeile, Profilwechsel, Kalenderaktionen, Schnell-Erfassung und Dialoge
  bleiben auf schmalen iOS-Bildschirmen erreichbar und korrekt scrollbar;
- Rezeptansicht und Bearbeitung geben auf kleinen Bildschirmen klareres
  Feedback und schneiden wichtige Aktionen nicht mehr ab;
- der Anmeldebildschirm zeigt bereits vor der Profilauswahl kompakt, was sich
  in der installierten Version geändert hat.

## [1.18.4] – 2026-08-11

### Kalender und mobile Übersicht

- die gewählte Kalenderansicht (Liste, Woche oder Monat) bleibt nun pro Profil
  und Gerät erhalten, auch nach dem Wechsel in einen anderen Bereich;
- Kalender- und persönliche Übersicht nutzen auf Smartphones einen deutlich
  kompakteren Kopfbereich, damit die eigentlichen Inhalte schneller sichtbar
  sind;
- die Müll-Kachel im Dashboard zeigt jetzt die passende Tonne bzw. bei einer
  gebündelten Abholung alle passenden Tonnen statt eines allgemeinen Symbols.

## [1.18.3] – 2026-08-10

### Verlässliche Update-Bereinigung

- nach bestandenem Daten- und Gesundheitscheck startet die Sicherungsbereinigung
  in einem frischen LX-Container, damit Besitzrechte aus älteren Installationen
  vor dem Aufräumen repariert werden können;
- verhindern alte Dateirechte das Aufräumen weiterhin, bleibt das geprüfte
  Update aktiv und alle vorhandenen Sicherungen bleiben unverändert erhalten,
  statt dass die Anwendung unnötig zurückgesetzt wird.

## [1.18.2] – 2026-08-10

### Dauerhafte Android-Verbindung und neue Heimserver-Stores

- die Android-App speichert den ausgewählten LX-Family-Server jetzt zusätzlich
  im nativen Android-Speicher und stellt ihn vor dem App-Start wieder her;
- vorhandene Serveradressen aus dem bisherigen App-Speicher werden automatisch
  übernommen;
- Docker-Installationen erzeugen bei Bedarf selbstständig einen starken,
  dauerhaft im Datenordner gespeicherten Sicherheitsschlüssel;
- der gehärtete Containerstart verursacht keinen Konflikt mehr mit dem
  Init-Prozess;
- APK-Metadaten werden nur noch verwendet, wenn ihre Prüfsumme zur tatsächlich
  ausgelieferten APK passt; dadurch kann keine alte Datei im Datenordner ein
  Android-Update blockieren;
- das Dockerfile baut nun auch mit älteren Docker-Engines ohne BuildKit;
- Installationspakete, Metadaten und Screenshots für CasaOS/ZimaOS und Cosmos
  sind enthalten;
- erste Aufgaben des FamilyContext wurden ohne Änderung der Familiendaten in
  eigene Start-, Benachrichtigungs-, Toast- und Hilfsmodule aufgeteilt.

## [1.18.1] – 2026-08-09

### Marke LX Family

- LX Family Planner erscheint nun überall als **LX Family · Private Family
  OS**;
- Android-App, Docker-Image, Repository-Adresse und App-Kennung bleiben
  absichtlich kompatibel, damit bestehende Installationen ohne Neuinstallation
  aktualisiert werden;
- das Release-Image wirbt nicht mehr mit einer entwicklereigenen öffentlichen
  Domain und bleibt für jede selbst gehostete Installation neutral.

## [1.18.0] – 2026-08-08

### Sprachen und Fehlerkorrekturen

- fünf neue Benutzeroberflächen-Sprachen: Französisch, Spanisch,
  Italienisch, Niederländisch und Polnisch; fehlende Übersetzungen fallen
  sauber auf Englisch zurück;
- „Heute im Blick" und das Kalender-Badge zählen nur noch die Termine des
  aktuellen Tages statt aller anstehenden Termine (#15);
- „Meine Termine" startet korrekt am heutigen Tag (#11);
- zugewiesene Termine zeigen die Profilnamen statt pauschal
  „Familientermin" (#15);
- die Tab-Leiste verschiebt sich beim Wechsel nicht mehr, und der letzte Tab
  bleibt in Firefox erreichbar (#3);
- die Hardware-Zurück-Taste und Wischgeste navigiert auf Android innerhalb
  der App zurück statt sie zu verlassen (#15);
- das Ansichtsatelier schneidet die Fußzeile nicht mehr ab, wenn die
  bedingten Auswahlfelder eingeblendet werden (#15);
- der Onboarding-Dialog „Familie erstellen" zeigt, warum „Weiter" inaktiv ist
  (Passwort zu kurz oder Einladungscode erforderlich).

## [1.17.0] – 2026-08-05

### Mobile Navigation

- auf Handys und Tablets im Hochformat ersetzt eine ausklappbare Seitenleiste
  (Drawer) die bisherige horizontale Scroll-Leiste; sie lässt sich über das
  ☰-Symbol in der Kopfzeile öffnen (#14)
- alle Menüpunkte und Badges sind auf einen Blick sichtbar und nicht mehr
  hinter einer horizontalen Scrollbahn versteckt
- nach der Auswahl eines Punktes schließt der Drawer automatisch
- auf schmalen Bildschirmen sind auch Sprache, Theme, Server-Einstellungen und
  Abmeldung in den Drawer ausgelagert, die Kopfzeile behält nur Marke,
  Menübutton, Benachrichtigungen und Profil
- Desktop und Tablets im Querformat ab 900 px behalten die gewohnte
  horizontale Tab-Leiste unverändert

## [1.16.2] – 2026-08-04

### Benachrichtigungen, Wanddisplay und feinere Profilrechte

- ntfy steht als zusätzlicher, optionaler Push-Kanal neben Gotify zur Verfügung
- ein eigenes, schreibgeschütztes Wanddisplay-Profil erlaubt nur Lesen und die
  beiden vorgesehenen Abhak-Aktionen, sodass an einem geteilten Tablet keine
  Einstellungen geändert oder Profile gewechselt werden können
- die Tabletansicht fragt beim Abhaken mit großen Profil-Bubbles „Wer hat die
  Aufgabe erledigt?“, anstatt die Ansicht zu verlassen – so bleibt das Abhaken
  am zentralen Display schnell
- Aufgaben lassen sich als gemeinsam markieren, sodass ein einziges Abhaken an
  dem Tag für alle zählt, während die Sterne an die Person gehen, die es
  tatsächlich erledigt hat
- die erwachsenen Positionen „Tochter (erwachsen)“ und „Sohn (erwachsen)“
  erhalten Familien-Admin-Rechte, und der Zugriff auf Cloud oder Briefkasten
  lässt sich pro Profil unabhängig von der Rolle vergeben
- beim Wechsel von einem Erwachsenen- zu einem Kinderprofil werden Cloud und
  Eltern-Bereiche nun sofort geschlossen und die Ansicht springt zurück aufs
  Dashboard
- einzelne Module wie Briefkasten oder Cloud lassen sich global für die ganze
  Familie oder pro Profil ausblenden

### Kalender, Home Assistant und Cloud-Uploads

- die Müllabfuhr-Kachel kann auf immer, nie oder nur eine einstellbare Anzahl
  Tage vor der nächsten Abholung gestellt werden
- die Liste der Home-Assistant-Entitäten scrollt in einer begrenzten Höhe,
  statt viele Geräte zu feinen Strichen zusammenzuquetschen, und bei Auswahl
  eines Geräts klappt der Detailbereich „Bedienung erlauben“ auf
- beim Fehlschlagen eines Cloud-Uploads wird jetzt der konkrete HTTP-Statuscode
  angezeigt, statt still abzubrechen

### Freiwillige Projektunterstützung

- das Repository ist für den offiziellen GitHub-Sponsors-Button vorbereitet
- eine ruhige, zweisprachige Unterstützen-Karte für einmalige oder monatliche
  Beiträge ist für die öffentliche Anmeldung und die Erwachsenen-Einstellungen
  fertig, bleibt aber bis zur tatsächlichen Freigabe des Sponsors-Profils
  unsichtbar
- Kinderprofile, Haustierprofile, Dashboards und die Profilauswahl zeigen
  niemals einen Unterstützungsaufruf
- Unterstützung bleibt freiwillig und schaltet weder Funktionen noch Grenzen
  oder eine bezahlte Vorzugsbehandlung frei

## [1.16.1] – 2026-08-04

### Hotfix für Android-Teilen und die mobile Sprachwahl

- die Android-App erscheint nun beim Teilen von My-Recipe-Box-Backups im
  `.rtk`-Format und bei kompatiblen ZIP-Dateien
- geteilte RTK-Dateien öffnen automatisch den Rezeptbereich und übernehmen
  Rezepte, eingebettete Bilder sowie Quellen ohne den Umweg über die Dateiwahl
- eingehende Archive werden geschützt im temporären App-Speicher abgelegt,
  auf 120 MB begrenzt und vor dem Import geprüft
- die Auswahl zwischen Deutsch und Englisch bleibt auf schmalen
  Android-Displays vollständig sichtbar und zeigt `DE` oder `EN` direkt in
  der Kopfzeile
- vorhandene Familien, Profile, Rezepte, Dateien und Einstellungen bleiben
  unverändert erhalten

## [1.16.0] – 2026-08-03

### Geburtstage, gemeinsame Aufgaben, Rezeptpflege und sichere Designs

- Profile besitzen ein optionales Geburtsdatum; daraus entstehen automatisch
  schreibgeschützte Familientermine für jedes Kalenderjahr
- Geburtstagsmeldungen werden eine Woche vorher und am Geburtstag an die
  übrigen angemeldeten Familienprofile zugestellt
- die Familieneinrichtung verlangt mindestens ein angemeldetes Erwachsenenprofil
  mit Verwaltungsrechten und erklärt verständlich, warum es benötigt wird
- bereits gesperrte Familien mit einem normalen Haushaltsprofil erhalten beim
  Update automatisch wieder einen Verwaltungszugang
- gemeinsame Aufgaben können mehreren Profilen angeboten werden und schreiben
  die Sterne der Person gut, die sie tatsächlich erledigt hat
- Kinder benötigen auch bei gemeinsamen Aufgaben weiterhin die Bestätigung
  des Elternteils, der die Aufgabe angelegt hat
- die Tabletansicht fragt nach dem Abhaken mit großen Profil-Bubbles, wer die
  Aufgabe erledigt hat, und verlässt den Tabletmodus nicht
- Rezepte lassen sich mit Zutaten und Zubereitungsschritten vollständig
  anlegen und nachträglich bearbeiten
- offizielle Tandoor-Standardexporte werden aus ZIP oder JSON eingelesen;
  vorhandene Rezeptbilder werden übernommen
- öffentliche Facebook-Reels lassen sich über Android teilen oder als Link
  einlesen; Beschreibungstext und verlinkte Originalrezepte werden ausgewertet
- Social-Media-Rezepte öffnen sich grundsätzlich als prüfbarer Entwurf und
  werden erst nach einer ausdrücklichen Bestätigung gespeichert
- Dashboard-Vorschauen zeigen pro Familienmitglied nur noch den nächsten
  anstehenden Geburtstag statt mehrere Kalenderjahre gleichzeitig
- die Müllabfuhr-Kachel kann immer, nie oder nur eine einstellbare Anzahl Tage
  vor der nächsten Abholung eingeblendet werden
- drei ruhige Themes ohne Motive und ein getrennt gespeichertes, serverseitig
  geprüftes Custom-CSS-Theme ergänzen die Designauswahl
- die vollständige Oberfläche kann vor der Anmeldung und in der Kopfzeile
  dauerhaft zwischen Deutsch und Englisch umgeschaltet werden
- API-Fehler, Geburtstage, Patchnotes und das Web-App-Manifest folgen ebenfalls
  der gewählten Gerätesprache
- die GitHub-Startseite ist für internationale Besucher auf Englisch aufgebaut;
  die vollständige deutsche Dokumentation bleibt separat erhalten
- englische und deutsche Formulare stehen für Fehler und Ideen bereit
- eine aktuelle Sicherheitswarnung in einer indirekten Build-Abhängigkeit wurde
  auf den korrigierten Patchstand aktualisiert
- dieser Stand ist ausschließlich für lokale Prüfung vorbereitet und wird
  noch nicht veröffentlicht, gepusht oder auf den Produktionsserver verteilt

## [1.15.0] – 2026-08-03

### Kalenderbearbeitung, mehrere Teilnehmer und Kinder-Stundenplan

- Termine lassen sich über die gesamte Kalenderkarte öffnen und anschließend
  vollständig bearbeiten oder löschen
- Titel, Datum, Uhrzeit, Ganztägigkeit, Ende, Ort, Notizen, Erinnerungen und
  Teilnehmer bleiben gemeinsam änderbar
- ein Termin kann nun mehreren Familienmitgliedern gleichzeitig zugeordnet
  werden; vorhandene Einzeltermine bleiben vollständig kompatibel
- geteilte Termine lassen sich von ihrer Besitzerfamilie ebenfalls bearbeiten
  und werden bei verbundenen Familien aktualisiert
- Erwachsene können für jedes Kind einzeln einen Schulbereich aktivieren
- der neue Stundenplan zeigt Montag bis Freitag sowie Fach, Schulstunde,
  Uhrzeit, Raum und Lehrkraft
- einzelne Unterrichtsstunden können für ein konkretes Datum als ausgefallen
  markiert und wiederhergestellt werden; abgelaufene Ausfälle werden bereinigt
- die Rezeptbuch-Aktionen brechen auf schmalen Handys sauber um und bleiben
  vollständig innerhalb der Oberfläche
- bestehende Familien, Termine, Kalenderquellen, Kinderprofile und
  Einstellungen werden unverändert übernommen

## [1.14.3] – 2026-08-03

### Sicherheitsfix für das öffentliche Demo-Konto

- Demo-Sitzungen können keine Integrations- oder Cloud-Routen mehr lesen
- Nextcloud-Zugangsdaten, Dateien, Ordner und Sicherungen werden der Demo
  serverseitig vollständig verweigert
- der Bootstrap liefert für Demo-Sitzungen ausschließlich neutrale,
  getrennte Integrationszustände ohne Adressen, Konten oder Geräte
- Cloud-Navigation und Cloud-Widget werden im Demo-Modus ausgeblendet
- automatische Cloud-Bereitstellung, Synchronisierung, Sicherung und
  Home-Assistant-Verbindungen überspringen das Demo-Konto
- bestehende echte Familienkonten und ihre getrennten Cloud-Speicher werden
  nicht verändert

## [1.14.2] – 2026-08-03

### Sicheres Docker-Update für die neutrale Anmeldung

- Docker erhält ausschließlich die drei Rechte, die zum Vorbereiten der
  eingebundenen Daten- und Sicherungsordner nötig sind
- der Wartungscontainer kann vor einem Update wieder eine konsistente
  Sicherung erstellen und prüfen
- wenn Plattformen wie Umbrel bereits passende Ordnerrechte bereitstellen,
  funktioniert LX weiterhin ohne zusätzliche Container-Rechte
- der Schutz aus 1.14.1 bleibt enthalten: Die Anmeldung verrät keinen echten
  Familiennamen als Beispiel
- bestehende Familien, Profile und Inhalte werden nicht verändert

## [1.14.1] – 2026-08-03

### Neutrale Anmeldung ohne verräterisches Beispiel

- das Feld „Familienname“ nennt öffentlich keinen echten Familiennamen mehr
- der Platzhalter fordert nur noch neutral zur Eingabe des Familiennamens auf
- die Korrektur gilt gleichzeitig für die deutsche und englische Anmeldung
- ein Regressionstest verhindert, dass dort künftig wieder ein konkretes
  Familienkonto als Beispiel erscheint
- ausdrücklich freigegebene Nur-Lese-Demos bleiben davon unberührt

## [1.14.0] – 2026-08-03

### Mehr Kontrolle, bessere Aufgaben und echte Dauertermine

- Unraid-Container reparieren die Rechte ihrer Datenordner beim Start sicher
  und benötigen kein unsicheres `chmod 777` mehr
- Erwachsene können Funktionsbereiche für die ganze Familie oder einzelne
  Profile ein- und ausblenden
- beim Profilwechsel schließt LX geschützte Ansichten sofort und wechselt zum
  passenden Dashboard
- neue Positionen „Tochter (erwachsen)“ und „Sohn (erwachsen)“ erhalten die
  normale Erwachsenenansicht einschließlich Family Cloud
- einzelne Aufgaben lassen sich vollständig bearbeiten und mit einer
  Sicherheitsabfrage löschen
- Aufgaben unterstützen Beschreibung, Fälligkeitsdatum und Uhrzeit
- Termine können jetzt eine Dauer haben, mehrere Tage umfassen oder als
  ganztägig markiert werden
- Home-Assistant-Entitäten behalten bei langen Listen ihre volle Höhe und
  Detailoptionen bleiben erreichbar
- Cloud-Fehler nennen den konkreten HTTP-Status, damit blockierte Uploads
  verständlich werden
- alle Änderungen sind für Handy, Tablet und Desktop geprüft; vorhandene
  Familieninhalte und Einstellungen bleiben beim Update erhalten

## [1.13.2] – 2026-08-03

### Private Familienanmeldung und geschlossene Registrierung

- Familiennamen und Profilanzahlen werden standardmäßig nicht mehr ohne
  Anmeldung veröffentlicht
- Anmeldung funktioniert direkt mit Familienname und Familienpasswort
- sichere Voreinstellung `first-family`: Nur die erste Familie einer neuen
  Installation darf sich selbst anlegen
- optionale kontrollierte Registrierung über einen persönlichen Einladungscode
- ausdrücklich konfigurierte Nur-Lese-Demo bleibt separat erreichbar
- neue oder geänderte Familienpasswörter benötigen mindestens zehn Zeichen
- Regressionstest verhindert dauerhaft eine zweite freie Registrierung und
  eine versehentlich öffentliche Familienliste
- vorhandene Familiendaten, Profile, Cloud-Dateien und Einstellungen bleiben
  beim Update unverändert

## [1.13.1] – 2026-07-30

### Das öffentliche Projekt ist direkt erreichbar

- neue Open-Source-Einladung auf der öffentlichen Familienauswahl
- direkter GitHub-Link in der Familienverwaltung neben der Versionsnummer
- klare Möglichkeiten zum Ansehen, Mitmachen und Hinterlassen eines Sterns
- Gestaltung passt sich hellen und dunklen Themen an
- responsive Darstellung für Handy, Tablet und Desktop
- Verweise öffnen ausschließlich das öffentliche Repository und übertragen
  keine Familieninhalte

## [1.13.0] – 2026-07-29

### Echte Cover in der Kinder-Medienlounge

- YouTube- und Spotify-Kacheln zeigen jetzt das echte Kanal-, Video-,
  Playlist- oder Album-Cover statt eines großen Plattform-Symbols
- Spotify-Metadaten kommen ohne eigenen API-Schlüssel aus der offiziellen
  oEmbed-Schnittstelle
- YouTube-Videos verwenden ihr offizielles Thumbnail; bei Kanal-Links liest
  LX kontrolliert das offizielle Vorschaubild der YouTube-Seite
- nur HTTPS-Bilder von freigegebenen YouTube- und Spotify-Bildservern werden
  gespeichert; beliebige externe Cover-Adressen werden verworfen
- bestehende Medien-Widgets werden nach dem Update automatisch ergänzt und
  ihre Cover regelmäßig vorsichtig aktualisiert
- neues bildzentriertes Kartendesign mit lesbarem Verlauf, kompakter
  Abspielschaltfläche und sauberem Fallback in allen Themes
- Eltern sehen die Cover bereits in der Medienverwaltung
- Regressionstests prüfen YouTube-Video-/Kanalbilder, Spotify-oEmbed und die
  Blockierung fremder Bildserver

## [1.12.1] – 2026-07-29

### Chatfotos vollständig im Familienarchiv

- eingebettete Fotos aus älteren App- und Browserständen werden beim Senden
  automatisch als echte Cloud-Anhänge gespeichert
- vorhandene eingebettete Chatfotos werden nach einem Update automatisch in
  `Familie/Chat/Jahr-Monat` verschoben
- die Nachricht bleibt während der Umstellung vollständig erhalten und
  verweist danach auf die geschützte Cloud-Datei
- Chatbilder lassen sich per Tipp in einer großen Vollbildansicht öffnen
- die Bildansicht funktioniert auf Handy, Tablet und Desktop, liegt sicher
  über allen Menüs und bietet einen direkten Download
- Regressionstest deckt ausdrücklich den alten `photo`-Sendeweg und den
  anschließenden geschützten Dateiabruf ab

## [1.12.0] – 2026-07-29

### Native App-Updates und Chat-Anhänge in der Family Cloud

- Versionsprüfung läuft beim Android-App-Start, beim Zurückkehren in die App
  und zusätzlich regelmäßig im Hintergrund der geöffneten App
- neuer nativer Update-Ablauf lädt die APK innerhalb von LX, prüft die
  veröffentlichte SHA-256-Summe und öffnet danach den Android-Installer
- Update-Hinweis ist auch vor der Familienanmeldung sichtbar und kann für den
  aktuellen App-Start auf später verschoben werden
- Chat-Anhänge werden nicht mehr als große Base64-Daten in den
  Chat-Datensätzen gespeichert, sondern als echte Dateien in der Family Cloud
- Bilder, Videos, Audio, PDF-/Office-Dokumente, ZIP/Archive und APKs bis
  100 MB sowie bis zu acht Anhänge pro Nachricht
- geschützte Vorschau und Download im Chat; aktive Dateitypen werden niemals
  ungeprüft im Browser ausgeführt
- signierte Anhangsmetadaten verhindern, dass Clients beliebige Cloud-Pfade
  als Chat-Datei ausgeben; Direkt- und Gastchat-Berechtigungen gelten auch für
  den Dateiabruf
- Anhänge aus Direktnachrichten werden vor dem Cloud-Upload mit AES-256-GCM
  verschlüsselt und bleiben selbst im gemeinsamen Nextcloud-Konto privat
- vorhandene eingebettete Chatfotos bleiben vollständig kompatibel
- gemeinsame Chat-Ablage unter `Familie/Chat/Jahr-Monat`
- automatische Cloud-Grundstruktur mit `Familie`, `Familie/Uploads` und einem
  Ordner unter `Profile` für jedes echte Nutzerprofil
- Dashboard-Uploads öffnen eine Zielordnerauswahl mit direkter
  Ordnererstellung; Dateien im Cloud-Stammverzeichnis werden verhindert
- allgemeines Datei- und Chat-Uploadlimit auf 100 MB je Datei erweitert
- Regressionstests prüfen Cloud-Ordner, ZIP-Upload, sicheren Abruf und
  manipulierte Anhangsmetadaten

## [1.11.0] – 2026-07-29

### Das Familienarchiv wird zum eigenen Arbeitsbereich

- die Seite **Family Cloud** zeigt nur noch Dateien, Ordner, Speicher und
  Upload-Aktionen; technische Einstellungen wurden vollständig entfernt
- Cloud-Verbindung, Kalendersynchronisation, Sicherungen und Zugangsdaten
  befinden sich jetzt gesammelt in der Elternzentrale
- der bisherige externe Link zum Nextcloud-Familienordner wurde entfernt,
  damit niemand vor einem unerwarteten Nextcloud-Login landet
- neues Dashboard-Widget **Familienarchiv** mit Speicherstand, letzten
  Inhalten und direktem Upload
- Galerie- und Listenansicht, Suche im aktuellen Ordner und freundliche
  Pfadnavigation ergänzen die integrierte Dateiverwaltung
- Bilder erhalten echte Vorschaubilder; Ordner werden als visuelle
  Sammlungen dargestellt
- Mobil- und Tabletansicht sowie dunkle Themes wurden visuell geprüft

## [1.10.2] – 2026-07-29

### Selbstheilende Family-Cloud-Konten

- verwaltete Nextcloud-Verknüpfungen werden beim automatischen Cloud-Lauf
  nicht mehr ungeprüft übersprungen
- wurde das zugehörige Nextcloud-Konto gelöscht oder ist sein App-Zugang
  ungültig, richtet LX dasselbe isolierte Familienkonto automatisch neu ein
- Familienordner, Kalender, App-Passwort und das Speicherlimit werden dabei
  wiederhergestellt
- fremde oder manuell verbundene Nextcloud-Instanzen werden von der Reparatur
  nicht verändert
- ein Regressionstest bildet das gelöschte Testkonto und die anschließende
  automatische Wiederherstellung vollständig ab

## [1.10.1] – 2026-07-29

### Automatische Nextcloud-Konten und sichtbarer Speicher

- vorhandene Familien ohne Cloud-Verbindung werden nach dem Serverstart
  automatisch in der mitgelieferten Nextcloud eingerichtet
- neue Familien erhalten kurz nach der Registrierung automatisch ein
  getrenntes Nextcloud-Familienkonto
- Konto, App-Passwort, Familienkalender und Ordner `LX Family` werden ohne
  zusätzlichen Klick erzeugt
- standardmäßig erhält jede Familie 10 GB Speicher; über
  `NEXTCLOUD_FAMILY_QUOTA` frei konfigurierbar
- Speichernutzung wird live aus Nextcloud gelesen und als Fortschrittsanzeige
  im integrierten Familienarchiv dargestellt
- ausdrücklich getrennte Cloud-Verbindungen werden über eine
  Opt-out-Markierung nicht automatisch wiederhergestellt
- `NEXTCLOUD_AUTO_PROVISION=false` schaltet die automatische Einrichtung bei
  Bedarf serverweit ab
- interne Nextcloud-Adresse kann für besondere Docker-Netze über
  `NEXTCLOUD_INTERNAL_URL` vorgegeben werden
- automatischer Test prüft Konto, Kontingent, Ordner, Kalender und
  idempotente Wiederholung

## [1.10.0] – 2026-07-29

### Integrierte Family Cloud, Familienpost und Chatgäste

- Nextcloud-Dateiansicht direkt in LX Family mit Ordnernavigation,
  Bild-/PDF-/Textvorschau, Download und geschütztem Löschen
- Mehrfach-Upload per Dateiauswahl und Drag-and-drop bis 25 MB pro Datei
- Cloud-Dateien werden ausschließlich über die angemeldete LX-Sitzung und den
  serverseitig verschlüsselten Nextcloud-Zugang übertragen
- neuer Erwachsenenbereich **Familienpost** für private Briefe zwischen
  bestätigten Familienverbindungen
- Briefe unterstützen Antworten, Eingang/Gesendet, gelesen und persönliches
  Archivieren
- gezielte Einladung einzelner Erwachsenenprofile wie Oma oder Opa in den
  Gruppenchat einer verbundenen Familie
- Chatgast muss selbst zustimmen und sieht ausschließlich Gruppennachrichten
  ab dem Zeitpunkt der Zustimmung; Direktnachrichten und ältere Verläufe
  bleiben verborgen
- Familienpost und Chat-Einladungen an Browser-, Android- und Gotify-
  Benachrichtigungen angebunden
- Kalenderänderungen per `PATCH` in Browser und Android wieder freigegeben;
  dadurch lassen sich Erinnerungszeitpunkte wieder speichern
- mobiler **Problem melden**-Knopf aus der schwebenden Bedienebene entfernt
  und als normaler Seitenabschluss dargestellt
- neues, wiederholbar ausführbares Cloud-Domain-Skript setzt
  `trusted_domains`, `overwrite.cli.url` und HTTPS korrekt
- Nextcloud-Aktivierung bewahrt vorhandene vertrauenswürdige Domains statt
  sie beim erneuten Start zu überschreiben
- additive Datenbankmigration für Briefe, Lesestatus und Chat-Einladungen;
  bestehende Familieninhalte bleiben unangetastet

## [1.9.3] – 2026-07-29

### Erreichbare Nextcloud-Adresse statt Domain-Port-Mischung

- öffentliche Planer-Domains erhalten nicht länger automatisch Port `8080`
- neue Servervorgabe `NEXTCLOUD_PUBLIC_URL` für die tatsächlich erreichbare
  Browser-Adresse
- Docker-Aktivierung setzt ohne öffentliche Vorgabe automatisch die
  funktionierende Heimnetz-Adresse
- bestehende gebündelte Verbindungen verwenden die Servervorgabe sofort, ohne
  Trennen oder erneutes Anlegen des Cloud-Kontos
- Zugangsanzeige, Familienordner-Link und Einstellungsformular verwenden
  dieselbe zentrale Adresse
- Hinweise für separate HTTPS-Subdomain und Reverse-Proxy ergänzt

## [1.9.2] – 2026-07-29

### Family Cloud als eigener Hauptbereich

- neuer, nur für Erwachsene sichtbarer Menüpunkt **Family Cloud**
- Nextcloud-Einrichtung aus der langen Elternzentrale herausgelöst
- direkte Ansicht für Kalenderabgleich, Cloud-Sicherungen und Familienordner
- `?view=cloud` und Benachrichtigungsnavigation als gültiges Ziel ergänzt
- eingeschränkte Erwachsenenprofile behalten Zugriff auf Cloud und
  Elternzentrale
- responsive Seitenfläche mit allen vorhandenen Theme-Variablen

## [1.9.1] – 2026-07-29

### Direkter Zugriff auf den automatisch angelegten Familienordner

- automatisch erzeugtes Web-Kennwort wird zusammen mit dem App-Passwort
  verschlüsselt im jeweiligen Familienbereich gespeichert
- Erwachsene können Nextcloud-Adresse, Benutzername und Kennwort gezielt unter
  **Verbindung verwalten → Cloud-Zugang anzeigen** öffnen
- einzelne Kopierknöpfe mit Fallback für lokale HTTP-Heimnetze
- Antwort mit Zugangsdaten wird ausdrücklich nicht zwischengespeichert
- Zugang wird im Browser erst auf Klick geladen und beim Trennen verworfen

## [1.9.0] – 2026-07-29

### Vollautomatische Family Cloud

- mitgelieferte Nextcloud auf dem Produktionsserver aktiviert
- automatische Einrichtung direkt aus der Elternzentrale
- getrenntes Nextcloud-Konto pro Familie statt gemeinsamem Administratorkonto
- zufälliges Startkennwort und widerrufbares App-Passwort werden serverseitig
  erzeugt; nur das App-Passwort wird verschlüsselt in LX gespeichert
- eigener Familienkalender wird angelegt, wenn noch keiner vorhanden ist
- Familienordner und erster Zwei-Wege-Kalenderabgleich werden sofort vorbereitet
- Trennen der Verbindung widerruft das verwendete App-Passwort in Nextcloud
- manuelle Verbindung zu einer vorhandenen Nextcloud bleibt erhalten
- Docker-Helfer wartet auf den vollständigen Nextcloud-Start und versucht,
  die offizielle Kalenderoberfläche zu ergänzen
- automatische Tests für Kontotrennung und erneuerbare Cloud-Zugänge ergänzt

## [1.8.1] – 2026-07-29

### App-Icon mit sicherem Abstand

- Kalender- und Familienmotiv auf 82 Prozent verkleinert
- rundherum eine farblich passende Sicherheitszone ergänzt
- Übergang zwischen Motivfläche und Icon-Hintergrund weich ausgeblendet
- normale, runde und adaptive Android-Icons neu erzeugt
- Android-Version auf Code 18 erhöht, damit Geräte das Icon-Update erkennen

## [1.8.0] – 2026-07-29

### Flexible Erinnerungen und neuer App-Auftritt

- Kalendertermine unterstützen mehrere auswählbare Erinnerungszeitpunkte
- zusätzliche Presets für 15 Minuten und 12 Stunden
- Mülltermine erinnern standardmäßig einen Tag vorher um 09:00 Uhr
- importierte und bereits vorhandene Abholtermine erhalten den sicheren
  Vortags-Standard automatisch
- Müll-Erinnerungen lassen sich pro Abholung ändern oder ganz ausschalten
- Android-, Browser- und Gotify-Auslieferung verwenden dieselbe Kalenderregel
- neuer App-Icon-Entwurf für Android, Web-App, Manifest und README
- automatische Tests sichern Standard, Abschalten und doppelte Zustellung ab

## [1.7.7] – 2026-07-29

### Offenen Capacitor-Thenable-Fehler umgangen

- Ursache des Hängers bei „Android wird vorbereitet“ anhand des offenen
  Capacitor-Issues #8472 verifiziert
- Capacitor-Plugin-Proxys überschreiten keine Promise-/Async-Grenze mehr
- Listener-Einrichtung verwendet einen sicheren einfachen Objekt-Container
- Regressionstest simuliert exakt die fehlerhafte Thenable-Erkennung
- direkte native Firebase-Diagnose und Token-Rückgabe aus Version 1.7.6 bleiben
  erhalten

## [1.7.6] – 2026-07-29

### Direkte native Firebase-Token-Brücke

- eigener nativer Android-Weg liefert den Firebase-Geräteschlüssel direkt
- Firebase-Konfiguration und Google Play-Dienste werden vorab geprüft
- der unzuverlässige ereignisbasierte Rückweg des Standard-Plugins entfällt
- Netzwerk-, Firebase- und Play-Services-Probleme werden konkret angezeigt
- der allgemeine 45-Sekunden-Abbruch verdeckt keine eigentliche Ursache mehr

## [1.7.5] – 2026-07-28

### Android-Push-Modul fest in die App integriert

- das Push-Modul wird nicht mehr als separate Laufzeitdatei nachgeladen
- der auf dem betroffenen Android-Gerät erkannte Modul-Ladehänger entfällt
- alle nachfolgenden Diagnose- und Zeitgrenzen aus Version 1.7.4 bleiben aktiv
- vorhandene Profile, Anmeldung und Familiendaten bleiben erhalten

## [1.7.4] – 2026-07-28

### Gesamte Android-Push-Anmeldung gegen Hänger abgesichert

- jeder native Einzelschritt besitzt jetzt eine feste Zeitgrenze
- der Knopf zeigt während der Anmeldung den aktuellen Arbeitsschritt
- auch Serverprüfung und Speichern des Geräteschlüssels können die Oberfläche
  nicht mehr unbegrenzt blockieren
- eine konkrete Fehlermeldung bleibt direkt in der Elternzentrale sichtbar
- die vorhandenen Familien- und App-Daten bleiben unverändert

## [1.7.3] – 2026-07-28

### Kein endloses „Wird verbunden …“ mehr

- die Android-Firebase-Registrierung blockiert den eigenen Zeitwächter nicht
  mehr
- spätestens nach 20 Sekunden erscheint entweder die erfolgreiche Anmeldung
  oder die konkrete Android-/Firebase-Ursache
- automatischer Test simuliert einen vollständig festhängenden nativen
  Registrierungsaufruf

## [1.7.2] – 2026-07-28

### Android-Push-Status eindeutig und robust

- der bestätigte Firebase-Serverstatus wird bereits mit dem normalen
  Familien-Startabruf geliefert
- ein Fehler bei Gerätekennung oder Android-Berechtigung kann nicht mehr
  fälschlich als fehlender Firebase-Dienstschlüssel erscheinen
- ein gemeinsamer API-Weg verhindert unterschiedliche Cache- und
  Sitzungsbehandlung
- ältere Android-WebViews erhalten eine kompatible lokale Gerätekennung
- die Elternzentrale zeigt echte Abruffehler und bietet „Erneut prüfen“ an

## [1.7.1] – 2026-07-28

### Android-Push zuverlässig aktivieren

- Firebase-Serverstatus und Android-Berechtigung werden unabhängig geprüft
- die Elternzentrale zeigt keinen falschen Hinweis auf eine fehlende
  Firebase-Verbindung mehr, wenn nur die Android-Abfrage stockt
- beide von Android unterstützten Berechtigungsdialoge werden korrekt geöffnet
- Push-Status wird beim Öffnen der Elternzentrale frisch vom Server geladen
- Statusantworten und API-Abfragen werden nicht mehr aus einem alten Cache
  übernommen

## [1.7.0] – 2026-07-28

### Native Android-Benachrichtigungen

- Firebase Cloud Messaging als echter nativer Push-Kanal für die Android-App
- Benachrichtigungen erreichen das Gerät auch bei geschlossener App
- profil- und gerätegebundene Registrierung ohne manuelle Token-Eingabe
- gemeinsame Ereignis-Pipeline für Chat, Kalender, Erinnerungen, Aufgaben,
  Problemmeldungen, Kinderbefinden und weitere wichtige Familienereignisse
- getrennte Android-Kanäle und Prioritäten für allgemeine, dringende, Chat-,
  Kalender- und Aufgabenmeldungen
- Antippen einer Meldung öffnet möglichst direkt den passenden Bereich
- Einstellungen für native App-Benachrichtigungen in Profil und Elternzentrale

### Sicherheit und Betrieb

- Serverauthentifizierung über einen privaten, von Git ausgeschlossenen
  Firebase-Dienstschlüssel
- Android-Build bricht verständlich ab, wenn die passende
  `google-services.json` fehlt
- automatische Datenbankmigration für dauerhaft gespeicherte native Geräte
- Browser-Push und Gotify bleiben als unabhängige, optionale Kanäle erhalten

## [1.6.0] – 2026-07-28

### Family Cloud

- optionale Nextcloud-Anbindung in der Elternzentrale
- konfliktbewusste Zwei-Wege-Synchronisation für den Familienkalender
- stabile Zuordnung von lokalen und entfernten Terminen einschließlich
  Änderungen und Löschungen
- frei wählbarer Nextcloud-Kalender und Standardprofil für externe Termine
- getrennte Option für Termine aus „Zuhause Oma & Opa“
- eigener Familienordner über WebDAV
- manuelle und tägliche, familiengetrennte AES-256-GCM-Backups in Nextcloud
- Zugang ausschließlich über ein widerrufbares App-Passwort; der Schlüssel
  bleibt verschlüsselt im Backend

### Docker und Proxmox

- optionales Nextcloud-34-Profil mit MariaDB, Redis und Cron
- sichere Aktivierung über `Nextcloud-Aktivieren.cmd`,
  `scripts/nextcloud-enable.sh` oder `lx-family nextcloud`
- zufällige Kennwörter und automatisch ergänzte vertrauenswürdige Heimnetz-
  Adressen
- Nextcloud-Daten liegen in unabhängigen Docker-Volumes und bleiben bei
  normalen LX-Updates erhalten

### Zuverlässigkeit

- neue Datenbankmigration für dauerhafte Cloud-Synchronisationszuordnungen
- Konflikttest, DAV-Dateitest und Löschabgleich in der automatischen Testsuite
- Update-Integritätsprüfung umfasst jetzt auch Cloud-Zuordnungen

## [1.5.0] – 2026-07-28

### Proxmox VE

- neuer One-Liner für einen unprivilegierten Debian-12/13-LXC
- Standard- und erweiterter Modus für Ressourcen, Speicher und Netzwerk
- automatische Installation von Docker Engine und LX Family Planner
- sichere Bestätigung vor der Container-Erstellung und kein automatisches
  Löschen bei Fehlern
- Container-Verwaltung über `lx-family` mit Update, Backup, Logs, Domain,
  Neustart und Diagnose

### Docker

- die signierte Android-APK bleibt jetzt ausdrücklich im Docker-Build-Kontext
- neue Docker- und PVE-Installationen liefern App-Download und QR-Code
  vollständig aus

## [1.4.1] – 2026-07-28

### Behoben

- QR-Codes werden nicht mehr mit einer für Handys unbrauchbaren
  `localhost`-Adresse erzeugt
- die API liefert zusätzlich eine vollständige öffentliche APK-Adresse
- lokale Vorschauen erklären stattdessen, wie LX über Heimnetz oder öffentliche
  Domain geöffnet werden kann

### Konfiguration

- neue optionale Variable `PUBLIC_APP_URL` für die feste öffentliche
  Planer-Adresse

## [1.4.0] – 2026-07-28

### Neu

- öffentlicher Android-App-Download direkt auf der Anmeldeseite
- dynamischer QR-Code zum APK-Download über die eigene LX-Adresse
- Anzeige von App-Version, Dateigröße und Android-Mindestversion
- automatisch wiederverwendete Release-Signatur für installierbare Updates
- signierte APK wird als Bestandteil des Docker- und Server-Releases
  ausgeliefert

### Sicherheit und Betrieb

- der private Signierschlüssel bleibt ausschließlich im ignorierten
  `data/android-signing`-Ordner
- Produktionsserver bieten weiterhin nur signierte Release-APKs an
- vorhandene Familien- und App-Daten werden durch das Update nicht verändert

## [1.3.1] – 2026-07-28

### Neu

- ein gemeinsamer Benachrichtigungskatalog für Browser-Push, Posteingang und
  Gotify
- Meldungen für normale und dringende Kinder-Gefühlslagen
- Meldungen für neue und bearbeitete Problemmeldungen
- Benachrichtigungen bei neuen, geänderten und abgesagten Terminen
- Hinweise zu Familienverbindungen, Freigaben und gemeinsamen Terminen
- Meldungen für Belohnungen, Taschengeld, Schule, Routinen und
  Familienmissionen

### Verbessert

- Empfänger werden passend zum Profil bestimmt; verwaltete Profile und
  Haustiere informieren die zuständigen Erwachsenen
- Ruhezeiten werden nur noch von ausdrücklich dringenden Ereignissen
  übergangen
- sämtliche Meldungsarten sind pro Browsergerät sowie für Gotify einzeln
  einstellbar
- der Familien-Posteingang zeigt alle neuen Meldungsarten mit passenden
  Symbolen und direkten Zielen

### Update und Daten

- keine neue Datenmigration erforderlich
- bestehende Push-Geräte und ihre Einstellungen werden um neue Standardregeln
  ergänzt, ohne gespeicherte Auswahl zu verlieren
- alle Familieninhalte und Integrationen bleiben unverändert erhalten

## [1.3.0] – 2026-07-28

### Neu

- mehrere frei kombinierbare Erinnerungszeitpunkte pro Kalendertermin
- serverseitige Zustellung über Familien-Posteingang, Web-Push und Gotify
- Android-App und installierte PWA als Teilen-Ziel für Chefkoch, Pinterest und
  andere Rezept-Apps
- automatischer Rezeptimport aus einem geteilten Link
- auswählbare Server-Adresse in der Android-App für Heimnetz und eigene Domain

### Zuverlässigkeit

- dauerhafte Duplikatkontrolle für Terminerinnerungen
- nach Serverpausen wird nur die sinnvollste fällige Erinnerung nachgeholt
- verwaltete Personen- und Haustiertermine erinnern die zuständigen Erwachsenen
- feste Zeitzone `Europe/Berlin` als Docker-Standard
- automatische Datenbankmigration auf Schema 6
- native Server-Anmeldungen über zugelassene Ursprünge abgesichert

## [1.2.0] – 2026-07-28

### Neu

- Familienreise mit Routinen, Wochenrückblick, Sparzielen, Taschengeld,
  Schulorganisation, Abstimmungen, Mutmachern und Familienmissionen
- verwaltete Profile ohne eigene Anmeldung für Großeltern und betreute Personen
- sichere Verbindungen zwischen Familien für gemeinsame Termine, Aufgaben,
  Belohnungen und Taschengeld
- Home-Assistant-Kacheln mit Profilfreigaben und geschützten Aktionen
- eigene Bilder und eine größere Symbolauswahl für Belohnungen
- „Problem melden“ mit Verwaltung in der Elternzentrale
- einmalige, profilgebundene Patchnotes für Erwachsene und Großeltern

### Verbessert

- dunkle Designs für Einkaufskatalog, Produktkacheln und Aktionszustände
- Kinderprofile, Tablet- und Mobilansichten
- Aufgabenbestätigung durch Erwachsene vor der Punktevergabe
- Rezeptimport aus Schema.org-, h-recipe- und unterstützten Pinterest-Seiten
- Rezeptbilder und verständlichere Reihenfolge der Zubereitungsschritte
- Pinnwandbilder, Familiennetz und Stammbaum
- profilgebundene Web-Push-Einstellungen und mobiler Chat

### Update und Daten

- automatische Datenbankmigration auf Schema 5
- bestehende Profile, Termine, Aufgaben, Rezepte, Listen, Bilder,
  Integrationen und Einstellungen bleiben erhalten
- Docker-Updater mit Sicherung, Migrationssimulation, Versionsprüfung,
  Datenvergleich und automatischem Rollback

### Aktualisieren

- Windows/Docker: `Update-Familienplaner.cmd`
- Linux/Docker: `bash scripts/docker-update.sh`
