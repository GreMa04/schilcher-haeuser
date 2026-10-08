# SCHILCHER HÄUSER – Demo-Website

Präsentationsversion (Light-Version) der One-Page-Website für das Projekt
SCHILCHER HÄUSER, Grünbaumgartenweg, Wald Süd, 8510 Stainz.

Reines HTML/CSS/JavaScript – kein Build, kein Backend, keine Datenbank.

## Starten

**Variante 1 – einfach öffnen:** `index.html` per Doppelklick im Browser öffnen.

**Variante 2 – lokaler Server (empfohlen für die Präsentation):**

```bash
npx serve .
```

oder mit Python:

```bash
python -m http.server 8080
```

Dann `http://localhost:3000` (serve) bzw. `http://localhost:8080` öffnen.

> Hinweis: Schriften (Google Fonts) und Musterbilder (Unsplash) werden online
> geladen – für die Präsentation wird eine Internetverbindung benötigt.

## Struktur

```
index.html        Seite inkl. aller Sektionen und Modals
css/styles.css    Design (Farben, Typografie, Layout, Responsive)
js/images.js      ALLE Bild-URLs zentral – hier Bilder austauschen
js/data.js        Daten der 8 Häuser (Flächen, Status, Texte)
js/main.js        Navigation, Modals, Formulare, Masterplan, Karte
wein.html         Unterseite Wein & Schilcher (Weingüter Langmann, Trapl)
kulinarik.html    Unterseite Kulinarik (Rauch-Hof, Buschenschänke)
```

## Inhalte anpassen

- **Bilder:** in `js/images.js` die URL ersetzen. Eigene Renderings z. B. nach
  `img/` legen und `"img/hero.jpg"` eintragen.
- **Häuser:** in `js/data.js`. Grundstücksflächen entsprechen dem Teilungsplan
  (Gst. 554/1–554/8, KG Wald). Wohnfläche, Terrasse und Zimmer sind **Musterwerte**.
  Status: `"verfuegbar"`, `"reserviert"` oder `"verkauft"` (Punktfarbe ändert sich automatisch).
- **Farben/Schriften:** CSS-Variablen am Anfang von `css/styles.css`.

## Demo-Funktionen

- Sticky Navigation mit Smooth Scrolling, Hamburger-Menü mobil
- Haus-Modal (Klick auf Karte) mit Vor/Zurück (auch Pfeiltasten)
- Exposé- und Termin-Modal mit Erfolgsmeldung – **es werden keine Daten versendet oder gespeichert**
- Masterplan: Hover hebt Grundstück und Nummer hervor, Klick markiert das Haus in der Häuser-Sektion
- Impressum/Datenschutz als Platzhalter-Modals

## Vor einer echten Veröffentlichung

- Impressum und Datenschutzerklärung ergänzen
- Formulare an einen echten Versand (z. B. Formular-Service) anbinden
- Musterbilder durch eigene Renderings/Fotos ersetzen, Musterwerte durch echte Planwerte
