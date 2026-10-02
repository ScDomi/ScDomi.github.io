# Video-Loops für die fliegenden 3D-Screens

Die Screens auf der scryx-Seite spielen optionale Video-Loops ab (statt Standbild).

## Welche Datei wohin

Im Spine-Screen-Setup ([assets/spine-scene.js](../spine-scene.js), `projectScreens`) steht pro Projekt
ein 5. Eintrag — der Videopfad. `null` = nur Standbild. Aktuell verdrahtet:

| Datei                    | Screen          |
|--------------------------|-----------------|
| `gesture-loop.mp4`       | gesture vision  |
| `rl-loop.mp4`            | dqn racing      |

Für weitere Screens einfach Pfad in `projectScreens` ergänzen und Datei hier ablegen.

## Spec

- **Auflösung:** 960×540 (reicht völlig — Screen ist ~1.9 world units breit)
- **Dauer:** 5–15 s, nahtlos loopbar (letzter Frame ≈ erster Frame)
- **Codec:** H.264 in MP4 (Safari-sicher). Optional zusätzlich `.webm` (VP9) — dann Pfad auf webm zeigen lassen.
- **Ton:** keiner (Videos laufen stumm, autoplay-fähig)
- **Größe:** ≤ 2–3 MB pro Clip (Bitrate ~800–1500 kbps reicht bei 540p)

## Export-Beispiele

ffmpeg — MP4, loop-freundlich, stumm:

```sh
ffmpeg -i input.mov -vf "scale=960:540:force_original_aspect_ratio=increase,crop=960:540" \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -movflags +faststart \
  gesture-loop.mp4
```

Optional WebM:

```sh
ffmpeg -i input.mov -vf "scale=960:540" -an -c:v libvpx-vp9 -b:v 900k -crf 34 gesture-loop.webm
```

## Verhalten ohne Datei

Fehlt eine Video-Datei (404), fällt der Screen automatisch auf das Standbild/Canvas-Poster
zurück — kein Fehler, kein schwarzer Screen. Videos starten lazy und spielen nur, wenn sie
geladen sind.
