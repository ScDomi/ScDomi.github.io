# Domi Blog (GitHub Pages)

Static Blog ohne Build-Tool.

## Struktur (erweiterbar)

- `assets/content.js`: zentrale Inhalte (Posts, Badges, About-Items, Mood-Texte)
- `assets/render.js`: rendert Listen/Badges aus `content.js`
- `assets/mood.js`: Mood-Switcher (Chaos/Focus/Night)
- `assets/theme.js`: Theme-Switcher (Main/Neon/Brutal/Street/Soft)
- `index.html`: nur Layout-Shell + Platzhalter-Container

## Schnell erweitern

1. Neuer Post: Eintrag in `assets/content.js` unter `posts` ergänzen.
2. Neue Badge: `heroBadges` erweitern.
3. About-Zeile ändern: `aboutItems` anpassen.
4. Mood-Text ändern: `moods`-Objekt anpassen.

## Deploy auf GitHub Pages

1. Änderungen committen und pushen.
2. GitHub Pages baut automatisch von `main` + `/`.
3. Live unter `https://scdomi.github.io/`.
