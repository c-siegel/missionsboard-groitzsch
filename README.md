# Missionsboard Klimawandel (Groitzsch)

Schreibgeschützte Online-Ansicht der Excalidraw-Mindmap: https://c-siegel.github.io/missionsboard-groitzsch/

- Zoomen, verschieben, Links öffnen und YouTube-Videos ansehen – keine Änderungen möglich.
- `qr-code.png` führt direkt zur Seite.

**Aktualisieren:** neue Version in Excalidraw exportieren, als `mindmap.excalidraw` hier ablegen, committen und pushen.

## Technik

Die Seite nutzt eine selbst gebaute, leicht angepasste Version von [Excalidraw](https://github.com/excalidraw/excalidraw) (MIT-Lizenz, siehe `assets/EXCALIDRAW-LICENSE.txt`): Link-Symbole werden nicht gezeichnet; Links öffnen sich durch Antippen der Karte. Alles inkl. Schriften liegt in `assets/` – es werden keine fremden Server außer YouTube (für die Videos) geladen.

Nach Änderungen an `src/main.js` neu bauen:

```
cd build && npm install && npm run build
```
