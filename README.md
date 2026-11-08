# Dein erstes Rezeptbuch

## Starten

Öffne das [Rezeptbuch auf GitHub Pages](https://niclasgr256.github.io/RezepteApp/). Für die lokale Nutzung kannst du weiterhin `index.html` im Projektordner öffnen.

1. Gib einen Rezeptnamen, die Zutaten und die Zubereitung ein.
2. Klicke auf „Rezept speichern“.
3. Klicke in der Liste auf den Rezeptnamen, um die Details aufzuklappen.
4. Nutze das Suchfeld, um nach Namen zu suchen.
5. Lade die Seite neu: Dein Rezept sollte weiterhin da sein.

## Bearbeiten, Löschen und Fotos

- Klappe ein Rezept auf und klicke auf „Bearbeiten“. Das Formular enthält dann deine bisherigen Angaben. Mit „Änderungen speichern“ aktualisierst du das Rezept; „Bearbeiten abbrechen“ lässt das gespeicherte Rezept unverändert.
- Mit „Löschen“ entfernst du ein Rezept nach einer Sicherheitsabfrage dauerhaft.
- Wähle im Formular unter „Rezeptfoto“ ein JPG-, PNG- oder WebP-Bild (maximal 15 MB). Auf unterstützten Handys bietet die Dateiauswahl auch die Kamera an. Eine Vorschau erscheint vor dem Speichern.
- Fotos werden automatisch auf höchstens 1000 Pixel pro Seite verkleinert und zusammen mit dem Rezept gespeichert. Du kannst sie beim Bearbeiten ersetzen oder entfernen. Bereits vorhandene Rezepte ohne Foto funktionieren weiterhin.
- Der Browser bietet nur begrenzten Speicherplatz. Wenn er voll ist, zeigt die App eine Fehlermeldung und behält deine Eingaben. Entferne dann gegebenenfalls das ausgewählte Foto und speichere erneut.

## Labels und Filter

Im Rezeptformular kannst du mehrere Labels ankreuzen:

- Mahlzeit: Frühstück, Mittagessen, Abendessen, Snack.
- Gericht: Suppe, Salat, Hauptgericht, Dessert, Backen.
- Aufwand: Schnell (bis 30 Min.), Einfach.
- Ernährung: Vegetarisch, Vegan.

Du vergibst die Labels selbst. Sie werden nicht automatisch aus den Zutaten erkannt. Für ein veganes Rezept kannst du zusätzlich „Vegetarisch“ auswählen, damit es unter beiden Filtern erscheint.

Über der Rezeptliste findest du dieselben Labels als Filter. Alle ausgewählten Labels müssen passen: „Mittagessen“ und „Schnell (bis 30 Min.)“ zeigen zum Beispiel nur schnelle Mittagessen. Die Namenssuche lässt sich damit kombinieren. „Suche und Filter zurücksetzen“ zeigt wieder alle Rezepte.

Deine bisherigen Rezepte bleiben erhalten und haben zunächst keine Labels. Über „Bearbeiten“ kannst du sie nachträglich zuordnen. Nach dem Speichern werden Suche und Filter zurückgesetzt, damit das gespeicherte Rezept sichtbar ist.

## Portionen umrechnen

Gib im Formular unter „Ursprüngliche Portionen“ an, für wie viele Portionen deine Zutaten gelten. Beim aufgeklappten Rezept kannst du unter „Kochen für … Portionen“ eine andere Zahl eingeben. Die Zutaten passen sich sofort an: 200 g für 2 Portionen werden für 3 Portionen zu 300 g; 200 g für 4 Portionen werden zu 150 g.

Schreibe die Menge an den Anfang jeder Zutatenzeile, zum Beispiel `200 g Mehl`, `1,5 EL Öl`, `1/2 TL Salz`, `½ TL Salz` oder `1 1/2 Liter Wasser`. Dezimalzahlen mit Punkt funktionieren ebenfalls. Die Anzeige wird bei Bedarf gerundet. Ganze Portionen von 1 bis 1000 sind möglich.

Text ohne eindeutige Anfangsmenge und Mengenbereiche wie `2–3 Eier` bleiben unverändert. Zahlen innerhalb einer Zeile, etwa die Grammzahl einer Packung, und Zahlen in der Zubereitung werden nicht umgerechnet. Die App weist darauf hin. Bruchteile von Eiern oder Packungen musst du praktisch anpassen.

Die Umrechnung verändert nur die Anzeige, nicht das gespeicherte Original. Bei alten Rezepten wird keine Portionszahl geraten: Öffne „Bearbeiten“, trage die ursprüngliche Portionszahl ein und speichere.

## Dateien im Überblick

- `index.html`: der Inhalt und die Struktur – Überschriften, Formular und Rezeptliste.
- `style.css`: das Aussehen – Farben, Abstände und die Ansicht auf dem Handy.
- `app.js`: das Verhalten – Speichern, Anzeigen und Suchen.
- `portions.js`: das Erkennen und Umrechnen von Zutatenmengen.
- `cloud.js`: Supabase-Verbindung und Datenbankzugriffe.
- `supabase-schema.sql`: Tabelle und Zugriffsregeln für Rezepte.

Zum Lernen kannst du `index.html` im Editor öffnen und „Mein Rezeptbuch“ durch einen eigenen Namen ersetzen. Speichere die Datei und lade die Seite im Browser neu.

## Wo liegen meine Rezepte?

Melde dich auf der veröffentlichten Seite über einen E-Mail-Link an. Verwende dazu die E-Mail-Adresse deines Supabase-Teams. Angemeldet speichert die App deine Rezepte und Fotos in Supabase. Wenn du die Seite auf einem anderen Gerät mit demselben Konto öffnest, lädt sie dieselben Rezepte. Die Datenbank erlaubt jedem Konto ausschließlich Zugriff auf seine eigenen Rezepte.

Ohne Anmeldung speichert die App weiterhin lokal im aktuellen Browser. Beim Löschen der Browserdaten können lokale Rezepte verloren gehen.

## Lokale Rezepte übernehmen

- Wenn du deine Rezepte bereits auf der GitHub-Pages-Adresse gespeichert hast, melde dich dort im gleichen Browser an und wähle „Rezepte aus diesem Browser ins Konto kopieren“.
- Wenn du die App bisher als lokale `index.html` geöffnet hast, öffne die aktualisierte Datei am bisherigen Speicherort im gleichen Browser und wähle „Lokale Rezepte als Datei exportieren“. Melde dich danach auf GitHub Pages an und wähle die Datei bei „Exportdatei ins Konto kopieren“ aus.
- Der Import kopiert die Rezepte einschließlich Fotos. Bei einer Wiederholung werden bereits kopierte Rezepte anhand des ursprünglichen Inhalts erkannt.
