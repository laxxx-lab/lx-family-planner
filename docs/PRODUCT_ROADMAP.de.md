# Produkt-Roadmap

## Bereits umgesetzt

- rollenabhängige Erwachsenen-, Kinder- und Tablet-Oberflächen
- frei wählbare Familienpositionen wie Mama, Papa, Kind, Oma und Opa
- getrennte Themenwelten für Kinder und Erwachsene
- Missionen, Sterne, Belohnungen und Stimmungs-Check-in
- Vier-Augen-Freigabe für erledigte Kinderaufgaben
- Kalender, Mülltermine, Einkauf, Rezepte, Essensplan, Pinnwand und Chat
- mobile Chat-Oberfläche und responsive Bubble-Profilauswahl
- Elternzentrale und kindgerechte Medienlinks
- Familiennetz und Beziehungen zwischen Familienkonten
- Bring!-, ICS-, Gotify- und profilgebundene Web-Push-Anbindung
- Home-Assistant-Dashboard mit Profilfreigaben und sicheren Aktionen
- optionale Nextcloud-Family-Cloud mit Zwei-Wege-Kalender, Familienordner und
  verschlüsselten, familiengetrennten Sicherungen
- profilgetrenntes Meldungszentrum mit gelesen/ungelesen und 90-Tage-Verlauf
- persönlicher Familien-Posteingang mit live erzeugtem Tagesüberblick
- verschlüsselte, stündlich aktualisierte ICS-Kalenderabonnements mit
  Wiederholungen, Ausnahmen, Ganztagsterminen und Zeitzonen
- wiederkehrende Aufgaben für tägliche, werktägliche, wöchentliche und
  monatliche Abläufe
- pro Profil und Gerät anpassbare Dashboard- und Tablet-Kacheln
- sichere, familiengetrennte Datenhaltung und transaktionale Punktebuchung

## Nächste sinnvolle Produktstufe

### Priorität 1 – Betrieb und Verlässlichkeit

1. **Einladungslinks statt öffentlicher Familienauswahl**  
   Neue Geräte treten über einen zeitlich begrenzten Familiencode bei. Ein
   öffentlich erreichbarer Server muss dann keine Familiennamen anzeigen.

2. **Telegram-Bot mit Profilkopplung per QR-Code**  
   Die Eltern tragen genau einmal den Bot-Token in der Elternzentrale ein.
   Jedes Profil erhält einen kurzlebigen QR-/Start-Link. Nach einem Klick auf
   „Start“ ordnet der Server den Telegram-Chat dem Profil zu. Benachrichtigungen,
   Ruhezeiten und Inhalte bleiben pro Profil steuerbar.

3. **Geführte Cloud-Wiederherstellung**
   Die bereits automatisch in Nextcloud gespeicherten Familienarchive
   auswählen, prüfen und zunächst in einer isolierten Testdatenbank
   wiederherstellen.

4. **Offline-fähige Kernfunktionen**
   Kalender, Einkauf und Aufgaben bleiben ohne Verbindung lesbar. Änderungen
   werden später mit sichtbarer Konfliktauflösung synchronisiert.

### Als Nächstes – Kalender und NAS

1. **Kalender komfortabler machen**
   Einen bestehenden lokalen Termin duplizieren und anpassen, anschließend
   Wiederholungen für selbst angelegte Termine ergänzen. Darauf baut eine echte
   Stundenansicht für Tag und Woche auf: Dauer, parallele Termine und
   Überschneidungen werden direkt sichtbar.

   Die Wochenansicht zeigt nun die vollständige 00:00–24:00-Zeitskala im
   normalen Seitenfluss. Frühe und späte Termine bleiben dadurch sichtbar.

   Der generische CalDAV-Zugang bietet inzwischen wahlweise Nur-Lesen oder
   einen ETag-geschützten Zwei-Wege-Abgleich mit genau einem schreibenden
   Zielkalender. Als nächste Härtung folgen eine breitere Server-Matrix und eine
   geführte Kalenderauswahl statt der manuellen Collection-Adresse.

2. **Generische WebDAV-Family-Cloud**
   Neben Nextcloud eine schlanke NAS-/WebDAV-Verbindung anbieten: Ordner
   anzeigen und anlegen, Dateien hoch- und herunterladen, Vorschau und
   Löschen. Zugangsdaten bleiben verschlüsselt im LX-Server; soweit möglich
   wird ein App-Passwort verwendet. Nextcloud-spezifische Funktionen wie
   automatische Konten, Speicheranzeige, Browser-Ansicht, Sicherungen und
   Zwei-Wege-Kalendersync bleiben bewusst getrennt. Der isolierte und getestete
   DAV-Client auf dem Server deckt Verbindungsprüfung und Dateioperationen
   inzwischen ab. Vor der Freigabe für Familien fehlen noch die verschlüsselte
   Integrationsspeicherung, API-Routen und die Einstellungsoberfläche.

### Aus Feedback eingesammelt (GitHub-Issues und Reddit)

Die Hauptanliegen der Issues #3 und #11 sind vollständig umgesetzt (Profilwechsel,
Home Assistant, Cloud-Fehler, ntfy, Module ausblenden, schlichte Themes, Custom
CSS, Erwachsenen-Profile, gemeinsame Aufgaben, Rezeptbearbeitung mit
Tandoor-Import, dynamische Müll-Kachel und schreibgeschütztes Wanddisplay-Profil).
Diese Sammlung führt nur noch die **offenen Nachträge** aus den Kommentarthreads
sowie das neue Issue #15 und das Reddit-Feedback auf.

**Zuerst anzugehende Bugs (hoher Effekt, geringer Aufwand):**

- „Heute im Blick" zeigt nicht die Anzahl heutiger Termine, sondern alle
  Termine im Kalender (mobil 17, Web 19) – #15.
- Android: Zurück- bzw. Wischgeste beendet die App, statt in der App
  zurückzunavigieren; Capacitor Hardware-Back-Historie – #15.
- „Meine Termine" in „Mein Bereich" startet Mitte Juni statt heute, während
  der Tabletmodus korrekt zeigt – #11 (Kommentar).
- Mir zugewiesene Termine werden als „Familientermin" ausgezeichnet – #15.
- Darstellungsfehler im Ansichtsatelier – #15.
- Tab-Leiste verschiebt sich beim Wechsel um einige Pixel, der letzte Tab
  (z. B. Pinwand) wird in Browsern wie Firefox abgeschnitten – #3 (Kommentar).
- Dialog „Familie erstellen" bleibt nach Name und Passwort hängen
  (Next → nichts passiert) – Reddit.

**Mobile und Kalender (überwiegend aus #15):**

- Begrüßungsfeld kompakter, einheitliches Layout in allen Untermenüs – #15.
- Müllabfuhrtermine desselben Tages bündeln (mehrere Tonnen unter einem
  Eintrag) – #15.
- Farbcodierung nicht nur in der Kalenderansicht, sondern auch in Listen und
  Übersichten – #15.
- Echte Wochen- und Monatsansicht, damit freie Zeitfenster sichtbar werden – #15.
- Konsistente Navigation: Karten öffnen sich auf Web und Mobil per Klick,
  nicht nur auf Mobil – #15.

**Tablet (Nachtrag zu #11):**

- Flexible Tablet-Aufgabenliste (4 / 8 / alle) mit Scrollbar und
  Priorisierung/Sortierung statt festem Limit von 4 – #11 (Kommentar).

**Integrationen und Import:**

- Import aus Google Calendar und iCloud-Konten – Reddit.
- Müllkalender per URL abonnieren statt nur ICS-Datei hochladen – #11
  (Kommentar).
- Optionale Anbindungen an Mealie (Essen/Einkauf), Immich (Medien) und
  Paperless-ngx (Dokumente) – Reddit.
- Benutzerdefinierte Wiederholungen (jährlich, vierteljährlich) für
  Wartungsaufgaben – Reddit.

### Priorität 2 – hoher Familiennutzen

1. **Morgen- und Abendroutinen für Kinder**  
   Bildbasierte Checklisten, Timer und kleine Serien-Badges ohne
   leistungsorientierten Druck.

2. **Familienrat**  
   Wünsche sammeln, gemeinsam abstimmen und Entscheidungen direkt mit einem
   Termin oder einer Aufgabe verbinden.

3. **Vorratskammer**  
   Häufige Artikel, Mindestbestand und automatische Einkaufsvorschläge aus dem
   Essensplan.

4. **Betreuungs- und Abholplan**  
   Wer bringt oder holt welches Kind; mit eindeutiger Übergabe,
   Konfliktwarnung und optionaler Erinnerung.

5. **Ruhezeiten und Benachrichtigungsregeln**  
   Meldungen nach Profil, Priorität, Kanal und Tageszeit bündeln.

### Optional

- freiwillige Android-Standortfreigabe innerhalb der Familie: sichtbarer
  Tracking-Status, Pause pro Profil, keine Drittanbieter-Cloud und in der
  ersten Version keine Standort-Historie; Ankunftshinweise und kurze
  Aufbewahrung erst nach einem geprüften Einwilligungs- und Akkukonzept
- WhatsApp nur über die offizielle WhatsApp Business Platform
- optionale Cosmos-OpenID-Connect-Anmeldung mit ausdrücklicher
  Profilverknüpfung, automatischer Anlage des ersten Profils und sorgfältig
  zugeordneten Cosmos-Gruppen
- Sprach-Schnelleingabe in der Küche
- Geburtstags- und Geschenkideenliste
- Taschengeld mit freigegebenen Sparzielen
- Familienalbum aus erledigten Ausflügen und besonderen Momenten
- saisonale Haushalts-Checklisten
- direkte Google-/Outlook-Kontokopplung zusätzlich zum vorhandenen
  CalDAV-/Nextcloud-Schreibzugriff
- barrierearme Großelternansicht mit besonders großen Bedienelementen
- native iOS-App neben der bestehenden Android- und Web-Version
- weitere Sprachen (z. B. Französisch, Spanisch, Italienisch) über ein
  geprüftes, betreutes Übersetzungs-Catalogue

## Produktprinzipien

- Kinder werden unterstützt, nicht überwacht.
- Private Inhalte werden bereits auf dem Server nach Profil gefiltert.
- Jede wichtige Aktion muss mobil mit höchstens wenigen Schritten erreichbar
  sein.
- Belohnungen bleiben positiv; Sterne fallen nie unter null.
- Integrationen sind optional, pro Profil steuerbar und vollständig trennbar.
- Inoffizielle Automatisierung persönlicher Messenger-Konten ist kein
  Produktionsweg.
